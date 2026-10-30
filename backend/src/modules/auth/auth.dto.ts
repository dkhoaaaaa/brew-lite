import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 chữ số" })
  @Matches(/^(?:\D*\d){6}/, { message: "Mật khẩu phải có ít nhất 6 chữ số" })
  password: string;

  @IsString({ message: "Họ và tên phải là chuỗi ký tự" })
  @MinLength(2, { message: "Họ và tên yêu cầu có ít nhất 2 ký tự" })
  @Matches(/^[^\d]+$/, {
    message: "Họ và tên phải là chữ cái không được là số",
  })
  @Matches(/^[\p{L}\s]+$/u, {
    message: "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
  })
  @Matches(/^\S+(\s+\S+)+$/, {
    message: "Họ và tên yêu cầu có ít nhất 2 ký tự và phải ngăn cách bới khoảng trắng",
  })
  fullName: string;

  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  @Matches(/^[0-9]{10}$/, {
    message: "Số điện thoại phải có đúng 10 chữ số",
  })
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
  @MinLength(2, { message: "Họ và tên yêu cầu có ít nhất 2 ký tự" })
  @Matches(/^[^\d]+$/, {
    message: "Họ và tên phải là chữ cái không được là số",
  })
  @Matches(/^[\p{L}\s]+$/u, {
    message: "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
  })
  @Matches(/^\S+(\s+\S+)+$/, {
    message: "Họ và tên yêu cầu có ít nhất 2 ký tự và phải ngăn cách bới khoảng trắng",
  })
  fullName?: string;

  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  @Matches(/^[0-9]{10}$/, {
    message: "Số điện thoại phải có đúng 10 chữ số",
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: "Mật khẩu hiện tại phải là chuỗi ký tự" })
  currentPassword?: string;

  @IsOptional()
  @IsString({ message: "Mật khẩu mới phải là chuỗi ký tự" })
  @MinLength(6, { message: "Mật khẩu mới phải có ít nhất 6 chữ số" })
  @Matches(/^(?:\D*\d){6}/, { message: "Mật khẩu mới phải có ít nhất 6 chữ số" })
  newPassword?: string;
}
