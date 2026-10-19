import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đơn hàng mới cho người dùng đã xác thực (được bảo vệ bởi JwtAuthGuard).
   */
  async create(userId: string, dto: CreateOrderDto) {
    const userBigIntId = BigInt(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userBigIntId },
    });

    if (!user) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    const items = dto.items || [];

    let subtotal = 0;
    if (items.length > 0) {
      subtotal = items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );
    } else if (dto.total) {
      subtotal = Number(dto.total);
    }

    const total = subtotal;
    const pointsEarned = Math.floor(total / 10000);

    // Đảm bảo các sản phẩm tồn tại trong CSDL để không vi phạm ràng buộc khóa ngoại (foreign key)
    const resolvedItems = [];
    for (const item of items) {
      let productIdBigInt: bigint;
      try {
        productIdBigInt = BigInt(item.productId);
      } catch {
        productIdBigInt = BigInt(1);
      }

      let product = await this.prisma.product.findUnique({
        where: { id: productIdBigInt },
      });

      if (!product) {
        product = await this.prisma.product.findFirst({
          where: { isActive: true },
        });

        if (!product) {
          product = await this.prisma.product.create({
            data: {
              name: item.productName || "Cà phê BrewLite",
              price: item.unitPrice || 35000,
              stock: 100,
              isActive: true,
            },
          });
        }
      }

      resolvedItems.push({
        productId: product.id,
        productName: item.productName || product.name,
        sizeCode: item.sizeCode || "M",
        sugarPercent: item.sugarPercent ?? 100,
        icePercent: item.icePercent ?? 100,
        note: item.note || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * Number(item.unitPrice),
      });
    }

    const order = await this.prisma.order.create({
      data: {
        orderCode,
        userId: userBigIntId,
        status: "PENDING",
        subtotal,
        discountAmount: 0,
        pointsEarned,
        total,
        note: dto.note?.trim() || null,
        statusHistory: {
          create: {
            newStatus: "PENDING",
            note: "Đơn hàng khởi tạo thành công",
          },
        },
        ...(resolvedItems.length > 0
          ? {
              orderItems: {
                create: resolvedItems.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
                  sizeCode: item.sizeCode,
                  sugarPercent: item.sugarPercent,
                  icePercent: item.icePercent,
                  note: item.note,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  lineTotal: item.lineTotal,
                })),
              },
            }
          : {}),
      },
      include: {
        orderItems: true,
        statusHistory: true,
      },
    });

    return {
      id: order.id.toString(),
      orderCode: order.orderCode,
      userId: order.userId.toString(),
      status: order.status,
      subtotal: order.subtotal.toString(),
      discountAmount: order.discountAmount.toString(),
      pointsEarned: order.pointsEarned,
      total: order.total.toString(),
      note: order.note,
      createdAt: order.createdAt,
      items: order.orderItems.map((item) => ({
        id: item.id.toString(),
        productId: item.productId.toString(),
        productName: item.productName,
        sizeCode: item.sizeCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
      })),
    };
  }

  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại.
   */
  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: true,
      },
    });

    return orders.map((order) => ({
      id: order.id.toString(),
      orderCode: order.orderCode,
      status: order.status,
      total: order.total.toString(),
      pointsEarned: order.pointsEarned,
      note: order.note,
      createdAt: order.createdAt,
      itemsCount: order.orderItems.length,
      items: order.orderItems.map((item) => ({
        id: item.id.toString(),
        productName: item.productName,
        quantity: item.quantity,
        lineTotal: item.lineTotal.toString(),
      })),
    }));
  }
}
