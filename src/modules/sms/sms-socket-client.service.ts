import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { SmsLogService } from '../sms-log/sms-log.service';
import { SmsGateway, SmsStatusUpdate } from './gateways/sms.gateway';
// Structure exacte renvoyée par l'API externe
interface SmsStatusBroadcast {
  received?: boolean;
  updatedSms: {
    _id: string; // ID du SMS dans l'API externe
    phone: string;
    message: string; // Contenu du SMS
    status: string; // Peut être 'draft' | 'pending' | 'received' | 'failed' | 'SENT' | 'FAILED' | etc.
    isDraft: boolean;
    projectId?: string;
    secretId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}
@Injectable()
export class SmsSocketClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsSocketClientService.name);
  private socket: Socket | null = null;
  private readonly apiBaseUrl: string;
  private readonly secretId: string;
  private readonly projectId: string;
  constructor(
    private configService: ConfigService,
    private smsLogService: SmsLogService,
    private smsGateway: SmsGateway,
  ) {
    // Extract base URL from API_SMS_URL (remove /api/sms/multi)
    const apiSmsUrl = this.configService.get<string>('API_SMS_URL') || '';
    this.apiBaseUrl = apiSmsUrl.replace(/\/api\/sms\/multi$/, '');
    this.secretId = this.configService.get<string>('X_SECRET_ID') || '';
    this.projectId = this.configService.get<string>('X_PROJECT_ID') || '';
  }
  onModuleInit() {
    this.connectToExternalApi();
  }
  onModuleDestroy() {
    this.disconnect();
  }
  private connectToExternalApi() {
    if (!this.apiBaseUrl) {
      this.logger.warn(
        'API_SMS_URL not configured, SMS status updates will not be received',
      );
      return;
    }

    this.logger.log(`Connecting to external SMS API at ${this.apiBaseUrl}`);
    this.logger.log(
      `Auth credentials - Secret ID: ${this.secretId ? '✓' : '✗'}, Project ID: ${this.projectId ? '✓' : '✗'}`,
    );

    this.socket = io(this.apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // IMPORTANT: L'API externe exige phoneId et phoneName dans les query params
      // Notre backend n'est pas un téléphone, mais un listener, donc on utilise des valeurs fixes
      query: {
        phoneId: `listener_${this.projectId}`,
        phoneName: 'Backend SMS Listener',
        codeSms: this.secretId,
      },
      auth: {
        'x-secret-id': this.secretId,
        'x-project-id': this.projectId,
      },
      extraHeaders: {
        'x-secret-id': this.secretId,
        'x-project-id': this.projectId,
      },
    });

    this.socket.on('connect', () => {
      this.logger.log('✓ Connected to external SMS API for status updates');
      this.logger.log(`Socket ID: ${this.socket?.id}`);
      this.logger.log(
        `Query params: phoneId=${`listener_${this.projectId}`}, phoneName=Backend SMS Listener`,
      );
    });
    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`✗ Disconnected from external SMS API: ${reason}`);
      if (reason === 'io server disconnect') {
        this.logger.warn(
          '⚠️  Server disconnected us - possible auth issue or namespace mismatch',
        );
      }
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(
        `✗ Connection error to external SMS API: ${error.message}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
    });

    // Log all incoming events for debugging
    this.socket.onAny((eventName, ...args) => {
      this.logger.debug(`📩 Received event: ${eventName}`, args);
    });

    // Listen for SMS status broadcasts from external API
    this.socket.on('sms-status-broadcast', async (data: SmsStatusBroadcast) => {
      this.logger.log(
        `📨 Received SMS status broadcast: ${JSON.stringify(data)}`,
      );
      await this.handleSmsStatusUpdate(data);
    });

    // Listen for potential error events from server
    this.socket.on('error', (error) => {
      this.logger.error(`Server error: ${JSON.stringify(error)}`);
    });

    this.socket.on('exception', (error) => {
      this.logger.error(`Server exception: ${JSON.stringify(error)}`);
    });
  }
  private async handleSmsStatusUpdate(data: SmsStatusBroadcast) {
    try {
      const { updatedSms } = data;
      if (!updatedSms || !updatedSms._id) {
        this.logger.warn('Invalid SMS status broadcast received');
        return;
      }

      // Map external status to our status enum
      // L'API peut envoyer le statut en minuscules OU en majuscules
      const statusLower = updatedSms.status.toLowerCase();
      const statusMap: Record<string, string> = {
        pending: 'PENDING',
        received: 'SENT', // Le mobile confirme que le SMS a été envoyé
        sent: 'SENT', // Parfois l'API envoie déjà en majuscules
        failed: 'FAILED',
        draft: 'PENDING',
      };

      const mappedStatus = statusMap[statusLower] || 'PENDING';

      // updatedSms._id correspond au messageId retourné lors de l'envoi
      // et stocké dans notre champ smsServerId
      const updatedLog = await this.smsLogService.updateStatusByMessageId(
        updatedSms._id, // messageId de l'API externe
        mappedStatus,
        {
          errorMessage:
            updatedSms.status === 'failed' ? 'SMS delivery failed' : undefined,
        },
      );

      if (updatedLog) {
        // Emit status update to connected frontend clients
        const statusUpdate: SmsStatusUpdate = {
          smsLogId: (updatedLog as any)._id?.toString() || '',
          messageId: updatedSms._id,
          status: mappedStatus as SmsStatusUpdate['status'],
          phone: updatedSms.phone,
          content: updatedSms.message,
          updatedAt: updatedSms.updatedAt || new Date().toISOString(),
          errorMessage:
            updatedSms.status === 'failed' ? 'SMS delivery failed' : undefined,
        };

        this.smsGateway.emitSmsStatusUpdate(statusUpdate);
        this.logger.log(
          `✅ SMS status updated and broadcasted: ${updatedSms._id} -> ${mappedStatus}`,
        );
      } else {
        this.logger.warn(
          `⚠️  SMS log not found for messageId: ${updatedSms._id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error handling SMS status update: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.logger.log('Disconnected from external SMS API');
    }
  }
}
