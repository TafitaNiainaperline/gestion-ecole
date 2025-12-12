import { Controller, Post, Body, Headers, Logger, HttpCode, UnauthorizedException } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { SmsLogService } from '../sms-log/sms-log.service';
import { SmsGateway, SmsStatusUpdate } from './gateways/sms.gateway';
import { ConfigService } from '@nestjs/config';

interface SmsWebhookPayload {
  messageId: string;
  status: 'sent' | 'delivered' | 'failed';
  phone: string;
  content?: string;
  updatedAt?: string;
  errorMessage?: string;
}

@Controller('sms-webhook')
export class SmsWebhookController {
  private readonly logger = new Logger(SmsWebhookController.name);
  private readonly secretId: string;
  private readonly projectId: string;

  constructor(
    private smsLogService: SmsLogService,
    private smsGateway: SmsGateway,
    private configService: ConfigService,
  ) {
    this.secretId = this.configService.get<string>('X_SECRET_ID') || '';
    this.projectId = this.configService.get<string>('X_PROJECT_ID') || '';
  }

  @Public()
  @Post('status-update')
  @HttpCode(200)
  async handleStatusUpdate(
    @Body() payload: SmsWebhookPayload,
    @Headers('x-secret-id') secretId: string,
    @Headers('x-project-id') projectId: string,
  ) {
    this.logger.log(`📥 Received webhook: ${JSON.stringify(payload)}`);

    // Vérifier l'authentification
    if (secretId !== this.secretId || projectId !== this.projectId) {
      this.logger.warn('❌ Unauthorized webhook request - invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      // Map external status to our status enum
      const statusMap: Record<string, string> = {
        sent: 'SENT',
        delivered: 'DELIVERED',
        failed: 'FAILED',
      };

      const mappedStatus = statusMap[payload.status] || 'PENDING';

      // Update SMS log in our database
      const updatedLog = await this.smsLogService.updateStatusByMessageId(
        payload.messageId,
        mappedStatus,
        {
          errorMessage: payload.errorMessage || (payload.status === 'failed' ? 'SMS delivery failed' : undefined),
        },
      );

      if (updatedLog) {
        // Emit status update to connected frontend clients
        const statusUpdate: SmsStatusUpdate = {
          smsLogId: (updatedLog as any)._id?.toString() || '',
          messageId: payload.messageId,
          status: mappedStatus as SmsStatusUpdate['status'],
          phone: payload.phone,
          content: payload.content,
          updatedAt: payload.updatedAt || new Date().toISOString(),
          errorMessage: payload.errorMessage,
        };

        this.smsGateway.emitSmsStatusUpdate(statusUpdate);
        this.logger.log(`✅ SMS status updated and broadcasted: ${payload.messageId} -> ${mappedStatus}`);

        return {
          success: true,
          message: 'Status updated successfully',
          messageId: payload.messageId,
          status: mappedStatus,
        };
      } else {
        this.logger.warn(`⚠️  SMS log not found for messageId: ${payload.messageId}`);
        return {
          success: false,
          message: 'SMS log not found',
          messageId: payload.messageId,
        };
      }
    } catch (error) {
      this.logger.error(`❌ Error handling webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Public()
  @Post('test')
  @HttpCode(200)
  async testWebhook(@Body() payload: any) {
    this.logger.log(`🧪 Test webhook received: ${JSON.stringify(payload)}`);
    return {
      success: true,
      message: 'Webhook endpoint is working',
      received: payload,
    };
  }
}
