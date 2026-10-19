import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

// id là BigInt nên client gửi dạng chuỗi số, ví dụ "12".
const ID_PATTERN = /^\d{1,18}$/;
const ID_MESSAGE = "must be a positive integer string";
const PERCENT_VALUES = [0, 30, 50, 70, 100];

export class OrderItemToppingDto {
  @Matches(ID_PATTERN, { message: `toppingId ${ID_MESSAGE}` })
  toppingId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  quantity?: number;
}

export class OrderItemDto {
  @Matches(ID_PATTERN, { message: `productId ${ID_MESSAGE}` })
  productId!: string;

  @Matches(ID_PATTERN, { message: `productSizeId ${ID_MESSAGE}` })
  productSizeId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsOptional()
  @IsIn(PERCENT_VALUES)
  sugarPercent?: number;

  @IsOptional()
  @IsIn(PERCENT_VALUES)
  icePercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => OrderItemToppingDto)
  toppings?: OrderItemToppingDto[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
