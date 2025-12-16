import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { SendImmediateDto } from './dto/send-immediate.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private schedulerService: NotificationSchedulerService,
  ) {}

  @Public()
  @Post('send-immediate')
  async sendImmediate(@Body() sendImmediateDto: SendImmediateDto) {
    return this.schedulerService.sendImmediate(sendImmediateDto);
  }
}
