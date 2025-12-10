import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parent, ParentDocument } from './schemas/parent.schema';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<ParentDocument>,
  ) {}

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    const existingParent = await this.parentModel.findOne({
      phone: createParentDto.phone,
    });

    if (existingParent) {
      throw new ConflictException(
        `Parent with phone ${createParentDto.phone} already exists`,
      );
    }

    const newParent = new this.parentModel(createParentDto);
    return newParent.save();
  }

  async findAll(): Promise<Parent[]> {
    return this.parentModel.find({ isActive: true });
  }

  async findById(id: string): Promise<Parent> {
    const parent = await this.parentModel.findById(id);

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  async findByPhone(phone: string): Promise<Parent> {
    const parent = await this.parentModel.findOne({ phone });

    if (!parent) {
      throw new NotFoundException(`Parent with phone ${phone} not found`);
    }

    return parent;
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.parentModel.findByIdAndUpdate(
      id,
      updateParentDto,
      { new: true },
    );

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  async delete(id: string): Promise<void> {
    const result = await this.parentModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }
  }
}
