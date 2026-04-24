import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@deer-social/database';

@Injectable()
export class IdentityService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isVerified: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
