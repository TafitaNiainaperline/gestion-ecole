import { Controller, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { UserRole } from '../commons/enums';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @RequireRole(UserRole.ADMIN, UserRole.SECRETAIRE)
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @RequireRole(UserRole.ADMIN, UserRole.SECRETAIRE)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @RequireRole(UserRole.ADMIN, UserRole.SECRETAIRE)
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.updateUser(id, updateData);
  }

  @RequireRole(UserRole.ADMIN, UserRole.SECRETAIRE)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
