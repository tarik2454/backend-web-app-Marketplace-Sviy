import {
  Controller,
  Post,
  Get,
  Body,
  Request as NestRequest,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    return this.authService.register(registerData);
  }

  @Public()
  @Post('login')
  async login(
    @Body() loginData: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(loginData);
    const userId = String(user._id);
    const tokens = await this.authService.loginUser(userId);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 дня
    });

    return {
      accessToken: tokens.accessToken,
      userId,
    };
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @NestRequest() req: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as { refresh_token?: string } | undefined;
    const refreshToken = cookies?.refresh_token || body?.refreshToken;
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 дня
    });

    return {
      accessToken: tokens.accessToken,
    };
  }

  @Get('me')
  async getCurrentUser(@NestRequest() req: Request) {
    if (!req.userId) {
      throw new UnauthorizedException('User ID not found in request');
    }
    return this.authService.getCurrentUser(req.userId);
  }

  @Post('logout')
  async logout(
    @NestRequest() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.userId) {
      throw new UnauthorizedException('User ID not found in request');
    }
    await this.authService.logout(req.userId);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logged out successfully' };
  }
}
