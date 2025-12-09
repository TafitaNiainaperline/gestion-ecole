import { ApiProperty } from '@nestjs/swagger';

export class UpdateStudentDto {
  @ApiProperty({ example: 'Jean', description: 'First name', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name', required: false })
  lastName?: string;

  @ApiProperty({
    example: '6ème A',
    description: 'Class',
    required: false,
  })
  classe?: string;

  @ApiProperty({
    example: '6ème',
    description: 'Level',
    required: false,
  })
  niveau?: string;

  @ApiProperty({
    example: 'ACTIF',
    description: 'Student status',
    required: false,
  })
  status?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent ID',
    required: false,
  })
  parentId?: string;

  @ApiProperty({
    example: true,
    description: 'Is student active',
    required: false,
  })
  isActive?: boolean;
}
