import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './schemas/refresh-token';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

const REFRESH_TOKEN_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSION_TIME = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(registerData: CreateUserDto) {
    return this.usersService.create(registerData);
  }

  async login(loginData: LoginDto) {
    const { email, password } = loginData;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateUserTokens(String(user._id));
    return {
      ...tokens,
      userId: user._id,
    };
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findOne(userId);
  }

  async logout(userId: string) {
    await this.refreshTokenModel.deleteMany({ userId });
    return { message: 'Logged out successfully' };
  }

  async refreshToken(oldRefreshToken: string) {
    const existingRefreshToken = await this.refreshTokenModel.findOneAndDelete({
      token: oldRefreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!existingRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existingRefreshToken.issuedAt) {
      const issuedAtDate =
        existingRefreshToken.issuedAt instanceof Date
          ? existingRefreshToken.issuedAt
          : new Date(existingRefreshToken.issuedAt);

      const maxLifetimeDate = new Date(
        issuedAtDate.getTime() + MAX_SESSION_TIME,
      );

      if (new Date() > maxLifetimeDate) {
        throw new UnauthorizedException('Session expired. Please login again.');
      }
    }

    return this.generateUserTokens(
      existingRefreshToken.userId.toString(),
      existingRefreshToken.issuedAt,
    );
  }

  async generateUserTokens(userId: string, issuedAt?: Date) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '15m' });
    const refreshToken = randomBytes(64).toString('hex');

    await this.storeRefreshToken(refreshToken, userId, issuedAt);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: string, issuedAt?: Date) {
    const now = new Date();
    const tokenIssuedAt = issuedAt || now;

    const expiryDate = new Date(now.getTime() + REFRESH_TOKEN_EXPIRATION_TIME);

    await this.refreshTokenModel.create({
      token,
      userId,
      expiryDate,
      issuedAt: tokenIssuedAt,
    });
  }
}
