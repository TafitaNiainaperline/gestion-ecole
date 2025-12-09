import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationController } from './notification.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { StudentModule } from '../student/student.module';
import { SmsModule } from '../sms/sms.module';
import { SmsLogModule } from '../sms-log/sms-log.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    StudentModule,
    SmsModule,
    SmsLogModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService],
  exports: [NotificationService, NotificationSchedulerService],
})
export class NotificationModule {}
