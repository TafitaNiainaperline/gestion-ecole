import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getAllUsers() {
    const users = await this.userModel
      .find()
      .select('-password -passwordResetToken -passwordResetExpires');
    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  async getUserById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password -passwordResetToken -passwordResetExpires');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      message: 'User retrieved successfully',
      user,
    };
  }

  async updateUser(id: string, updateData: any) {
    // Don't allow password updates through this endpoint
    if (updateData.password) {
      delete updateData.password;
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
      .select('-password -passwordResetToken -passwordResetExpires');

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'User updated successfully',
      user,
    };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'User deleted successfully',
    };
  }
}
