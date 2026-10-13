import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) =>
    SetMetadata(ROLES_KEY, roles);
//Cách dùng ở Controller: @Roles('admin', 'owner')
//Lưu ý: Cú pháp này chỉ đúng khi bạn dùng guard với Reflector. Kiểm tra lại phần guard ở dưới.