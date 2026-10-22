import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { LoginDto, RegisterDto } from "./auth.dto.js";
import { CurrentUser, JwtAuthGuard } from "./auth.guard.js";
import type { AuthenticatedUser } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Đăng ký tài khoản người dùng mới.
   * Mật khẩu được băm an toàn bằng bcrypt.
   */
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Đăng nhập tài khoản.
   * Trả về JWT Access Token chuẩn.
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Lấy thông tin tài khoản hiện tại thông qua JWT Token.
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
