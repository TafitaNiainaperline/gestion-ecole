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
import { Public } from '../auth/decorators/public.decorator';

@Controller('parents')
export class ParentController {
  constructor(private parentService: ParentService) {}

  @Public()
  @Post()
  async create(@Body() createParentDto: CreateParentDto) {
    return this.parentService.create(createParentDto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.parentService.findAll();
  }

  @Public()
  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    return this.parentService.findByPhone(phone);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.parentService.findById(id);
  }

  @Public()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    return this.parentService.update(id, updateParentDto);
  }

  @Public()
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.parentService.delete(id);
  }
}
