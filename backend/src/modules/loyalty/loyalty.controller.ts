import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoyaltyService } from "./loyalty.service.js";

@Controller("loyalty")
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserId(authHeader?: string, userIdHeader?: string): bigint {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = this.jwtService.verify(token);
        if (payload?.sub) return BigInt(payload.sub);
      } catch {
        // Fall through to check userIdHeader
      }
    }
    if (userIdHeader && /^\d{1,18}$/.test(userIdHeader)) {
      return BigInt(userIdHeader);
    }
    throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này.");
  }

  @Get("rewards")
  getRewards() {
    return this.loyaltyService.getRewardTiers();
  }

  @Post("redeem")
  redeemVoucher(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Body("tierId") tierId: string,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.loyaltyService.redeemVoucher(userId, tierId);
  }

  @Get("my-vouchers")
  getMyVouchers(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.loyaltyService.getMyVouchers(userId);
  }

  @Get("history")
  getLoyaltyHistory(
    @Headers("authorization") authHeader: string | undefined,
    @Headers("x-user-id") userIdHeader: string | undefined,
  ) {
    const userId = this.getUserId(authHeader, userIdHeader);
    return this.loyaltyService.getLoyaltyHistory(userId);
  }
}

