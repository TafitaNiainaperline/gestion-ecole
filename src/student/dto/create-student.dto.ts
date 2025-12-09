import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'MAT001', description: 'Student matricule' })
  matricule: string;

  @ApiProperty({ example: 'Jean', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name' })
  lastName: string;

  @ApiProperty({ example: '6ème A', description: 'Class (e.g., 6ème A, 5ème B)' })
  classe: string;

  @ApiProperty({ example: '6ème', description: 'Level (e.g., 6ème, 5ème)' })
  niveau: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent ID (MongoDB ObjectId)',
  })
  parentId: string;

  @ApiProperty({
    example: 'ACTIF',
    description: 'Student status (ACTIF, MALADE, ABSENT)',
    required: false,
  })
  status?: string;
}
