import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './schemas/refresh-token';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(registerData: RegisterDto) {
    const { email, password, name } = registerData;

    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.create({
      email,
      password: hashedPassword,
      name,
    });
  }

  async login(loginData: LoginDto) {
    const { email, password } = loginData;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Wrong credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Wrong credentials');

    const tokens = await this.generateUserTokens(String(user._id));
    return {
      ...tokens,
      userId: user._id,
    };
  }

  async refreshToken(oldRefreshToken: string) {
    const tokenDoc = await this.refreshTokenModel.findOneAndDelete({
      token: oldRefreshToken,
      expiryDate: { $gte: new Date() },
    });

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

  async storeRefreshToken(token: string, userId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.refreshTokenModel.create({
      token,
      userId,
      expiryDate,
    });
  }
}
