import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return products.map((product) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId ? product.categoryId.toString() : null,
      categoryName: product.category?.name ?? null,
    }));
  }

  // Hàm phục vụ Phân trang
  async findAllPaginated(page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;

    // Sử dụng Promise.all để chạy song song việc lấy dữ liệu trang và đếm tổng số lượng (tối ưu hiệu suất)
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
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.product.count({
        where: { isActive: true },
      }),
    ]);

    const formattedProducts = products.map((product) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId ? product.categoryId.toString() : null,
      categoryName: product.category?.name ?? null,
    }));

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
        category: {
          select: {
            id: true,
            name: true,
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

    return {
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId ? product.categoryId.toString() : null,
      categoryName: product.category?.name ?? null,
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
