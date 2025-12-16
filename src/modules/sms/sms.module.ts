import { Module, forwardRef } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { SmsLogModule } from '../sms-log/sms-log.module';

@Module({
  imports: [forwardRef(() => SmsLogModule)],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
