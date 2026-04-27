import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('identity')
export class IdentityController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: Express.Request) {
    return req.user;
  }
}
