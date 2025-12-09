import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClasseController } from './classe.controller';
import { ClasseService } from './classe.service';
import { Classe, ClasseSchema } from './schemas/classe.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Classe.name, schema: ClasseSchema }]),
  ],
  controllers: [ClasseController],
  providers: [ClasseService],
  exports: [ClasseService],
})
export class ClasseModule {}
