import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

@Controller('api/parents')
export class ParentController {
  constructor(private parentService: ParentService) {}

  @Post()
  async create(@Body() createParentDto: CreateParentDto) {
    return this.parentService.create(createParentDto);
  }

  @Get()
  async findAll() {
    return this.parentService.findAll();
  }

  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    return this.parentService.findByPhone(phone);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.parentService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    return this.parentService.update(id, updateParentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.parentService.delete(id);
  }
}
