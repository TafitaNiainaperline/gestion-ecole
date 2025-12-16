import { Controller, Get, Param, Post, Body, Patch, Delete } from '@nestjs/common';
import { SmsLogService } from './sms-log.service';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateSmsLogDto } from './dto/create-sms-log.dto';
import { UpdateSmsLogDto } from './dto/update-sms-log.dto';

@Controller('sms-logs')
export class SmsLogController {
  constructor(private smsLogService: SmsLogService) {}

 
  @Public()
  @Get()
  async findAll() {
    return this.smsLogService.findAll();
  }

 
  @Public()
  @Post()
  async create(@Body() createSmsLogDto: CreateSmsLogDto) {
    return this.smsLogService.create(createSmsLogDto);
  }

 
  @Public()
  @Get('stats')
  async getGlobalStats() {
    return this.smsLogService.getGlobalStats();
  }

  
  @Public()
  @Post(':id/retry')
  async retrySingleSms(@Param('id') id: string) {
    return this.smsLogService.retrySingleSms(id);
  }

  @Public()
  @Post('retry-all/failed')
  async retryAllFailed() {
    return this.smsLogService.retryAllFailed();
  }

  @Public()
  @Post(':id/cancel')
  async cancelSingleSendingSms(@Param('id') id: string) {
    return this.smsLogService.cancelSingleSendingSms(id);
  }


  @Public()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSmsLogDto: UpdateSmsLogDto) {
    return this.smsLogService.update(id, updateSmsLogDto);
  }

  
  @Public()
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.smsLogService.delete(id);
  }

  
  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.smsLogService.findById(id);
  }
}
