import { describe, expect, it, vi } from "vitest";
import { ProductsService } from "../src/modules/products/products.service.js";

const money = (value: number) => ({ toNumber: () => value, toString: () => value.toString() });

describe("TASK 10 - ProductsService: Tính tồn kho theo công thức nguyên liệu", () => {
  it("tính chính xác availableQuantity = MIN(FLOOR(stock / recipeQty))", () => {
    const service = new ProductsService({} as never);

    // Công thức:
    // Bột cà phê (cần 20g, kho có 100g -> 5 ly)
    // Sữa (cần 150ml, kho có 300ml -> 2 ly)
    // Đường (cần 15g, kho có 100g -> 6 ly)
    const recipes = [
      { quantity: 20, ingredient: { stockQuantity: 100, isActive: true } },
      { quantity: 150, ingredient: { stockQuantity: 300, isActive: true } },
      { quantity: 15, ingredient: { stockQuantity: 100, isActive: true } },
    ];

    const result = service.calculateStockFromRecipes(recipes);
    // Tối đa chỉ có thể bán 2 ly do sữa chỉ đủ 2 ly
    expect(result.availableQuantity).toBe(2);
    expect(result.isOutOfStock).toBe(false);
  });

  it("đánh dấu hết hàng (isOutOfStock = true, availableQuantity = 0) khi có 1 nguyên liệu không đủ", () => {
    const service = new ProductsService({} as never);

    // Sữa còn 0ml -> 0 ly
    const recipes = [
      { quantity: 20, ingredient: { stockQuantity: 100, isActive: true } },
      { quantity: 150, ingredient: { stockQuantity: 50, isActive: true } }, // thiếu vì cần 150ml
    ];

    const result = service.calculateStockFromRecipes(recipes);
    expect(result.availableQuantity).toBe(0);
    expect(result.isOutOfStock).toBe(true);
  });

  it("coi như hết hàng nếu sản phẩm không có công thức nguyên liệu hoặc nguyên liệu bị vô hiệu hóa", () => {
    const service = new ProductsService({} as never);

    // Không có công thức
    const emptyResult = service.calculateStockFromRecipes([]);
    expect(emptyResult.availableQuantity).toBe(0);
    expect(emptyResult.isOutOfStock).toBe(true);

    // Nguyên liệu bị deactive
    const inactiveResult = service.calculateStockFromRecipes([
      { quantity: 20, ingredient: { stockQuantity: 100, isActive: false } },
    ]);
    expect(inactiveResult.availableQuantity).toBe(0);
    expect(inactiveResult.isOutOfStock).toBe(true);
  });

  it("findOne trả về availableQuantity và isOutOfStock chính xác cho sản phẩm", async () => {
    const prisma = {
      product: {
        findFirst: vi.fn().mockResolvedValue({
          id: 1n,
          name: "Cà phê sữa",
          description: "Ngon",
          price: money(30000),
          imageUrl: "/caphe.jpg",
          categoryId: 1n,
          category: { id: 1n, name: "Cà phê" },
          productSizes: [],
          productToppings: [],
          productRecipes: [
            { quantity: 20, ingredient: { stockQuantity: 100, isActive: true } },
            { quantity: 150, ingredient: { stockQuantity: 300, isActive: true } },
          ],
        }),
      },
    };

    const service = new ProductsService(prisma as never);
    const product = await service.findOne(1n);

    expect(product).not.toBeNull();
    expect(product?.availableQuantity).toBe(2);
    expect(product?.isOutOfStock).toBe(false);
  });
});

