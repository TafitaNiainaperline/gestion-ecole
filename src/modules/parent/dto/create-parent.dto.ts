import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ example: 'Jean Dupont', description: 'Full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+261320000000', description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: '+261330000000',
    description: 'Secondary phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @ApiProperty({
    example: 'PERE',
    description: 'Relation to student (PERE, MERE, TUTEUR)',
  })
  @IsString()
  relation: string;
}
