import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { UserRole } from '../commons/enums';

@Controller('api/parents')
export class ParentController {
  constructor(private parentService: ParentService) {}

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Post()
  async create(@Body() createParentDto: CreateParentDto) {
    return this.parentService.create(createParentDto);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get()
  async findAll() {
    return this.parentService.findAll();
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    return this.parentService.findByPhone(phone);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.parentService.findById(id);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    return this.parentService.update(id, updateParentDto);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.parentService.delete(id);
  }
}
