import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export const VNPAY_PAYMENT_CHANNELS = ["VNBANK", "INTCARD", "VNPAYQR"] as const;
export type VnpayPaymentChannel = (typeof VNPAY_PAYMENT_CHANNELS)[number];

export class CreateVnpayPaymentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9._:-]+$/)
  idempotencyKey!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{1,18}$/)
  orderId!: string;

  @IsOptional()
  @IsIn(VNPAY_PAYMENT_CHANNELS)
  paymentChannel?: VnpayPaymentChannel;
}
