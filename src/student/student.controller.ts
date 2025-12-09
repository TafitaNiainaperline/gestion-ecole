import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateEcolageDto } from './dto/update-ecolage.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('students')
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Public()
  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Public()
  @Get()
  async findAll(
    @Query('classe') classe?: string,
    @Query('niveau') niveau?: string,
    @Query('status') status?: string,
  ) {
    return this.studentService.findAll({ classe, niveau, status });
  }

  @Public()
  @Get('matricule/:matricule')
  async findByMatricule(@Param('matricule') matricule: string) {
    return this.studentService.findByMatricule(matricule);
  }

  @Public()
  @Get('classe/:classe')
  async findByClasse(@Param('classe') classe: string) {
    return this.studentService.findByClasse(classe);
  }

  @Public()
  @Get('niveau/:niveau')
  async findByNiveau(@Param('niveau') niveau: string) {
    return this.studentService.findByNiveau(niveau);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Public()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Public()
  @Put(':id/ecolage')
  async updateEcolageStatus(
    @Param('id') id: string,
    @Body() updateEcolageDto: UpdateEcolageDto,
  ) {
    return this.studentService.updateEcolageStatus(
      id,
      updateEcolageDto.month,
      updateEcolageDto.status,
    );
  }

  @Public()
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.studentService.delete(id);
  }
}
