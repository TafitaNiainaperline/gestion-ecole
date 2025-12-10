import { Module } from '@nestjs/common';
import { ConfigsModule } from './configs';
import { MongodbProviderModule } from './providers';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SmsModule } from './modules/sms/sms.module';
import { StudentModule } from './modules/student/student.module';
import { ParentModule } from './modules/parent/parent.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SmsLogModule } from './modules/sms-log/sms-log.module';
import { ClasseModule } from './modules/classe/classe.module';

@Module({
  imports: [
    ConfigsModule,
    MongodbProviderModule,
    AuthModule,
    UserModule,
    SmsModule,
    StudentModule,
    ParentModule,
    NotificationModule,
    SmsLogModule,
    ClasseModule,
  ],
})
export class AppModule {}
