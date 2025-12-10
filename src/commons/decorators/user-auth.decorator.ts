import { UserData } from '../types/auth';
import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';

export const UserAuth = createParamDecorator(
  <T extends keyof UserData | undefined>(key: T, ctx: ExecutionContext): T extends keyof UserData ? UserData[T] : UserData => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new NotFoundException("User not found in request.");
    return key ? user[key] : user;
  },
);
