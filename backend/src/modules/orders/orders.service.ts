import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";

const PENDING_TTL_MS = 15 * 60 * 1000; // đơn PENDING hết hạn sau 15 phút

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((i) => BigInt(i.productId)))];
    const sizeIds = [...new Set(dto.items.map((i) => BigInt(i.productSizeId)))];
    const toppingIds = [
      ...new Set(
        dto.items.flatMap((i) => (i.toppings ?? []).map((t) => BigInt(t.toppingId))),
      ),
    ];

    // Giá luôn lấy từ DB, không tin giá do client gửi lên.
    const [user, products, sizes, productToppings] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, isActive: true },
        select: { id: true },
      }),
      this.prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, name: true, price: true },
      }),
      this.prisma.productSize.findMany({
        where: { id: { in: sizeIds }, isActive: true },
        select: { id: true, productId: true, sizeCode: true, extraPrice: true },
      }),
      this.prisma.productTopping.findMany({
        where: { toppingId: { in: toppingIds }, topping: { isActive: true } },
        select: {
          productId: true,
          topping: { select: { id: true, name: true, price: true } },
        },
      }),
    ]);

    if (!user) throw new BadRequestException("User not found.");

    const productMap = new Map(products.map((p) => [p.id.toString(), p]));
    const sizeMap = new Map(sizes.map((s) => [s.id.toString(), s]));
    const toppingMap = new Map(
      productToppings.map((pt) => [`${pt.productId}:${pt.topping.id}`, pt.topping]),
    );

    let subtotal = 0;

    const itemsData = dto.items.map((item, index) => {
      const label = `Item ${index + 1}`;

      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`${label}: product not found.`);

      const size = sizeMap.get(item.productSizeId);
      if (!size || size.productId !== product.id) {
        throw new BadRequestException(`${label}: size does not belong to this product.`);
      }

      const seen = new Set<string>();
      const toppingLines = (item.toppings ?? []).map((t) => {
        if (seen.has(t.toppingId)) {
          throw new BadRequestException(`${label}: duplicated topping ${t.toppingId}.`);
        }
        seen.add(t.toppingId);

        const topping = toppingMap.get(`${item.productId}:${t.toppingId}`);
        if (!topping) {
          throw new BadRequestException(`${label}: topping ${t.toppingId} is not available.`);
        }
        return {
          toppingId: topping.id,
          toppingName: topping.name,
          toppingPrice: topping.price.toNumber(),
          quantity: t.quantity ?? 1,
        };
      });

      // Giá VND là số nguyên nên tính bằng number không bị sai số.
      // unitPrice = giá món + phụ thu size + topping của 1 ly.
      const toppingTotal = toppingLines.reduce((sum, t) => sum + t.toppingPrice * t.quantity, 0);
      const unitPrice = product.price.toNumber() + size.extraPrice.toNumber() + toppingTotal;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        productSizeId: size.id,
        productName: product.name, // snapshot, đổi tên món sau này không ảnh hưởng đơn cũ
        sizeCode: size.sizeCode,
        sugarPercent: item.sugarPercent,
        icePercent: item.icePercent,
        note: item.note,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        toppings: { create: toppingLines },
      };
    });

    // Một lệnh create lồng nhau: đơn, các dòng, topping và lịch sử trạng thái
    // được ghi trong cùng một transaction (cùng thành công hoặc cùng thất bại).
    const order = await this.prisma.order.create({
      data: {
        orderCode: this.generateOrderCode(),
        userId,
        status: "PENDING",
        subtotal,
        discountAmount: 0, // khuyến mãi làm ở Task 10
        pointsEarned: 0, // điểm thưởng cộng sau khi đơn PAID (Task 10)
        total: subtotal,
        note: dto.note,
        expiresAt: new Date(Date.now() + PENDING_TTL_MS),
        orderItems: { create: itemsData },
        statusHistory: { create: { oldStatus: null, newStatus: "PENDING" } },
      },
      include: { orderItems: { include: { toppings: true } } },
    });

    return {
      id: order.id.toString(),
      orderCode: order.orderCode,
      status: order.status,
      subtotal: order.subtotal.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      total: order.total.toNumber(),
      note: order.note,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      items: order.orderItems.map((oi) => ({
        id: oi.id.toString(),
        productId: oi.productId.toString(),
        productName: oi.productName,
        sizeCode: oi.sizeCode,
        sugarPercent: oi.sugarPercent,
        icePercent: oi.icePercent,
        note: oi.note,
        quantity: oi.quantity,
        unitPrice: oi.unitPrice.toNumber(),
        lineTotal: oi.lineTotal.toNumber(),
        toppings: oi.toppings.map((t) => ({
          toppingId: t.toppingId.toString(),
          name: t.toppingName,
          price: t.toppingPrice.toNumber(),
          quantity: t.quantity,
        })),
      })),
    };
  }

  private generateOrderCode(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `BL${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
  }
}
