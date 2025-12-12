import { Controller, Get, Param, Post } from '@nestjs/common';
import { SmsLogService } from './sms-log.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('sms-logs')
export class SmsLogController {
  constructor(private smsLogService: SmsLogService) {}

  @Public()
  @Get()
  async findAll() {
    return this.smsLogService.findAll();
  }

  @Public()
  @Get('stats')
  async getGlobalStats() {
    return this.smsLogService.getGlobalStats();
  }

  @Public()
  @Get('recent')
  async getRecentNotifications() {
    return this.smsLogService.getRecentNotifications(10);
  }

  @Public()
  @Get('history')
  async getHistory() {
    return this.smsLogService.getHistory();
  }

  @Public()
  @Get('failed')
  async getAllFailed() {
    return this.smsLogService.findAllFailed();
  }

  @Public()
  @Post('retry-all-failed')
  async retryAllFailed() {
    return this.smsLogService.retryAllFailed();
  }

  @Public()
  @Get('notification/:notificationId')
  async findByNotificationId(@Param('notificationId') notificationId: string) {
    return this.smsLogService.findByNotificationId(notificationId);
  }

  @Public()
  @Get('notification/:notificationId/stats')
  async getNotificationStats(@Param('notificationId') notificationId: string) {
    return this.smsLogService.getStats(notificationId);
  }

  @Public()
  @Post(':id/retry')
  async retrySingleSms(@Param('id') id: string) {
    return this.smsLogService.retrySingleSms(id);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.smsLogService.findById(id);
  }
}
