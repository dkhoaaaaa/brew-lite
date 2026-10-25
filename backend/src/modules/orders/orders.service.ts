import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { MockPaymentDto } from "./dto/mock-payment.dto.js";

const PENDING_TTL_MS = 2 * 60 * 1000; // Đơn PENDING hết hạn sau 2 phút theo yêu cầu

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tự động xử lý các đơn hàng đã hết hạn 2 phút:
   * - Đơn PENDING: Bị xóa khỏi cơ sở dữ liệu.
   * - Đơn PAYMENT_FAILED: Được tự động chuyển trạng thái thành CANCELLED (không xóa).
   */
  async cleanupExpiredOrders(userId?: bigint): Promise<void> {
    const now = new Date();
    try {
      // 1. Đơn PENDING quá hạn 2 phút -> Xóa khỏi database
      const expiredPending = await this.prisma.order.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
          ...(userId ? { userId } : {}),
        },
        select: { id: true },
      });

      if (expiredPending.length > 0) {
        const pendingIds = expiredPending.map((o) => o.id);
        await this.prisma.payment.deleteMany({
          where: { orderId: { in: pendingIds } },
        });
        await this.prisma.order.deleteMany({
          where: { id: { in: pendingIds } },
        });
      }

      // 2. Đơn PAYMENT_FAILED quá hạn 2 phút -> Đổi trạng thái thành CANCELLED
      const expiredFailed = await this.prisma.order.findMany({
        where: {
          status: "PAYMENT_FAILED",
          expiresAt: { lt: now },
          ...(userId ? { userId } : {}),
        },
        select: { id: true },
      });

      if (expiredFailed.length > 0) {
        const failedIds = expiredFailed.map((o) => o.id);
        await this.prisma.$transaction([
          this.prisma.order.updateMany({
            where: { id: { in: failedIds } },
            data: { status: "CANCELLED" },
          }),
          this.prisma.orderStatusHistory.createMany({
            data: failedIds.map((orderId) => ({
              orderId,
              oldStatus: "PAYMENT_FAILED",
              newStatus: "CANCELLED",
              note: "Hết hạn thanh toán 2 phút, tự động chuyển sang đã hủy",
            })),
          }),
        ]);
      }
    } catch {
      // Không để lỗi cleanup làm gián đoạn luồng chính
    }
  }

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
      const toppingTotal = toppingLines.reduce((sum, t) => sum + t.toppingPrice * t.quantity, 0);
      const unitPrice = product.price.toNumber() + size.extraPrice.toNumber() + toppingTotal;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        productSizeId: size.id,
        productName: product.name,
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

    const order = await this.prisma.order.create({
      data: {
        orderCode: this.generateOrderCode(),
        userId,
        status: "PENDING",
        subtotal,
        discountAmount: 0,
        pointsEarned: 0,
        total: subtotal,
        note: dto.note,
        expiresAt: new Date(Date.now() + PENDING_TTL_MS),
        orderItems: { create: itemsData },
        statusHistory: { create: { oldStatus: null, newStatus: "PENDING" } },
      },
      include: { orderItems: { include: { toppings: true } } },
    });

    return this.serializeOrder(order);
  }

  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại.
   * Đơn PENDING mới tạo vẫn hiển thị bình thường; đơn quá 2 phút sẽ tự dọn dẹp biến mất.
   */
  async findMyOrders(userId: bigint, statusFilter?: string) {
    // 1. Tự động dọn dẹp các đơn PENDING của user đã hết hạn quá 2 phút
    await this.cleanupExpiredOrders(userId);

    // 2. Lấy danh sách đơn còn hiệu lực
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: { toppings: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return orders.map((o) => this.serializeOrder(o));
  }

  /**
   * Lấy chi tiết một đơn hàng theo ID.
   * Kiểm tra quyền sở hữu và thời hạn 2 phút của đơn PENDING.
   */
  async findById(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { toppings: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          orderBy: { changedAt: "asc" },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại.");
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền truy cập đơn hàng này.");
    }

    // Nếu đơn PENDING quá 2 phút -> Xóa và báo hết hạn
    if (order.status === "PENDING" && order.expiresAt && order.expiresAt < new Date()) {
      await this.prisma.payment.deleteMany({ where: { orderId: order.id } });
      await this.prisma.order.delete({ where: { id: order.id } });
      throw new NotFoundException("Đơn hàng đã quá hạn thanh toán 2 phút và đã bị hủy.");
    }

    // Nếu đơn PAYMENT_FAILED quá 2 phút -> Đổi trạng thái thành CANCELLED
    if (order.status === "PAYMENT_FAILED" && order.expiresAt && order.expiresAt < new Date()) {
      const [updatedCancelled] = await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
          include: {
            orderItems: { include: { toppings: true } },
            payments: { orderBy: { createdAt: "desc" } },
            statusHistory: { orderBy: { changedAt: "asc" } },
          },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: "PAYMENT_FAILED",
            newStatus: "CANCELLED",
            note: "Hết hạn thanh toán 2 phút, tự động chuyển sang đã hủy",
          },
        }),
      ]);
      return this.serializeOrder(updatedCancelled);
    }

    return this.serializeOrder(order);
  }

  /**
   * Xử lý Mock Payment phía Backend:
   * - Nếu thành công: Cập nhật status thành PAID, tạo bản ghi Payment SUCCESS, ghi lịch sử.
   * - Nếu thất bại: Tạo bản ghi Payment FAILED, giữ nguyên status PENDING để thanh toán lại.
   */
  async processMockPayment(orderId: bigint, userId: bigint, dto: MockPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại.");
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền thanh toán đơn hàng này.");
    }

    // Nếu đơn hàng đã PAID -> Trả về kết quả thành công (Idempotent)
    if (order.status === "PAID") {
      return {
        outcome: "SIMULATED_SUCCESS",
        orderId: order.id.toString(),
        orderCode: order.orderCode,
        status: "PAID",
        paymentStatus: "SUCCESS",
        message: "Đơn hàng đã được thanh toán trước đó.",
      };
    }

    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      throw new BadRequestException(
        `Đơn hàng không ở trạng thái có thể thanh toán (trạng thái hiện tại: ${order.status}).`,
      );
    }

    // Kiểm tra hết hạn 2 phút
    if (order.expiresAt && order.expiresAt < new Date()) {
      if (order.status === "PENDING") {
        await this.prisma.payment.deleteMany({ where: { orderId: order.id } });
        await this.prisma.order.delete({ where: { id: order.id } });
        throw new BadRequestException("Đơn hàng đã hết hạn thanh toán (quá 2 phút) và đã bị hủy. Vui lòng tạo đơn mới.");
      } else if (order.status === "PAYMENT_FAILED") {
        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          }),
          this.prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: "PAYMENT_FAILED",
              newStatus: "CANCELLED",
              note: "Hết hạn thanh toán 2 phút, tự động chuyển sang đã hủy",
            },
          }),
        ]);
        throw new BadRequestException("Đơn hàng đã hết hạn thanh toán (quá 2 phút) và đã được chuyển sang trạng thái Đã hủy.");
      }
    }

    if (dto.outcome === "success") {
      // Thực hiện cập nhật trong Transaction để đảm bảo tính nhất quán
      const idempotencyKey = dto.idempotencyKey || `mock_success_${order.id}_${Date.now()}`;
      const txCode = `MOCK-TX-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;

      const [updatedOrder] = await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        }),
        this.prisma.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.total,
            method: dto.method,
            provider: "MOCK_PAYMENT",
            status: "SUCCESS",
            transactionCode: txCode,
            failureReason: null,
            rawResponse: {
              outcome: "SIMULATED_SUCCESS",
              simulation: true,
              processedAt: new Date().toISOString(),
            },
            paidAt: new Date(),
          },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: "PAID",
            note: `Mô phỏng thanh toán thành công qua ${dto.method === "E_WALLET" ? "Ví điện tử" : "Thẻ ngân hàng"}`,
          },
        }),
      ]);

      return {
        outcome: "SIMULATED_SUCCESS",
        orderId: updatedOrder.id.toString(),
        orderCode: updatedOrder.orderCode,
        status: "PAID",
        paymentStatus: "SUCCESS",
        message: "Mô phỏng thanh toán thành công.",
      };
    } else {
      // Khi thất bại: Ghi nhận Payment FAILED và chuyển status đơn hàng thành PAYMENT_FAILED
      const idempotencyKey = dto.idempotencyKey || `mock_fail_${order.id}_${Date.now()}`;
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: "PAYMENT_FAILED" },
        }),
        this.prisma.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.total,
            method: dto.method,
            provider: "MOCK_PAYMENT",
            status: "FAILED",
            failureReason: "Người dùng mô phỏng thanh toán thất bại.",
            rawResponse: { outcome: "SIMULATED_FAILURE", simulation: true },
          },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: "PAYMENT_FAILED",
            note: "Mô phỏng thanh toán thất bại",
          },
        }),
      ]);

      return {
        outcome: "SIMULATED_FAILURE",
        orderId: order.id.toString(),
        orderCode: order.orderCode,
        status: "PAYMENT_FAILED",
        paymentStatus: "FAILED",
        message: "Mô phỏng thanh toán thất bại. Vui lòng thử thanh toán lại.",
      };
    }
  }

  /**
   * Hủy đơn hàng theo luồng PENDING -> CANCELLED hoặc PAYMENT_FAILED -> CANCELLED.
   * Đơn sau khi hủy vẫn được lưu giữ trong database và hiển thị ở mục "Đã hủy".
   */
  async cancelOrder(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại.");
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền hủy đơn hàng này.");
    }

    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      throw new BadRequestException("Chỉ có thể hủy đơn hàng đang chờ thanh toán hoặc thanh toán lỗi.");
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: "CANCELLED",
          note: "Người dùng hủy đơn hàng.",
        },
      }),
    ]);

    return this.serializeOrder(updatedOrder);
  }

  private generateOrderCode(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `BL${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
  }

  private serializeOrder(order: any) {
    return {
      id: order.id.toString(),
      orderCode: order.orderCode,
      status: order.status,
      subtotal: order.subtotal?.toNumber ? order.subtotal.toNumber() : Number(order.subtotal),
      discountAmount: order.discountAmount?.toNumber
        ? order.discountAmount.toNumber()
        : Number(order.discountAmount),
      total: order.total?.toNumber ? order.total.toNumber() : Number(order.total),
      note: order.note ?? null,
      expiresAt: order.expiresAt ? new Date(order.expiresAt).toISOString() : null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
      items: (order.orderItems ?? []).map((oi: any) => ({
        id: oi.id.toString(),
        productId: oi.productId.toString(),
        productName: oi.productName,
        sizeCode: oi.sizeCode ?? null,
        sugarPercent: oi.sugarPercent ?? null,
        icePercent: oi.icePercent ?? null,
        note: oi.note ?? null,
        quantity: oi.quantity,
        unitPrice: oi.unitPrice?.toNumber ? oi.unitPrice.toNumber() : Number(oi.unitPrice),
        lineTotal: oi.lineTotal?.toNumber ? oi.lineTotal.toNumber() : Number(oi.lineTotal),
        toppings: (oi.toppings ?? []).map((t: any) => ({
          toppingId: t.toppingId.toString(),
          name: t.toppingName,
          price: t.toppingPrice?.toNumber ? t.toppingPrice.toNumber() : Number(t.toppingPrice),
          quantity: t.quantity,
        })),
      })),
      payments: (order.payments ?? []).map((p: any) => ({
        id: p.id.toString(),
        method: p.method,
        status: p.status,
        amount: p.amount?.toNumber ? p.amount.toNumber() : Number(p.amount),
        transactionCode: p.transactionCode ?? null,
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : null,
      })),
      statusHistory: (order.statusHistory ?? []).map((h: any) => ({
        id: h.id.toString(),
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        changedAt: h.changedAt ? new Date(h.changedAt).toISOString() : null,
        note: h.note ?? null,
      })),
    };
  }
}
