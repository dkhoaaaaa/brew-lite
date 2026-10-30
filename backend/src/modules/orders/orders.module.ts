import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { OrdersController } from "./orders.controller.js";
import { PaymentsController } from "./payments.controller.js";
import { OrdersService } from "./orders.service.js";
import { VnpayPaymentsService } from "./vnpay-payments.service.js";

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService, VnpayPaymentsService],
  exports: [OrdersService],
})
export class OrdersModule {}
