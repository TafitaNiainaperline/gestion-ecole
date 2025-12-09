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
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { UserRole } from '../commons/enums';

@Controller('api/notifications')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private schedulerService: NotificationSchedulerService,
  ) {}

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get()
  async findAll() {
    return this.notificationService.findAll();
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.notificationService.findById(id);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.notificationService.updateStatus(id, body.status);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Put(':id/mark-sent')
  async markAsSent(@Param('id') id: string) {
    return this.notificationService.markAsSent(id);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Post(':id/send-now')
  async sendNow(@Param('id') id: string) {
    return this.schedulerService.sendNow(id);
  }
}
