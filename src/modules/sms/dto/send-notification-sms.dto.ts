import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsOptional, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipientDto {
  @ApiProperty({ description: 'Parent MongoDB ID' })
  @IsMongoId()
  parentId: string;

  @ApiPropertyOptional({ description: 'Student MongoDB ID' })
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @ApiProperty({ example: '0321234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class SendNotificationSmsDto {
  @ApiProperty({ example: 'ECOLAGE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Rappel de paiement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Bonjour, veuillez payer les frais de scolarité.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ type: [RecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];
}

export class NotificationSmsResultDto {
  @ApiProperty({ example: '0321234567' })
  phone: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ example: '665f1a2b3c4d5e6f7g8h9i0j' })
  smsLogId?: string;

  @ApiPropertyOptional({ example: 'msg_abc123' })
  externalSmsId?: string;

  @ApiPropertyOptional({ example: 'SENT' })
  status?: string;

  @ApiPropertyOptional({ example: 'Invalid number' })
  error?: string;

  @ApiPropertyOptional({ description: 'Parent ID' })
  parentId?: string;

  @ApiPropertyOptional({ description: 'Student ID' })
  studentId?: string;
}

export class NotificationSmsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'SMS envoyés avec succès' })
  message: string;

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 8 })
  sent: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ type: [NotificationSmsResultDto] })
  results: NotificationSmsResultDto[];
}

