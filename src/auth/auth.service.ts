import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, name, password, role } = registerDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Create new user
    const newUser = new this.userModel({
      email,
      username,
      name,
      password,
      role,
    });

    await newUser.save();

    return {
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, username, password } = loginDto;

    // Find user by email or username
    const user = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(
      {
        sub: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      { expiresIn: '15m' },
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        username: user.username,
      },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      } as jwt.SignOptions,
    );

    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(user: any) {
    // Fetch user from database to get the role
    const dbUser = await this.userModel.findById(user.id);
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign(
      {
        sub: dbUser._id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
      },
      { expiresIn: '15m' },
    );

    return {
      message: 'Token refreshed successfully',
      access_token: accessToken,
    };
  }

  async validateUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email, username } = forgotPasswordDto;

    if (!email && !username) {
      throw new BadRequestException('Email or username is required');
    }

    // Find user by email or username
    const user = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      // Return generic message for security (don't reveal if user exists)
      return {
        message: 'If a user account exists with that email/username, a password reset link has been sent',
      };
    }

    // Generate reset token (32 bytes of random data)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set reset token and expiry (30 minutes)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // TODO: Send email with reset link containing resetToken
    // Email should contain: ${BACKEND_BASE_URL}/auth/reset-password/${resetToken}

    return {
      message: 'Password reset link sent to email',
      // Remove this in production - only for testing
      _resetToken: resetToken,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { resetToken, newPassword } = resetPasswordDto;

    // Hash the provided token to match stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid reset token
    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired password reset token',
      );
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.lastPasswordChangeAt = new Date();
    await user.save();

    return {
      message: 'Password reset successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.lastPasswordChangeAt = new Date();
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }
}
