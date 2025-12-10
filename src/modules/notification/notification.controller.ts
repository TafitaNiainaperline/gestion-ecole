import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Roles } from '../../commons/decorators/roles.decorator';
import { Role } from '../../commons/enums/role.enum';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('api/notifications')
@Roles(Role.ADMIN, Role.TEACHER)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private schedulerService: NotificationSchedulerService,
  ) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  async findAll() {
    return this.notificationService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.notificationService.findById(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.notificationService.updateStatus(id, body.status);
  }

  @Put(':id/mark-sent')
  async markAsSent(@Param('id') id: string) {
    return this.notificationService.markAsSent(id);
  }

  @Post(':id/send-now')
  async sendNow(@Param('id') id: string) {
    return this.schedulerService.sendNow(id);
  }
}
