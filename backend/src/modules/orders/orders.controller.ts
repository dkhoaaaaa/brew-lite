import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    // TODO(Task 7): thay đoạn này bằng JwtAuthGuard và lấy id từ req.user.
    if (!userIdHeader || !/^\d{1,18}$/.test(userIdHeader)) {
      throw new UnauthorizedException("Missing or invalid user.");
    }
    return this.ordersService.create(BigInt(userIdHeader), dto);
  }
}
