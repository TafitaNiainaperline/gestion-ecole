import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class SendImmediateDto {
  @ApiProperty({
    example: 'ECOLAGE',
    description: 'Notification type (ECOLAGE, REUNION, MALADIE, CUSTOM)',
  })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Immediate SMS', description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Please pay your tuition fees',
    description: 'SMS message to send',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 'INDIVIDUEL',
    description: 'Target type (CLASSE, INDIVIDUEL, TOUS)',
  })
  @IsString()
  targetType: string;

  @ApiProperty({
    example: ['6ème A', '6ème B'],
    description: 'Target classes (required if targetType is CLASSE)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  targetClasses?: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Target student IDs (required if targetType is INDIVIDUEL)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  targetStudents?: string[];

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'User ID of the sender (MongoDB ObjectId)',
  })
  @IsString()
  createdBy: string;
}
