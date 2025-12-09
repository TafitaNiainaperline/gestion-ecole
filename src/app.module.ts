import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SmsModule } from './sms/sms.module';
import { StudentModule } from './student/student.module';
import { ParentModule } from './parent/parent.module';
import { NotificationModule } from './notification/notification.module';
import { SmsLogModule } from './sms-log/sms-log.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.DATABASE_MONGO_URI || 'mongodb://localhost:27017/ecole',
    ),
    AuthModule,
    UserModule,
    SmsModule,
    StudentModule,
    ParentModule,
    NotificationModule,
    SmsLogModule,
  ],
})
export class AppModule {}
