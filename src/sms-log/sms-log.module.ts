import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsLogService } from './sms-log.service';
import { SmsLog, SmsLogSchema } from './schemas/sms-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SmsLog.name, schema: SmsLogSchema }]),
  ],
  providers: [SmsLogService],
  exports: [SmsLogService],
})
export class SmsLogModule {}
