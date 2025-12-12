import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsLogService } from './sms-log.service';
import { SmsLogController } from './sms-log.controller';
import { SmsLog, SmsLogSchema } from './schemas/sms-log.schema';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SmsLog.name, schema: SmsLogSchema }]),
    forwardRef(() => SmsModule),
  ],
  controllers: [SmsLogController],
  providers: [SmsLogService],
  exports: [SmsLogService],
})
export class SmsLogModule {}
