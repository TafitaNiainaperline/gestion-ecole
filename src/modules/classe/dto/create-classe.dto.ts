import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateClasseDto {
  @ApiProperty({ example: '6ème A', description: 'Nom de la classe' })
  @IsString()
  nom: string;

  @ApiProperty({ example: '6ème', description: 'Niveau de la classe' })
  @IsString()
  niveau: string;

  @ApiProperty({ example: 30, description: 'Effectif de la classe', required: false })
  @IsOptional()
  @IsNumber()
  effectif?: number;

  @ApiProperty({ example: 'Salle 101', description: 'Numéro de salle', required: false })
  @IsOptional()
  @IsString()
  salle?: string;

  @ApiProperty({ example: 'M. Rakoto', description: 'Enseignant principal', required: false })
  @IsOptional()
  @IsString()
  enseignantPrincipal?: string;
}
