import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '密码（至少6位）' })
  @IsString()
  @MinLength(6)
  password: string;
}
