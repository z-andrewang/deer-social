import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthedRequest {
  user: {
    userId: string;
    email: string;
    isVerified: boolean;
    role: string;
  };
}

@ApiTags('用户信息 (Identity)')
@Controller('identity')
export class IdentityController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '获取当前登录用户信息' })
  @ApiResponse({ status: 200, description: '返回当前用户信息' })
  @ApiResponse({ status: 401, description: '未登录或账户被封禁' })
  me(@Req() req: AuthedRequest) {
    return req.user;
  }
}
