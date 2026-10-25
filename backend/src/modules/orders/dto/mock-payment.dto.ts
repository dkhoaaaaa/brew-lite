import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class MockPaymentDto {
  @IsNotEmpty({ message: "Vui lòng chọn phương thức thanh toán mô phỏng." })
  @IsIn(["E_WALLET", "BANK_CARD"], { message: "Phương thức thanh toán mô phỏng không hợp lệ." })
  method!: "E_WALLET" | "BANK_CARD";

  @IsNotEmpty({ message: "Vui lòng chọn kết quả mô phỏng." })
  @IsIn(["success", "failure"], { message: "Kết quả mô phỏng không hợp lệ." })
  outcome!: "success" | "failure";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;
}

