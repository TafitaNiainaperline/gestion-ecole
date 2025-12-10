import { Controller, Get, Param } from '@nestjs/common';
import { SmsLogService } from './sms-log.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('api/sms-logs')
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
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.smsLogService.findById(id);
  }
}
