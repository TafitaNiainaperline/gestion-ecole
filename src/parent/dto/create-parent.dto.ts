import { ApiProperty } from '@nestjs/swagger';

export class CreateParentDto {
  @ApiProperty({ example: 'Jean Dupont', description: 'Full name' })
  name: string;

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
}
