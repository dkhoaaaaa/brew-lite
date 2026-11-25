import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { LoyaltyController } from "./loyalty.controller.js";
import { LoyaltyService } from "./loyalty.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}

