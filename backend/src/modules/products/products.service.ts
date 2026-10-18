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
      },
    });

    return products.map((product) => ({
      ...product,
      id: product.id.toString(),
      price: product.price.toString(),
    }));
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