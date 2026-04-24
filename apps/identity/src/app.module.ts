import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { IdentityModule } from './identity/identity.module';

@Module({
  imports: [AuthModule, IdentityModule],
})
export class AppModule {}
