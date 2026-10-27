import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query("page") page?: string) {
    // Nếu có truyền page thì ép kiểu sang số nguyên, mặc định là trang 1
    const pageNumber = page ? parseInt(page, 10) : 1;
    
    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new BadRequestException("Page must be a positive integer.");
    }

    const limit = 5; // Cố định 5 sản phẩm / trang theo yêu cầu đồ án
    return await this.productsService.findAllPaginated(pageNumber, limit);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException("Product id must be a positive integer.");
    }

    const product = await this.productsService.findOne(BigInt(id));
    if (!product) throw new NotFoundException("Product not found.");
    return product;
  }
}