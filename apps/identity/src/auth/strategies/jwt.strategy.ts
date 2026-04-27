import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithCookies {
  cookies: Record<string, string | undefined>;
}

const cookieExtractor = (req: RequestWithCookies): string | null => {
  return req.cookies?.access_token || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    isVerified: boolean;
    role: string;
  }) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException('Account has been banned');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      isVerified: payload.isVerified,
      role: payload.role,
    };
  }
}
