import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LoginDto, RegisterDto } from "./auth.dto.js";

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
        isActive: true,
        loyaltyPoints: 0,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    const accessToken = await this.generateToken(user.id.toString(), user.email, user.fullName);

    return {
      message: "Đăng ký tài khoản thành công",
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
      },
      accessToken,
      access_token: accessToken,
    };
  }

  /**
   * Đăng nhập với email và mật khẩu, trả về JWT Access Token.
   */
  async login(dto: LoginDto) {
  console.log("========== LOGIN START ==========");

  const normalizedEmail = dto.email.toLowerCase().trim();

  console.log("[STEP 1] Email nhận được:", normalizedEmail);

  // Tìm tài khoản trong database
  const user = await this.prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  console.log("[STEP 2] USER DEBUG:", {
    userFound: !!user,
    userId: user?.id.toString(),
    isActive: user?.isActive,
    hashPrefix: user?.passwordHash.slice(0, 7),
  });

  if (!user) {
    console.log("[ERROR] Không tìm thấy tài khoản");

    throw new UnauthorizedException(
      "Email hoặc mật khẩu không chính xác"
    );
  }

  if (!user.isActive) {
    console.log("[ERROR] Tài khoản bị khóa");

    throw new UnauthorizedException(
      "Tài khoản của bạn đã bị khóa"
    );
  }

  // Kiểm tra mật khẩu
  const isPasswordValid = await bcrypt.compare(
    dto.password,
    user.passwordHash
  );

  console.log("[STEP 3] PASSWORD DEBUG:", {
    passwordValid: isPasswordValid,
    passwordLength: dto.password?.length,
  });

  if (!isPasswordValid) {
    console.log("[ERROR] Mật khẩu không chính xác");

    throw new UnauthorizedException(
      "Email hoặc mật khẩu không chính xác"
    );
  }

  console.log("[STEP 4] Đăng nhập hợp lệ");

  // Tạo JWT
  const accessToken = await this.generateToken(
    user.id.toString(),
    user.email,
    user.fullName
  );

  console.log("[STEP 5] Tạo JWT thành công");
  console.log("========== LOGIN SUCCESS ==========");

  return {
    message: "Đăng nhập thành công",
    user: {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
    },
    accessToken,
    access_token: accessToken,
  };
}

  /**
   * Lấy thông tin user hiện tại.
   */
  async getProfile(userIdStr: string) {
    const userId = BigInt(userIdStr);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    return {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
    };
  }

  /**
   * Ký JWT Access Token.
   */
  private async generateToken(sub: string, email: string, fullName: string): Promise<string> {
    return this.jwtService.sign({
      sub,
      email,
      fullName,
    });
  }
}
