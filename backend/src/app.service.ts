import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service.js";

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return "Hello from BrewLite Backend!";
  }

  async checkHealth() {
    let dbStatus = "connected";
    try {
      if (this.prisma.$queryRaw) {
        await this.prisma.$queryRaw`SELECT 1`;
      }
    } catch {
      dbStatus = "disconnected";
    }

    return {
      success: dbStatus === "connected",
      status: dbStatus === "connected" ? "ok" : "degraded",
      message: "BrewLite API is running",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
