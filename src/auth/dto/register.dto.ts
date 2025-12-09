import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'john_doe', description: 'Username' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'SECRETAIRE',
    description: 'User role (ADMIN, COMPTABLE, SECRETAIRE)',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;
}
