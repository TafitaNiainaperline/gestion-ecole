import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateParentDto {
  @ApiProperty({
    example: 'Jean Dupont',
    description: 'Full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '+261320000000',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

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
    description: 'Relation to student',
    required: false,
  })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiProperty({
    example: true,
    description: 'Is parent active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
