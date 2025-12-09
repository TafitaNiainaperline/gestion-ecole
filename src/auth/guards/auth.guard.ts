import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    console.log('=== TOKEN EXTRACTION DEBUG ===');
    console.log('Request headers:', request.headers);
    console.log('Authorization header:', authHeader);

    if (!authHeader) {
      console.log('No authorization header found');
      return undefined;
    }
    const parts = authHeader.split(' ');
    console.log('Parts:', parts);
    if (parts.length !== 2) {
      console.log('Header does not have exactly 2 parts');
      return undefined;
    }
    const [type, token] = parts;
    console.log('Type:', type, 'Token exists:', !!token);
    const result = type.toLowerCase() === 'bearer' ? token : undefined;
    console.log('Returning token:', result ? 'YES' : 'NO');
    return result;
  }
}
