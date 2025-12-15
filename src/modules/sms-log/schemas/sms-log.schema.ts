import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SmsLogStatus } from '../../../commons/enums';

export type SmsLogDocument = SmsLog & Document;

@Schema({ timestamps: true })
export class SmsLog {
  @Prop({ type: Types.ObjectId, ref: 'Notification' })
  notificationId?: Types.ObjectId;

  @Prop()
  notificationTitle?: string;

  @Prop()
  notificationType?: string;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student' })
  studentId?: Types.ObjectId;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(SmsLogStatus),
    default: SmsLogStatus.PENDING,
  })
  status: string;

  @Prop()
  smsServerId?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: false })
  ignored: boolean;
}

export const SmsLogSchema = SchemaFactory.createForClass(SmsLog);
