import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { JwtPayload } from './auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>();

    const authorization =
      request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload =
        this.jwtService.verify<JwtPayload>(token, {
          secret:
            this.configService.get<string>('JWT_SECRET') ??
            'change_this_in_development',
        });

      request.user = {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}