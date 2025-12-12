import { Module, forwardRef } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsGateway } from './gateways/sms.gateway';
import { SmsSocketClientService } from './sms-socket-client.service';
import { SmsWebhookController } from './sms-webhook.controller';
import { SmsLogModule } from '../sms-log/sms-log.module';

@Module({
  imports: [forwardRef(() => SmsLogModule)],
  controllers: [SmsWebhookController],
  providers: [SmsService, SmsGateway, SmsSocketClientService],
  exports: [SmsService, SmsGateway],
})
export class SmsModule {}
