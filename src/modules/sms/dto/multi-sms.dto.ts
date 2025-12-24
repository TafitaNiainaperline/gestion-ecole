import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class SendMultiSmsDto {
  @ApiProperty({
    example: ['0321234567', '0331234568'],
    description: 'List of phone numbers to send SMS to'
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  phones: string[];

  @ApiProperty({
    example: 'Bonjour, ceci est un message test.',
    description: 'SMS message content'
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SmsResultDto {
  @ApiProperty({ example: '0321234567' })
  phone: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'msg_abc123', required: false })
  smsLogId?: string;

  @ApiProperty({ example: 'SENT', required: false })
  status?: string;

  @ApiProperty({ example: 'Invalid number', required: false })
  error?: string;
}

export class MultiSmsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'SMS envoyés avec succès' })
  message: string;

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  sent: number;

  @ApiProperty({ example: 1 })
  failed: number;

  @ApiProperty({ type: [SmsResultDto] })
  results: SmsResultDto[];
}

