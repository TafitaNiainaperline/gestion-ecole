import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(
      {
        sub: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
      { expiresIn: '15m' },
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        sub: String(newUser._id),
        email: newUser.email,
        username: newUser.username,
      },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      } as jwt.SignOptions,
    );

    return {
      message: 'User registered successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
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
    // Generate new access token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
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
}
