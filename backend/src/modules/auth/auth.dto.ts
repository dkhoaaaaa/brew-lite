import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  password: string;

  @IsString({ message: "Họ và tên phải là chuỗi ký tự" })
  @MinLength(2, { message: "Họ và tên phải có ít nhất 2 ký tự" })
  fullName: string;

  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  phone?: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: "Họ và tên phải là chuỗi ký tự" })
  @MinLength(2, { message: "Họ và tên phải có ít nhất 2 ký tự" })
  fullName?: string;

  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  phone?: string;

  @IsOptional()
  @IsString({ message: "Mật khẩu hiện tại phải là chuỗi ký tự" })
  currentPassword?: string;

  @IsOptional()
  @IsString({ message: "Mật khẩu mới phải là chuỗi ký tự" })
  @MinLength(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự" })
  newPassword?: string;
}
