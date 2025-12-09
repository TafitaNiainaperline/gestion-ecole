import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
  @Prop({ required: true, unique: true })
  matricule: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  classe: string; // "6ème A", "5ème B"

  @Prop({ required: true })
  niveau: string; // "6ème", "5ème"

  @Prop({ type: String, enum: ['ACTIF', 'MALADE', 'ABSENT'], default: 'ACTIF' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ type: Map, of: String, default: new Map() })
  ecolageStatus: Map<string, string>; // { "2024-11": "PAYE", "2024-12": "IMPAYE" }

  @Prop({ default: true })
  isActive: boolean;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
