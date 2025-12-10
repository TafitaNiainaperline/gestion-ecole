import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClasseDocument = Classe & Document;

@Schema({ timestamps: true })
export class Classe {
  @Prop({ required: true, unique: true })
  nom: string; // "6ème A", "5ème B"

  @Prop({ required: true })
  niveau: string; // "6ème", "5ème", "4ème", "3ème"

  @Prop({ default: 0 })
  effectif: number;

  @Prop()
  salle?: string; // Numéro de salle

  @Prop()
  enseignantPrincipal?: string; // Nom de l'enseignant principal

  @Prop({ default: true })
  isActive: boolean;
}

export const ClasseSchema = SchemaFactory.createForClass(Classe);
