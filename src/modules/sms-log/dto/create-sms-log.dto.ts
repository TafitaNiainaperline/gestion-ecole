import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSmsLogDto {
  @ApiPropertyOptional({
    description: 'Notification ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  notificationId?: string;

  @ApiPropertyOptional({
    description: 'Notification title',
    example: 'School Alert',
  })
  @IsOptional()
  @IsString()
  notificationTitle?: string;

  @ApiPropertyOptional({
    description: 'Notification type',
    example: 'URGENT',
  })
  @IsOptional()
  @IsString()
  notificationType?: string;

  @ApiProperty({
    description: 'Parent ID reference (required)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  parentId: string;

  @ApiPropertyOptional({
    description: 'Student ID reference',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @ApiProperty({
    description: 'Phone number (required)',
    example: '0340123456',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'SMS message content (required)',
    example: 'Bienvenue à l\'école',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}
