import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_MONGO_URI || 'mongodb://localhost:27017/ecole'),
    AuthModule,
    SmsModule,
  ],
})
export class AppModule {}
