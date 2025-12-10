import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClasseService } from './classe.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { Roles } from '../../commons/decorators/roles.decorator';
import { Role } from '../../commons/enums/role.enum';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@Roles(Role.ADMIN, Role.TEACHER)
export class ClasseController {
  constructor(private readonly classeService: ClasseService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une classe' })
  create(@Body() createClasseDto: CreateClasseDto) {
    return this.classeService.create(createClasseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les classes' })
  findAll(@Query('niveau') niveau?: string) {
    if (niveau) {
      return this.classeService.findByNiveau(niveau);
    }
    return this.classeService.findAll();
  }

  @Get('niveaux')
  @ApiOperation({ summary: 'Obtenir tous les niveaux disponibles' })
  getNiveaux() {
    return this.classeService.getNiveaux();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une classe par ID' })
  findOne(@Param('id') id: string) {
    return this.classeService.findOne(id);
  }
}
