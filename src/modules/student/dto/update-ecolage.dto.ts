import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateEcolageDto {
  @ApiProperty({
    example: 'janvier',
    description: 'Month (e.g., janvier, février, mars)',
  })
  @IsString()
  month: string;

  @ApiProperty({
    example: 'PAYE',
    description: 'Payment status (PAYE, NON_PAYE, PARTIEL)',
    enum: ['PAYE', 'NON_PAYE', 'PARTIEL'],
  })
  @IsString()
  @IsIn(['PAYE', 'NON_PAYE', 'PARTIEL'])
  status: string;
}
