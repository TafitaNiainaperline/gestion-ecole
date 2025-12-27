import { Controller, Post, Body, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SmsLogService } from '../sms-log/sms-log.service';
import {
  SendMultiSmsDto,
  MultiSmsResponseDto,
  SmsResultDto,
  SendNotificationSmsDto,
  NotificationSmsResponseDto,
  NotificationSmsResultDto,
} from './dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('sms')
@ApiBearerAuth()
@Controller('sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly smsLogService: SmsLogService,
  ) {}

  @Public()
  @Post('multi')
  @ApiOperation({ summary: 'Send SMS to multiple phone numbers (simple)' })
  @ApiResponse({
    status: 200,
    description: 'SMS sent successfully',
    type: MultiSmsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid phone numbers or message',
  })
  async sendMultiSms(
    @Body() sendMultiSmsDto: SendMultiSmsDto,
  ): Promise<MultiSmsResponseDto> {
    this.logger.log(
      `📤 POST /sms/multi - Sending to ${sendMultiSmsDto.phones.length} recipients`,
    );

    const result = await this.smsService.sendMultiSms(
      sendMultiSmsDto.phones,
      sendMultiSmsDto.message,
    );

    this.logger.log(
      `✅ Multi SMS result: ${result.sent} sent, ${result.failed} failed`,
    );

    return result;
  }

  @Public()
  @Post('send-notification')
  @ApiOperation({
    summary: 'Send notification SMS with logging',
    description:
      'Send SMS to multiple recipients with full tracking. Creates SMS logs for each recipient.',
  })
  @ApiResponse({
    status: 200,
    description: 'SMS sent and logged successfully',
    type: NotificationSmsResponseDto,
  })
  async sendNotificationSms(
    @Body() dto: SendNotificationSmsDto,
  ): Promise<NotificationSmsResponseDto> {
    this.logger.log(
      `📤 POST /sms/send-notification - Type: ${dto.type}, Recipients: ${dto.recipients.length}`,
    );

    const phones = dto.recipients.map((r) => r.phone);
    const results: NotificationSmsResultDto[] = [];
    let sentCount = 0;
    let failedCount = 0;

    // Send all SMS via external API in one request
    const apiResult = await this.smsService.sendMultiSms(phones, dto.message);

    // Create a map of results by phone for a quick lookup
    const resultsByPhone = new Map<string, SmsResultDto>();
    apiResult.results.forEach((r) => {
      resultsByPhone.set(r.phone, r);
    });

    // Create SMS logs for each recipient
    for (const recipient of dto.recipients) {
      const formattedPhone = recipient.phone
        .replace(/\s+/g, '')
        .replace(/^\+261/, '0');
      const apiRes = resultsByPhone.get(formattedPhone);

      try {
        // Create SMS log entry
        const smsLog = await this.smsLogService.create({
          notificationId: null,
          notificationTitle: dto.title,
          notificationType: dto.type,
          parentId: recipient.parentId,
          studentId: recipient.studentId || null,
          phoneNumber: formattedPhone,
          message: dto.message,
          status: apiRes?.success ? 'SENT' : 'FAILED',
          smsServerId: apiRes?.smsLogId || null,
          errorMessage: apiRes?.error || null,
          sentAt: apiRes?.success ? new Date() : null,
        });

        const smsLogId = String(
          (smsLog as unknown as { _id: { toString(): string } })._id,
        );

        if (apiRes?.success) {
          sentCount++;
          results.push({
            phone: formattedPhone,
            success: true,
            smsLogId,
            externalSmsId: apiRes.smsLogId,
            status: apiRes.status || 'SENT',
            parentId: recipient.parentId,
            studentId: recipient.studentId,
          });
        } else {
          failedCount++;
          results.push({
            phone: formattedPhone,
            success: false,
            smsLogId,
            error: apiRes?.error || 'Unknown error',
            parentId: recipient.parentId,
            studentId: recipient.studentId,
          });
        }
      } catch (error) {
        this.logger.error(
          `Error creating SMS log for ${formattedPhone}:`,
          error,
        );
        failedCount++;
        results.push({
          phone: formattedPhone,
          success: false,
          error:
            error instanceof Error ? error.message : 'Error creating SMS log',
          parentId: recipient.parentId,
          studentId: recipient.studentId,
        });
      }
    }

    this.logger.log(
      `✅ Notification SMS completed: ${sentCount} sent, ${failedCount} failed`,
    );

    return {
      success: sentCount > 0,
      message: `SMS envoyés: ${sentCount} réussis, ${failedCount} échoués`,
      total: dto.recipients.length,
      sent: sentCount,
      failed: failedCount,
      results,
    };
  }
}
