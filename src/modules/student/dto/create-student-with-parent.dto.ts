import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

class ParentInfoDto {
  @ApiProperty({ example: 'Jean Dupont', description: 'Full name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '+261320000000',
    description: 'Phone number (must start with +261)'
  })
  @IsString()
  @Matches(/^\+261[0-9]{9}$/, {
    message: 'Phone must start with +261 and be followed by 9 digits',
  })
  phone: string;

  @ApiProperty({
    example: '+261330000000',
    description: 'Secondary phone number (optional, must start with +261 if provided)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+261[0-9]{9}$/, {
    message: 'Phone secondary must start with +261 and be followed by 9 digits',
  })
  phoneSecondary?: string;

  @ApiProperty({
    example: 'Père',
    description: 'Relation to student (Père, Mère, Tuteur)',
  })
  @IsString()
  relation: string;
}

export class CreateStudentWithParentDto {
  @ApiProperty({ example: 'MAT001', description: 'Student matricule' })
  @IsString()
  matricule: string;

  @ApiProperty({ example: 'Jean', description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '6ème A', description: 'Class (e.g., 6ème A, 5ème B)' })
  @IsString()
  classe: string;

  @ApiProperty({
    description: 'Parent information',
    type: ParentInfoDto,
  })
  @ValidateNested()
  @Type(() => ParentInfoDto)
  parent: ParentInfoDto;
}
