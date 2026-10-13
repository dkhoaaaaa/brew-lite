import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy token từ Header dạng Bearer <token>
      ignoreExpiration: false, // Không cho phép dùng token hết hạn
      secretOrKey: process.env.JWT_SECRET || 'chuoi_bi_mat_cua_brewlite', // Khóa bí mật ký token
    });
  }

  // Sau khi token được giải mã thành công, hàm này sẽ chạy và trả về dữ liệu gắn vào request.user
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}