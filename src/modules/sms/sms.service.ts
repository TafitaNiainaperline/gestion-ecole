import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface SmsApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
  messageIds?: string[];
  data?: any;
  error?: string;
}
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl: string;
  private readonly secretId: string;
  private readonly projectId: string;
  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('API_SMS_URL') || '';
    this.secretId = this.configService.get<string>('X_SECRET_ID') || '';
    this.projectId = this.configService.get<string>('X_PROJECT_ID') || '';
    if (!this.apiUrl || !this.secretId || !this.projectId) {
      this.logger.warn(
        'SMS API configuration incomplete. SMS sending may not work.',
      );
    } else {
      this.logger.log('SMS Service initialized with Ariary API');
    }
  }
  private formatPhoneNumber(phone: string): string {
    // Enlever espaces et convertir +261 en 0
    return phone.replace(/\s+/g, '').replace(/^\+261/, '0');
  }
  async sendSms(phoneNumber: string, message: string): Promise<SmsApiResponse> {
    try {
      this.logger.log(`Sending SMS to ${phoneNumber}`);
      if (!this.apiUrl || !this.secretId || !this.projectId) {
        this.logger.error('SMS API configuration missing');
        return {
          success: false,
          message: 'Configuration SMS manquante',
        };
      }
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-id': this.secretId,
          'x-project-id': this.projectId,
        },
        body: JSON.stringify({
          phones: [formattedPhone],
          message: message,
        }),
      });
      const data = await response.json();

      // 🔍 LOG: Log la réponse complète de l'API
      this.logger.log(`📥 Full API Response: ${JSON.stringify(data)}`);

      if (!response.ok) {
        this.logger.error(`SMS API error: ${JSON.stringify(data)}`);
        return {
          success: false,
          message: data.message || "Erreur lors de l'envoi",
        };
      }
      this.logger.log(`SMS sent successfully to ${formattedPhone}`);
      // Extract messageId from API response
      // L'API retourne { data: [{ _id: "...", phone: "...", ... }] }
      const messageId = data.messageId ||
                       data.data?.[0]?._id ||       // ← CORRECTION: L'API retourne _id dans data[0]
                       data.data?.messageId ||
                       data.data?.messages?.[0]?.messageId;

      this.logger.log(`Extracted messageId: ${messageId}`);

      return {
        success: true,
        message: 'SMS sent successfully',
        messageId,
        data: {
          phoneNumber: formattedPhone,
          message,
          timestamp: new Date(),
          ...data,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  async sendBulkSms(phoneNumbers: string[], message: string): Promise<SmsApiResponse> {
    try {
      this.logger.log(`Sending bulk SMS to ${phoneNumbers.length} recipients`);
      if (!this.apiUrl || !this.secretId || !this.projectId) {
        this.logger.error('SMS API configuration missing');
        return {
          success: false,
          message: 'Configuration SMS manquante',
        };
      }
      const formattedPhones = phoneNumbers.map((phone) =>
        this.formatPhoneNumber(phone),
      );
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-id': this.secretId,
          'x-project-id': this.projectId,
        },
        body: JSON.stringify({
          phones: formattedPhones,
          message: message,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        this.logger.error(`Bulk SMS API error: ${JSON.stringify(data)}`);
        return {
          success: false,
          message: data.message || "Erreur lors de l'envoi",
        };
      }
      this.logger.log(
        `Bulk SMS sent successfully to ${formattedPhones.length} recipients`,
      );
      // Extract messageIds from API response
      // L'API retourne { data: [{ _id: "...", phone: "..." }, ...] }
      const messageIds = data.messageIds ||
                        data.data?.map((sms: any) => sms._id) ||  // ← CORRECTION
                        data.data?.messageIds ||
                        data.data?.messages?.map((m: any) => m.messageId) ||
                        [];

      this.logger.log(`Extracted messageIds: ${JSON.stringify(messageIds)}`);

      return {
        success: true,
        message: 'Bulk SMS sent',
        messageIds,
        data: {
          sent: formattedPhones.length,
          timestamp: new Date(),
          phones: formattedPhones,
          ...data,
        },
      };
    } catch (error) {
      this.logger.error('Failed to send bulk SMS:', error);
      return {
        success: false,
        message: 'Failed to send bulk SMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
