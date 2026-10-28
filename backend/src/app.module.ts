import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import configuration from "./config/configuration.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { LoyaltyModule } from "./modules/loyalty/loyalty.module.js";
import { OrdersModule } from "./modules/orders/orders.module.js";
import { ProductsModule } from "./modules/products/products.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    ProductsModule,
    AuthModule,
    OrdersModule,
    LoyaltyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
