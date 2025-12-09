import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { UserRole } from '../commons/enums';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('api/students')
@UseGuards(RoleGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get()
  async findAll(
    @Query('classe') classe?: string,
    @Query('niveau') niveau?: string,
    @Query('status') status?: string,
  ) {
    return this.studentService.findAll({ classe, niveau, status });
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get('matricule/:matricule')
  async findByMatricule(@Param('matricule') matricule: string) {
    return this.studentService.findByMatricule(matricule);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get('classe/:classe')
  async findByClasse(@Param('classe') classe: string) {
    return this.studentService.findByClasse(classe);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get('niveau/:niveau')
  async findByNiveau(@Param('niveau') niveau: string) {
    return this.studentService.findByNiveau(niveau);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Put(':id/ecolage')
  async updateEcolageStatus(
    @Param('id') id: string,
    @Body() body: { month: string; status: string },
  ) {
    return this.studentService.updateEcolageStatus(
      id,
      body.month,
      body.status,
    );
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.studentService.delete(id);
  }
}
