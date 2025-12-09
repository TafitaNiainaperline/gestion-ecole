import { Controller, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Public()
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Public()
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.updateUser(id, updateData);
  }

  @Public()
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
