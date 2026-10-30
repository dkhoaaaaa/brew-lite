import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  Redirect,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CurrentUser, JwtAuthGuard } from "../auth/auth.guard.js";
import type { AuthenticatedUser } from "../auth/auth.guard.js";
import { CreateVnpayPaymentDto } from "./dto/create-vnpay-payment.dto.js";
import { VnpayPaymentsService } from "./vnpay-payments.service.js";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: VnpayPaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Post("vnpay")
  @UseGuards(JwtAuthGuard)
  createVnpayPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ipAddress: string,
    @Body() dto: CreateVnpayPaymentDto,
  ) {
    return this.paymentsService.createPayment(
      BigInt(dto.orderId),
      BigInt(user.id),
      dto,
      ipAddress,
    );
  }

  @Get("vnpay/ipn")
  async vnpayIpn(@Query() query: Record<string, unknown>) {
    const result = await this.paymentsService.processCallback(query);
    return { RspCode: result.code, Message: result.message };
  }

  @Get("vnpay/return")
  @Redirect()
  async vnpayReturn(@Query() query: Record<string, unknown>) {
    const result = await this.paymentsService.inspectReturnCallback(query);
    const frontendUrl = this.config.get<string>("frontendUrl") ?? "http://localhost:3000";
    const redirectUrl = new URL("/checkout/confirmation", frontendUrl);
    if (result.orderId) redirectUrl.searchParams.set("orderId", result.orderId);
    redirectUrl.searchParams.set("paymentResult", result.outcome.toLowerCase());
    return { url: redirectUrl.toString(), statusCode: 302 };
  }
}
