import {
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { Response } from "express";
import {
  CurrentUser,
  JwtAuthGuard,
} from "../auth/auth.guard.js";
import type { AuthenticatedUser } from "../auth/auth.guard.js";
import { PaymentsService } from "./payments.service.js";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("orders/:id/vnpay")
  @UseGuards(JwtAuthGuard)
  createVnpayPayment(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Ip() clientIp: string,
  ) {
    if (!/^\d{1,18}$/.test(id)) {
      throw new BadRequestException("Invalid order id.");
    }
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required.");
    }
    return this.paymentsService.createVnpayPayment(
      BigInt(id),
      BigInt(user.id),
      idempotencyKey,
      clientIp,
    );
  }

  @Get("vnpay/ipn")
  handleVnpayIpn(
    @Query() query: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentsService.handleIpn(query);
  }

  @Get("vnpay/return")
  async handleVnpayReturn(
    @Query() query: Record<string, string | string[] | undefined>,
    @Res() response: Response,
  ) {
    const destination = await this.paymentsService.getReturnDestination(query);
    return response.redirect(destination);
  }
}
