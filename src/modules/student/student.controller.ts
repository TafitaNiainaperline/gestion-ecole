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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateEcolageDto } from './dto/update-ecolage.dto';
import { Roles } from '../../commons/decorators/roles.decorator';
import { Role } from '../../commons/enums/role.enum';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@Roles(Role.ADMIN, Role.TEACHER)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  async findAll(
    @Query('classe') classe?: string,
    @Query('niveau') niveau?: string,
    @Query('status') status?: string,
  ) {
    return this.studentService.findAll({ classe, niveau, status });
  }

  @Get('matricule/:matricule')
  async findByMatricule(@Param('matricule') matricule: string) {
    return this.studentService.findByMatricule(matricule);
  }

  @Get('classe/:classe')
  async findByClasse(@Param('classe') classe: string) {
    return this.studentService.findByClasse(classe);
  }

  @Get('niveau/:niveau')
  async findByNiveau(@Param('niveau') niveau: string) {
    return this.studentService.findByNiveau(niveau);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.studentService.delete(id);
  }
}
