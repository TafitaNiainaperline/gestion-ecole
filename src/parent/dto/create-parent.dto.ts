import { ApiProperty } from '@nestjs/swagger';

export class CreateParentDto {
  @ApiProperty({ example: 'Jean', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name' })
  lastName: string;

  @ApiProperty({ example: '+261320000000', description: 'Phone number' })
  phone: string;

  @ApiProperty({
    example: '+261330000000',
    description: 'Secondary phone number',
    required: false,
  })
  phoneSecondary?: string;

  @ApiProperty({
    example: 'PERE',
    description: 'Relation to student (PERE, MERE, TUTEUR)',
  })
  relation: string;

  @ApiProperty({
    example: 'jean@example.com',
    description: 'Email address',
    required: false,
  })
  email?: string;
}
