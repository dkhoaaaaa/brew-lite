import { describe, expect, it } from "vitest";
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateOrderDto } from "../src/modules/orders/dto/create-order.dto.js";

async function errorsOf(payload: unknown) {
  return validate(plainToInstance(CreateOrderDto, payload));
}

const item = (extra: Record<string, unknown> = {}) => ({
  productId: "1",
  productSizeId: "2",
  quantity: 1,
  ...extra,
});

describe("CreateOrderDto", () => {
  it("chấp nhận dữ liệu hợp lệ", async () => {
    expect(await errorsOf({ items: [item({ sugarPercent: 50, icePercent: 70 })] })).toHaveLength(0);
  });

  it("từ chối mảng items rỗng", async () => {
    expect((await errorsOf({ items: [] })).length).toBeGreaterThan(0);
  });

  it("từ chối số lượng bằng 0", async () => {
    expect((await errorsOf({ items: [item({ quantity: 0 })] })).length).toBeGreaterThan(0);
  });

  it("từ chối % đường không thuộc 0/30/50/70/100", async () => {
    expect((await errorsOf({ items: [item({ sugarPercent: 40 })] })).length).toBeGreaterThan(0);
  });

  it("từ chối id không phải số", async () => {
    expect((await errorsOf({ items: [item({ productId: "abc" })] })).length).toBeGreaterThan(0);
  });
});
