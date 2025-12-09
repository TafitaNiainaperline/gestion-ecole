import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'ECOLAGE',
    description: 'Notification type (ECOLAGE, REUNION, MALADIE, CUSTOM)',
  })
  type: string;

  @ApiProperty({ example: 'Payment Due', description: 'Notification title' })
  title: string;

  @ApiProperty({
    example: 'Please pay your tuition fees',
    description: 'Notification message',
  })
  message: string;

  @ApiProperty({
    example: 'INDIVIDUEL',
    description: 'Target type (CLASSE, INDIVIDUEL, TOUS)',
  })
  targetType: string;

  @ApiProperty({
    example: ['6ème A', '6ème B'],
    description: 'Target classes (required if targetType is CLASSE)',
    required: false,
  })
  targetClasses?: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Target student IDs (required if targetType is INDIVIDUEL)',
    required: false,
  })
  targetStudents?: string[];

  @ApiProperty({
    example: '2024-12-09T10:00:00Z',
    description: 'Scheduled send time (ISO 8601 format)',
    required: false,
  })
  scheduledAt?: Date;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'User ID of the creator (MongoDB ObjectId)',
  })
  createdBy: string;
}
