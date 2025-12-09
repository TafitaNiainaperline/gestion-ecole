import { ApiProperty } from '@nestjs/swagger';

export class UpdateParentDto {
  @ApiProperty({
    example: 'Jean Dupont',
    description: 'Full name',
    required: false,
  })
  name?: string;

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
    example: true,
    description: 'Is parent active',
    required: false,
  })
  isActive?: boolean;
}
