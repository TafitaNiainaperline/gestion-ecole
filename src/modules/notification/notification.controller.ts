import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('api/notifications')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private schedulerService: NotificationSchedulerService,
  ) {}

  @Public()
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.notificationService.findAll();
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.notificationService.findById(id);
  }

  @Public()
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.notificationService.updateStatus(id, body.status);
  }

  @Public()
  @Put(':id/mark-sent')
  async markAsSent(@Param('id') id: string) {
    return this.notificationService.markAsSent(id);
  }

  @Public()
  @Post(':id/send-now')
  async sendNow(@Param('id') id: string) {
    return this.schedulerService.sendNow(id);
  }
}
