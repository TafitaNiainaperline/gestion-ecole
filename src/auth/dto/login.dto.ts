import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address (optional if username provided)',
    required: false,
  })
  email?: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username (optional if email provided)',
    required: false,
  })
  username?: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  password: string;
}
