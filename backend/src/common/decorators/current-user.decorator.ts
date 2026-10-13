import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user; // Trả về thông tin user đã được gắn từ JwtAuthGuard
    },
);
//Cách dùng ở Controller: async getMyProfile(@CurrentUser() user: any) { ... }