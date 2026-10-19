import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

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
