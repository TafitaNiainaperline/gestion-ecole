import { PartialType } from '@nestjs/mapped-types';
import { CreateSmsLogDto } from './create-sms-log.dto';

export class UpdateSmsLogDto extends PartialType(CreateSmsLogDto) {}
