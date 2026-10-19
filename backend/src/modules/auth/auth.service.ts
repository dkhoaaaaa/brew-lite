import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản mới với mật khẩu được băm an toàn bằng bcrypt.
   */
  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException("Email này đã được sử dụng");
    }

    if (dto.phone?.trim()) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone.trim() },
      });
      if (existingPhone) {
        throw new ConflictException("Số điện thoại này đã được sử dụng");
      }
    }

    // Băm mật khẩu an toàn bằng bcrypt
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
      },
    });

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: "Đăng ký tài khoản thành công",
      accessToken,
      access_token: accessToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Đăng nhập người dùng và trả về JWT Access Token chuẩn.
   */
  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
    }

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: "Đăng nhập thành công",
      accessToken,
      access_token: accessToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  /**
   * Lấy thông tin tài khoản hiện tại từ userId.
   */
  async getProfile(userId: string) {
    let id: bigint;
    try {
      id = BigInt(userId);
    } catch {
      throw new NotFoundException("Mã người dùng không hợp lệ");
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy thông tin người dùng");
    }

    return {
      ...user,
      id: user.id.toString(),
    };
  }
}
