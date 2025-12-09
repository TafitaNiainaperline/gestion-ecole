import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  name: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  password: string;

  @ApiProperty({
    example: 'SECRETAIRE',
    description: 'User role (ADMIN, COMPTABLE, SECRETAIRE)',
    required: false,
  })
  role?: string;
}
