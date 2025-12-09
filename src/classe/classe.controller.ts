import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClasseService } from './classe.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('classes')
@Controller('classes')
export class ClasseController {
  constructor(private readonly classeService: ClasseService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Créer une classe' })
  create(@Body() createClasseDto: CreateClasseDto) {
    return this.classeService.create(createClasseDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les classes' })
  findAll(@Query('niveau') niveau?: string) {
    if (niveau) {
      return this.classeService.findByNiveau(niveau);
    }
    return this.classeService.findAll();
  }

  @Public()
  @Get('niveaux')
  @ApiOperation({ summary: 'Obtenir tous les niveaux disponibles' })
  getNiveaux() {
    return this.classeService.getNiveaux();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une classe par ID' })
  findOne(@Param('id') id: string) {
    return this.classeService.findOne(id);
  }
}
