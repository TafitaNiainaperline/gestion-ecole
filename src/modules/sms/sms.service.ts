import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsResultDto, MultiSmsResponseDto } from './dto/multi-sms.dto';
import {
  SmsApiResponse,
  ExternalApiSmsItem,
  ExternalApiResponse,
} from './interfaces';

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
    return phone.replace(/\s+/g, '').replace(/^\+261/, '0');
  }
  async sendSms(phoneNumber: string, message: string): Promise<SmsApiResponse> {
    const bulkResult = await this.sendBulkSms([phoneNumber], message);

    // Convert bulk response to single SMS response
    return {
      success: bulkResult.success,
      message: bulkResult.message,
      messageId: bulkResult.messageIds?.[0],
      messageIds: bulkResult.messageIds,
      data: bulkResult.data,
      error: bulkResult.error,
    };
  }
  async sendBulkSms(
    phoneNumbers: string[],
    message: string,
  ): Promise<SmsApiResponse> {
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
      const data = (await response.json()) as ExternalApiResponse;
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
      const messageIds: string[] =
        data.messageIds ||
        data.data?.map((sms: ExternalApiSmsItem) => sms._id) ||
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

  async sendMultiSms(
    phones: string[],
    message: string,
  ): Promise<MultiSmsResponseDto> {
    const results: SmsResultDto[] = [];
    let sentCount = 0;
    let failedCount = 0;

    try {
      this.logger.log(
        `📤 Sending multi SMS to ${phones.length} recipients via REST`,
      );

      if (!this.apiUrl || !this.secretId || !this.projectId) {
        this.logger.error('SMS API configuration missing');
        // Return failure for all phones
        phones.forEach((phone) => {
          results.push({
            phone: this.formatPhoneNumber(phone),
            success: false,
            error: 'Configuration SMS manquante',
          });
          failedCount++;
        });
        return {
          success: false,
          message: 'Configuration SMS manquante',
          total: phones.length,
          sent: 0,
          failed: phones.length,
          results,
        };
      }

      const formattedPhones = phones.map((phone) =>
        this.formatPhoneNumber(phone),
      );

      // Call external API with all phones at once
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

      const data = (await response.json()) as ExternalApiResponse;
      this.logger.log(`📥 External API Response: ${JSON.stringify(data)}`);

      if (!response.ok) {
        this.logger.error(`SMS API error: ${JSON.stringify(data)}`);
        // All phones failed
        formattedPhones.forEach((phone) => {
          results.push({
            phone,
            success: false,
            error: data.message || "Erreur lors de l'envoi",
          });
          failedCount++;
        });
        return {
          success: false,
          message: data.message || "Erreur lors de l'envoi",
          total: phones.length,
          sent: 0,
          failed: phones.length,
          results,
        };
      }

      const smsItems: ExternalApiSmsItem[] = data.data || [];

      const smsItemsByPhone = new Map<string, ExternalApiSmsItem>();
      smsItems.forEach((item) => {
        const normalizedPhone = this.formatPhoneNumber(item.phone);
        smsItemsByPhone.set(normalizedPhone, item);
      });

      formattedPhones.forEach((phone) => {
        const smsItem = smsItemsByPhone.get(phone);

        if (smsItem) {
          const statusLower = smsItem.status?.toLowerCase() || '';
          ['pending', 'sent', 'received', 'delivered'].includes(statusLower);
          const isFailed = statusLower === 'failed';

          if (isFailed) {
            results.push({
              phone,
              success: false,
              smsLogId: smsItem._id,
              status: smsItem.status,
              error: 'SMS delivery failed',
            });
            failedCount++;
          } else {
            results.push({
              phone,
              success: true,
              smsLogId: smsItem._id,
              status: smsItem.status,
            });
            sentCount++;
          }
        } else {
          results.push({
            phone,
            success: false,
            error: 'Phone number not found in API response',
          });
          failedCount++;
        }
      });

      this.logger.log(
        `✅ Multi SMS completed: ${sentCount} sent, ${failedCount} failed`,
      );

      return {
        success: sentCount > 0,
        message: `SMS envoyés: ${sentCount} réussis, ${failedCount} échoués`,
        total: phones.length,
        sent: sentCount,
        failed: failedCount,
        results,
      };
    } catch (error) {
      this.logger.error('Failed to send multi SMS:', error);

      // Return failure for all phones
      phones.forEach((phone) => {
        results.push({
          phone: this.formatPhoneNumber(phone),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      return {
        success: false,
        message: 'Failed to send SMS',
        total: phones.length,
        sent: 0,
        failed: phones.length,
        results,
      };
    }
  }
}
