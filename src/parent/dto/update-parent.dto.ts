import { ApiProperty } from '@nestjs/swagger';

export class UpdateParentDto {
  @ApiProperty({ example: 'Jean', description: 'First name', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name', required: false })
  lastName?: string;

  @ApiProperty({
    example: '+261320000000',
    description: 'Phone number',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: '+261330000000',
    description: 'Secondary phone number',
    required: false,
  })
  phoneSecondary?: string;

  @ApiProperty({
    example: 'PERE',
    description: 'Relation to student',
    required: false,
  })
  relation?: string;

  @ApiProperty({
    example: 'jean@example.com',
    description: 'Email address',
    required: false,
  })
  email?: string;

  @ApiProperty({
    example: true,
    description: 'Is parent active',
    required: false,
  })
  isActive?: boolean;
}
