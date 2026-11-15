import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../../src/app.module.js";
import { PrismaService } from "../../src/prisma/prisma.service.js";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
        $connect: vi.fn().mockResolvedValue(undefined),
        $disconnect: vi.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("GET / trả về lời chào từ BrewLite Backend", async () => {
    const res = await request(app.getHttpServer()).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Hello from BrewLite Backend!");
  });

  it("GET /health trả về trạng thái hoạt động của API và Database", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
    expect(res.body.message).toBe("BrewLite API is running");
  });
});
