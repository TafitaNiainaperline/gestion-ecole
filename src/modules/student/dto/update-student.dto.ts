import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateStudentDto {
  @ApiProperty({ example: 'Jean', description: 'First name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    example: '6ème A',
    description: 'Class',
    required: false,
  })
  @IsOptional()
  @IsString()
  classe?: string;

  @ApiProperty({
    example: '6ème',
    description: 'Level',
    required: false,
  })
  @IsOptional()
  @IsString()
  niveau?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    example: true,
    description: 'Is student active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
