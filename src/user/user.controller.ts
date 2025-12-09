import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { UserRole } from '../commons/enums';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('users')
@UseGuards(RoleGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.updateUser(id, updateData);
  }

  @RequireRole(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SECRETAIRE)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
