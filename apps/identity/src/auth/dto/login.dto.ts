import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '密码' })
  @IsString()
  password: string;
}
