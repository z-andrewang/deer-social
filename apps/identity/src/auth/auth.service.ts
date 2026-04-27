import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface JwtPayload {
  sub: string;
  email?: string;
  isVerified?: boolean;
  role?: string;
  purpose?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        isVerified: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Account has been banned');
    }

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
    };
  }

  generateTokens(user: {
    id: string;
    email: string;
    isVerified: boolean;
    role: string;
  }) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
    };
    const refreshPayload = { sub: user.id };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '2h',
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  generateVerifyToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email, purpose: 'email-verification' },
      { expiresIn: '24h' },
    );
  }

  async verifyEmailCallback(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET!,
      });
      if (payload.purpose !== 'email-verification') {
        throw new UnauthorizedException('Invalid token');
      }
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { isVerified: true },
      });
      return { message: 'Email verified successfully' };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_SECRET!,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.generateTokens({
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
