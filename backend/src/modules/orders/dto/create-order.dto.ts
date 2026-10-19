import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
  @IsNotEmpty({ message: "Mã sản phẩm không được để trống" })
  productId: string | number;

  @IsOptional()
  productSizeId?: string | number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  sizeCode?: string;

  @IsOptional()
  @IsNumber()
  sugarPercent?: number;

  @IsOptional()
  @IsNumber()
  icePercent?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber({}, { message: "Số lượng phải là số" })
  @Min(1, { message: "Số lượng tối thiểu là 1" })
  quantity: number;

  @IsNumber({}, { message: "Đơn giá phải là số" })
  unitPrice: number;

  @IsOptional()
  @IsArray()
  toppingIds?: (string | number)[];
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}
