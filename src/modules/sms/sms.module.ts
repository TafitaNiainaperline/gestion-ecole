import { Module, forwardRef } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { SmsGateway } from './gateways/sms.gateway';
import { SmsSocketClientService } from './sms-socket-client.service';
import { SmsWebhookController } from './sms-webhook.controller';
import { SmsLogModule } from '../sms-log/sms-log.module';

@Module({
  imports: [forwardRef(() => SmsLogModule)],
  controllers: [SmsController, SmsWebhookController],
  providers: [SmsService, SmsGateway, SmsSocketClientService],
  exports: [SmsService, SmsGateway],
})
export class SmsModule {}
