import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { MockPaymentDto } from "./dto/mock-payment.dto.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserId(authHeader?: string, userIdHeader?: string): bigint {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = this.jwtService.verify(token);
        if (payload?.sub) return BigInt(payload.sub);
      } catch {
        // Fall through to check userIdHeader if token fails or expired
      }
    }
    if (userIdHeader && /^\d{1,18}$/.test(userIdHeader)) {
      return BigInt(userIdHeader);
    }
    throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này.");
  }

  @Post()
  create(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.create(userId, dto);
  }

  @Get("my")
  findMyOrders(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Query("status") status?: string,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.findMyOrders(userId, status);
  }

  @Get(":id")
  findById(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id") id: string,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.findById(BigInt(id), userId);
  }

  @Post(":id/mock-payment")
  processMockPayment(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id") id: string,
    @Body() dto: MockPaymentDto,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.processMockPayment(BigInt(id), userId, dto);
  }

  @Post(":id/apply-voucher")
  applyVoucher(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id") id: string,
    @Body("code") code: string,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.applyVoucher(BigInt(id), userId, code);
  }

  @Post(":id/remove-voucher")
  removeVoucher(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id") id: string,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.removeVoucher(BigInt(id), userId);
  }

  @Post(":id/cancel")
  cancelOrder(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id") id: string,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.ordersService.cancelOrder(BigInt(id), userId);
  }
}
