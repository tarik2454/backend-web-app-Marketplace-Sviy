import {
  Controller,
  Post,
  Get,
  Body,
  Request as NestRequest,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerData: CreateUserDto) {
    return this.authService.register(registerData);
  }
  @Public()
  @Post('login')
  async login(@Body() loginData: LoginDto) {
    return this.authService.login(loginData);
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  async getCurrentUser(@NestRequest() req: Request) {
    if (!req.userId) {
      throw new UnauthorizedException('User ID not found in request');
    }
    return this.authService.getCurrentUser(req.userId);
  }

  @Post('logout')
  async logout(@NestRequest() req: Request) {
    if (!req.userId) {
      throw new UnauthorizedException('User ID not found in request');
    }
    return this.authService.logout(req.userId);
  }
}
