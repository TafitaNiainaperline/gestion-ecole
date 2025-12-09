import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'MAT001', description: 'Student matricule' })
  @IsString()
  matricule: string;

  @ApiProperty({ example: 'Jean', description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '6ème A', description: 'Class (e.g., 6ème A, 5ème B)' })
  @IsString()
  classe: string;

  @ApiProperty({ example: '6ème', description: 'Level (e.g., 6ème, 5ème)' })
  @IsString()
  niveau: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent ID (MongoDB ObjectId)',
  })
  @IsString()
  parentId: string;

  @ApiProperty({
    example: 'ACTIF',
    description: 'Student status (ACTIF, MALADE, ABSENT)',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;
}
