import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address (optional if username provided)',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username (optional if email provided)',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  @IsString()
  password: string;
}
