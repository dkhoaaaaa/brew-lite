import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Gọi hàm kiểm tra mặc định của Passport-JWT Strategy
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // Nếu có lỗi xác thực hoặc không tìm thấy user tương ứng với token -> Bắn lỗi 401
    if (err || !user) {
      throw err || new UnauthorizedException('Token không hợp lệ hoặc bạn chưa đăng nhập!');
    }
    return user; // Trả về thông tin user để gắn vào request
  }
}