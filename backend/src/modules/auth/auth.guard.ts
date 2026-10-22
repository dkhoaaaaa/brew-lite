import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service.js";

// =====================================================================
// 1. KIỂU DỮ LIỆU USER VÀ TOKEN PAYLOAD
// =====================================================================
export interface JwtPayload {
  sub: string;
  email: string;
  fullName?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  loyaltyPoints: number;
}

// =====================================================================
// 2. CHIẾN LƯỢC XÁC THỰC JWT (PASSPORT STRATEGY)
// =====================================================================
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>("jwt.accessSecret") ||
      process.env.JWT_ACCESS_SECRET ||
      "brewlite_jwt_access_secret_dev_key";

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException("Token không hợp lệ");
    }

    let userId: bigint;
    try {
      userId = BigInt(payload.sub);
    } catch {
      throw new UnauthorizedException("Token không hợp lệ");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        "Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa",
      );
    }

    return {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
    };
  }
}

// =====================================================================
// 3. BẢO VỆ ROUTE (JWTAUTHGUARD)
// =====================================================================
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err || !user) {
      const errorMessage =
        info?.message === "jwt expired"
          ? "Token đã hết hạn, vui lòng đăng nhập lại"
          : info?.message === "No auth token"
            ? "Vui lòng cung cấp Authorization header với Bearer token"
            : info?.message || "Yêu cầu xác thực không hợp lệ";

      throw err || new UnauthorizedException(errorMessage);
    }
    return user;
  }
}

// =====================================================================
// 4. DECORATOR LẤY USER ĐANG ĐĂNG NHẬP (@CurrentUser)
// =====================================================================
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
