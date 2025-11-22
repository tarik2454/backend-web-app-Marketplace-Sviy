import { Body, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './schemas/refresh-token';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(registerData: RegisterDto) {
    return this.usersService.create(registerData);
  }

  async loginUser(userId: string) {
    const tokens = await this.generateUserTokens(userId);
    return tokens;
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findOne(userId);
  }

  async logout(userId: string) {
    await this.refreshTokenModel.deleteMany({ userId });
    return { message: 'Logged out successfully' };
  }

  async validateUser(loginData: LoginDto) {
    const { email, password } = loginData;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Wrong credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Wrong credentials');

    return user;
  }

  // Refresh token rotation - old refresh token is invalidated and a new one is generated
  async refreshToken(oldRefreshToken: string) {
    const tokenDoc = await this.refreshTokenModel.findOneAndDelete({
      token: oldRefreshToken,
      expiryDate: { $gte: new Date() },
    });

    // Single Refresh Token per User - find one
    // const tokenDoc = await this.refreshTokenModel.findOne({
    //   token: oldRefreshToken,
    //   expiryDate: { $gte: new Date() },
    // });

    if (!tokenDoc) throw new UnauthorizedException('Invalid refresh token');

    return this.generateUserTokens(tokenDoc.userId.toString());
  }

  async generateUserTokens(userId: string) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '1h' });
    const refreshToken = randomBytes(64).toString('hex');

    await this.storeRefreshToken(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
    };
  }

  // Refresh token rotation - new refresh token is generated and stored
  async storeRefreshToken(token: string, userId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.refreshTokenModel.create({
      token,
      userId,
      expiryDate,
    });
    // Single Refresh Token per User - update one
    // await this.refreshTokenModel.updateOne(
    //   { userId },
    //   { $set: { expiryDate, token } },
    //   { upsert: true },
    // );
  }
}
