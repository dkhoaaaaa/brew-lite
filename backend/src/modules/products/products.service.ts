import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính số lượng sản phẩm tối đa có thể bán dựa trên công thức và tồn kho nguyên liệu.
   * availableQuantity = MIN(FLOOR(ingredientStock / requiredQuantity))
   * Nếu thiếu công thức hoặc nguyên liệu không đủ -> sản phẩm coi như hết hàng.
   */
  calculateStockFromRecipes(
    recipes?: Array<{
      quantity: any;
      ingredient?: { stockQuantity: any; isActive: boolean } | null;
    }>,
  ): { availableQuantity: number; isOutOfStock: boolean } {
    if (!recipes || recipes.length === 0) {
      return { availableQuantity: 0, isOutOfStock: true };
    }

    let minCups = Infinity;

    for (const r of recipes) {
      if (!r.ingredient || !r.ingredient.isActive) {
        return { availableQuantity: 0, isOutOfStock: true };
      }

      const reqQty = Number(r.quantity);
      const stockQty = Number(r.ingredient.stockQuantity);

      if (reqQty <= 0) continue;

      const cups = Math.floor(stockQty / reqQty);
      if (cups < minCups) {
        minCups = cups;
      }
    }

    const availableQuantity = minCups === Infinity ? 0 : Math.max(0, minCups);
    return {
      availableQuantity,
      isOutOfStock: availableQuantity <= 0,
    };
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        categoryId: true,
        stock: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        productRecipes: {
          select: {
            quantity: true,
            ingredient: {
              select: {
                stockQuantity: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return products.map((product) => {
      const stockInfo = this.calculateStockFromRecipes(product.productRecipes);
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl,
        categoryId: product.categoryId ? product.categoryId.toString() : null,
        categoryName: product.category?.name ?? null,
        stock: stockInfo.availableQuantity,
        availableQuantity: stockInfo.availableQuantity,
        isOutOfStock: stockInfo.isOutOfStock,
      };
    });
  }

  // Hàm phục vụ Phân trang
  async findAllPaginated(page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;

    const [products, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        skip: skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          categoryId: true,
          stock: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          productRecipes: {
            select: {
              quantity: true,
              ingredient: {
                select: {
                  stockQuantity: true,
                  isActive: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({
        where: { isActive: true },
      }),
    ]);

    const formattedProducts = products.map((product) => {
      const stockInfo = this.calculateStockFromRecipes(product.productRecipes);
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl,
        categoryId: product.categoryId ? product.categoryId.toString() : null,
        categoryName: product.category?.name ?? null,
        stock: stockInfo.availableQuantity,
        availableQuantity: stockInfo.availableQuantity,
        isOutOfStock: stockInfo.isOutOfStock,
      };
    });

    return {
      data: formattedProducts,
      meta: {
        totalItems,
        itemCount: formattedProducts.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
        currentPage: page,
      },
    };
  }

  async findOne(id: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        categoryId: true,
        stock: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        productRecipes: {
          select: {
            quantity: true,
            ingredient: {
              select: {
                stockQuantity: true,
                isActive: true,
              },
            },
          },
        },
        productSizes: {
          where: { isActive: true },
          orderBy: { sizeCode: "asc" },
          select: {
            id: true,
            sizeCode: true,
            extraPrice: true,
          },
        },
        productToppings: {
          where: { topping: { isActive: true } },
          orderBy: { topping: { name: "asc" } },
          select: {
            topping: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!product) return null;

    const stockInfo = this.calculateStockFromRecipes(product.productRecipes);

    return {
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId ? product.categoryId.toString() : null,
      categoryName: product.category?.name ?? null,
      stock: stockInfo.availableQuantity,
      availableQuantity: stockInfo.availableQuantity,
      isOutOfStock: stockInfo.isOutOfStock,
      sizes: product.productSizes.map((size) => ({
        id: size.id.toString(),
        sizeCode: size.sizeCode,
        extraPrice: size.extraPrice.toString(),
      })),
      toppings: product.productToppings.map(({ topping }) => ({
        id: topping.id.toString(),
        name: topping.name,
        price: topping.price.toString(),
      })),
    };
  }
}
