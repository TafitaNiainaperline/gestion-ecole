import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationType,
  NotificationTargetType,
  NotificationStatus,
} from '../../../commons/enums';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationTargetType),
    default: NotificationTargetType.INDIVIDUEL,
  })
  targetType: string;

  @Prop({ type: [String] })
  targetClasses?: string[];

  @Prop({ type: [Types.ObjectId], ref: 'Student' })
  targetStudents?: Types.ObjectId[];

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.DRAFT,
  })
  status: string;

  @Prop({ default: 0 })
  totalRecipients: number;

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failureCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
