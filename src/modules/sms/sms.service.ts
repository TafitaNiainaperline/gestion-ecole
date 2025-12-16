import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface SmsStatus {
  messageId: string | null;
  phone: string;
  status: 'SENT' | 'FAILED' | 'PENDING' | 'DELIVERED';
  error?: string;
}

export interface SmsApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
  messageIds?: string[];
  smsStatuses?: SmsStatus[];  
  invalidPhones?: string[];   // ← NEW: Invalid phone numbers that were filtered out
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
    return phone.replace(/\s+/g, '').replace(/^\+261/, '0');
  }

  private isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Must be exactly 10 digits and start with 032, 033, 034, 037, 038, or 039
    const validPrefixes = ['032', '033', '034', '037', '038', '039'];
    const hasValidPrefix = validPrefixes.some((prefix) =>
      formatted.startsWith(prefix),
    );
    const hasValidLength = formatted.length === 10;
    const isAllDigits = /^\d+$/.test(formatted);

    return hasValidPrefix && hasValidLength && isAllDigits;
  }
  async sendSms(phoneNumbers: string | string[], message: string): Promise<SmsApiResponse> {
    try {
      const isArray = Array.isArray(phoneNumbers);
      const phones = isArray ? phoneNumbers : [phoneNumbers];

      this.logger.log(`Sending SMS to ${phones.length} recipient(s)`);

      if (!this.apiUrl || !this.secretId || !this.projectId) {
        this.logger.error('SMS API configuration missing');
        return {
          success: false,
          message: 'Configuration SMS manquante',
        };
      }

      // Validate phone numbers and separate valid from invalid
      const validPhones = phones.filter((phone) =>
        this.isValidPhoneNumber(phone),
      );
      const invalidPhones = phones.filter(
        (phone) => !this.isValidPhoneNumber(phone),
      );

      if (invalidPhones.length > 0) {
        this.logger.warn(
          `⚠️ ${invalidPhones.length} invalid phone number(s): ${invalidPhones.join(', ')}`,
        );
      }

      if (validPhones.length === 0) {
        this.logger.error('No valid phone numbers to send SMS');
        return {
          success: false,
          message: 'Aucun numéro de téléphone valide',
        };
      }

      const formattedPhones = validPhones.map((phone) =>
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

      this.logger.log(`Full API Response: ${JSON.stringify(data)}`);

      if (!response.ok) {
        this.logger.error(`SMS API error: ${JSON.stringify(data)}`);
        return {
          success: false,
          message: data.message || "Erreur lors de l'envoi",
        };
      }

      this.logger.log(`SMS sent successfully to ${formattedPhones.length} recipient(s)`);

      // Extract messageIds
      const messageIds = data.messageIds ||
                        data.data?.map((sms: any) => sms._id) ||
                        data.data?.messageId ||
                        data.data?.messages?.map((m: any) => m.messageId) ||
                        [];

      this.logger.log(`Extracted messageIds: ${JSON.stringify(messageIds)}`);

      // ✅ NEW: Extract individual SMS statuses from API response
      const smsStatuses: SmsStatus[] = [];
      if (data.data && Array.isArray(data.data)) {
        this.logger.log(`🔍 Extracting statuses from ${data.data.length} SMS items`);

        for (let i = 0; i < data.data.length; i++) {
          const smsData = data.data[i];
          const apiStatus = smsData.status?.toLowerCase() || '';

          // Map API status to our internal status
          let status: 'SENT' | 'FAILED' | 'PENDING' | 'DELIVERED' = 'PENDING';

          // Status mappings from external API
          if (apiStatus === 'sent' || apiStatus === 'success' || apiStatus === 'ok') {
            status = 'SENT';
          } else if (apiStatus === 'delivered') {
            status = 'DELIVERED';
          } else if (apiStatus === 'error' || apiStatus === 'failed' || apiStatus === 'failure' || apiStatus === 'invalid') {
            status = 'FAILED';
          } else if (apiStatus === 'pending' || apiStatus === 'processing' || apiStatus === 'forfait_requis' || apiStatus === 'en attente de forfait') {
            status = 'PENDING';
          }
          // Default to PENDING if unknown status

          smsStatuses.push({
            messageId: smsData._id || messageIds[i] || null,
            phone: smsData.phone || formattedPhones[i] || '',
            status,
            error: smsData.error || smsData.message,
          });

          // 🔍 DETAILED LOG
          this.logger.log(
            `[${i}] RAW apiStatus="${smsData.status}" → MAPPED to="${status}" | phone=${smsData.phone} | hasMessageId=${!!smsData._id}`,
          );
        }

        this.logger.log(`📊 Final smsStatuses: ${JSON.stringify(smsStatuses)}`);
      }

      return {
        success: true,
        message: isArray ? `SMS sent to ${formattedPhones.length} recipients` : 'SMS sent successfully',
        messageId: messageIds[0],
        messageIds: messageIds,
        smsStatuses,  // ← NEW: Return individual statuses
        invalidPhones,  // ← NEW: Return invalid phone numbers
        data: {
          sent: formattedPhones.length,
          phones: formattedPhones,
          message,
          timestamp: new Date(),
          ...data,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS:`, error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
