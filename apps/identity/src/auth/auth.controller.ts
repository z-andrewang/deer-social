import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface CookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  maxAge?: number;
  expires?: Date;
  signed?: boolean;
}

interface CookieReply {
  setCookie(name: string, value: string, options: CookieOptions): this;
  clearCookie(name: string, options?: { path?: string; domain?: string }): this;
}

interface RequestWithCookies extends FastifyRequest {
  cookies: Record<string, string | undefined>;
}

interface AuthedRequest {
  user: {
    userId: string;
    email: string;
    isVerified: boolean;
    role: string;
  };
}

@ApiTags('认证 (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '邮箱注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '邮箱已注册' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: '邮箱登录',
    description: '登录成功后通过 Set-Cookie 下发 access_token 和 refresh_token',
  })
  @ApiResponse({ status: 201, description: '登录成功' })
  @ApiResponse({ status: 401, description: '凭证错误或账户被封禁' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: CookieReply,
  ) {
    const user = await this.authService.login(dto);
    const { accessToken, refreshToken } = this.authService.generateTokens(user);

    const isProd = process.env.NODE_ENV === 'production';
    res.setCookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      path: '/',
    });
    res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return user;
  }

  @Post('refresh')
  @ApiCookieAuth()
  @ApiOperation({
    summary: '刷新 Token',
    description: '使用 Cookie 中的 refresh_token 换取新的 Token 对',
  })
  @ApiResponse({ status: 201, description: '刷新成功' })
  @ApiResponse({ status: 401, description: 'refresh_token 缺失或无效' })
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: CookieReply,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokens = await this.authService.refresh(refreshToken);

    const isProdRefresh = process.env.NODE_ENV === 'production';
    res.setCookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProdRefresh,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000,
      path: '/',
    });
    res.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProdRefresh,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @ApiCookieAuth()
  @ApiOperation({
    summary: '登出',
    description: '清除 access_token 和 refresh_token Cookie',
  })
  @ApiResponse({ status: 201, description: '登出成功' })
  logout(@Res({ passthrough: true }) res: CookieReply) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out' };
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: '发送验证邮件',
    description: 'MVP 阶段仅打印日志，不实际发送邮件',
  })
  @ApiResponse({ status: 201, description: '验证邮件已发送' })
  @ApiResponse({ status: 401, description: '未登录' })
  verifyEmail(@Req() req: AuthedRequest) {
    const user = req.user;
    const token = this.authService.generateVerifyToken(user.userId, user.email);
    // MVP 阶段仅打印日志，实际发送邮件在后续实现
    console.log(`[Verify Email] Token for ${user.email}: ${token}`);
    return { message: 'Verification email sent' };
  }

  @Get('verify-callback')
  @ApiOperation({
    summary: '邮箱验证回调',
    description: '用户点击邮件中的验证链接后调用此接口',
  })
  @ApiQuery({ name: 'token', description: '验证 Token' })
  @ApiResponse({ status: 201, description: '验证成功' })
  @ApiResponse({ status: 401, description: 'Token 无效或已过期' })
  async verifyCallback(@Query('token') token: string) {
    return this.authService.verifyEmailCallback(token);
  }
}
