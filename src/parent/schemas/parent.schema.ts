import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentRelation } from '../../commons/enums';

export type ParentDocument = Parent & Document;

@Schema({ timestamps: true })
export class Parent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop()
  phoneSecondary?: string;

  @Prop({
    type: String,
    enum: Object.values(ParentRelation),
    default: ParentRelation.PERE,
  })
  relation: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ParentSchema = SchemaFactory.createForClass(Parent);
