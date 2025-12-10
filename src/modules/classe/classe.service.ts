import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classe, ClasseDocument } from './schemas/classe.schema';
import { CreateClasseDto } from './dto/create-classe.dto';

@Injectable()
export class ClasseService {
  constructor(
    @InjectModel(Classe.name) private classeModel: Model<ClasseDocument>,
  ) {}

  async create(createClasseDto: CreateClasseDto): Promise<Classe> {
    const classe = new this.classeModel(createClasseDto);
    return classe.save();
  }

  async findAll(): Promise<Classe[]> {
    return this.classeModel.find({ isActive: true }).sort({ niveau: 1, nom: 1 }).exec();
  }

  async findByNiveau(niveau: string): Promise<Classe[]> {
    return this.classeModel.find({ niveau, isActive: true }).exec();
  }

  async findOne(id: string): Promise<Classe> {
    const classe = await this.classeModel.findById(id).exec();
    if (!classe) {
      throw new NotFoundException(`Classe with ID ${id} not found`);
    }
    return classe;
  }

  async getNiveaux(): Promise<string[]> {
    const classes = await this.classeModel.find({ isActive: true }).distinct('niveau').exec();
    return classes;
  }
}
