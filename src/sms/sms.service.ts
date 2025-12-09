import { Injectable, Logger } from '@nestjs/common';
import * as AriarySDK from '@ariary/sdk';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private ariary: any;

  constructor() {
    // Initialize Ariary SDK with API key from environment
    const AriaryClient = (AriarySDK as any).default || AriarySDK;
    this.ariary = new AriaryClient({
      apiKey: process.env.ARIARY_API_KEY || '',
    });
  }

  async sendSms(phoneNumber: string, message: string): Promise<any> {
    try {
      this.logger.log(`Sending SMS to ${phoneNumber}`);

      const result = await this.ariary.sms.send({
        to: phoneNumber,
        message: message,
      });

      this.logger.log(`SMS sent successfully to ${phoneNumber}`);
      return {
        success: true,
        message: 'SMS sent successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error.message,
      };
    }
  }

  async sendBulkSms(phoneNumbers: string[], message: string): Promise<any> {
    try {
      this.logger.log(`Sending bulk SMS to ${phoneNumbers.length} recipients`);

      const results = await Promise.all(
        phoneNumbers.map((phoneNumber) =>
          this.sendSms(phoneNumber, message),
        ),
      );

      return {
        success: true,
        message: 'Bulk SMS sent',
        data: results,
      };
    } catch (error) {
      this.logger.error('Failed to send bulk SMS:', error);
      return {
        success: false,
        message: 'Failed to send bulk SMS',
        error: error.message,
      };
    }
  }
}
