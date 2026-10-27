import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { LoginDto, RegisterDto, UpdateProfileDto } from "./auth.dto.js";
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

  /**
   * Cập nhật thông tin tài khoản hiện tại (họ tên, số điện thoại, mật khẩu).
   */
  @Put("profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateDto);
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  async patchProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateDto);
  }
}
