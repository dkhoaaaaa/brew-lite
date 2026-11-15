import { describe, expect, it, vi } from "vitest";
import { AppController } from "../../src/app.controller.js";
import { AppService } from "../../src/app.service.js";

describe("Health Check Integration", () => {
  it("trả về status: ok và database: connected khi database hoạt động tốt", async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };
    const appService = new AppService(mockPrisma as never);
    const appController = new AppController(appService);

    const result = await appController.getHealth();

    expect(result.success).toBe(true);
    expect(result.status).toBe("ok");
    expect(result.database).toBe("connected");
    expect(result.message).toBe("BrewLite API is running");
    expect(result.timestamp).toBeDefined();
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it("trả về status: degraded và database: disconnected khi database gặp lỗi kết nối", async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("Connection refused")),
    };
    const appService = new AppService(mockPrisma as never);
    const appController = new AppController(appService);

    const result = await appController.getHealth();

    expect(result.success).toBe(false);
    expect(result.status).toBe("degraded");
    expect(result.database).toBe("disconnected");
    expect(result.message).toBe("BrewLite API is running");
    expect(result.timestamp).toBeDefined();
  });
});
