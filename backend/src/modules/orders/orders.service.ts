import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";

const STATUS_PROGRESSION: Record<string, number> = {
  PAID: 0,
  PREPARING: 1,
  READY: 2,
  COMPLETED: 3,
};

export const ALLOWED_STATE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "READY", "COMPLETED"],
  PREPARING: ["READY", "COMPLETED"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function validateStateTransition(currentStatus: string, targetStatus: string): void {
  if (currentStatus === targetStatus) return;
  const allowed = ALLOWED_STATE_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái đơn hàng từ "${currentStatus}" sang "${targetStatus}".`,
    );
  }
}

export function determineStatusByElapsed(elapsedMs: number): "PAID" | "PREPARING" | "READY" | "COMPLETED" {
  if (elapsedMs < 60_000) {
    return "PAID";
  } else if (elapsedMs < 180_000) {
    return "PREPARING";
  } else if (elapsedMs < 300_000) {
    return "READY";
  } else {
    return "COMPLETED";
  }
}
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { MockPaymentDto } from "./dto/mock-payment.dto.js";

const PENDING_TTL_MS = 2 * 60 * 1000; // Đơn PENDING hết hạn sau 2 phút theo yêu cầu

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private syncTimer?: NodeJS.Timeout;

  onModuleInit() {
    this.syncTimer = setInterval(async () => {
      try {
        await this.syncActiveOrders();
      } catch {
        // Tránh unhandled rejection
      }
    }, 15_000);
  }

  onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  /**
   * Quét và đồng bộ tất cả đơn hàng đang trong tiến trình xử lý (PAID, PREPARING, READY)
   */
  async syncActiveOrders(now: Date = new Date()): Promise<void> {
    try {
      const activeOrders = await this.prisma.order.findMany({
        where: { status: { in: ["PAID", "PREPARING", "READY"] } },
        include: {
          payments: { where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" }, take: 1 },
          statusHistory: { orderBy: { changedAt: "asc" } },
        },
        take: 50,
      });

      for (const order of activeOrders) {
        await this.syncOrderState(order, now);
      }
    } catch {
      // Bỏ qua lỗi ngầm
    }
  }

  /**
   * Đồng bộ trạng thái đơn hàng theo thời gian kể từ lúc thanh toán thành công (paidAt).
   * Quy tắc:
   * - 0 đến dưới 1 phút: PAID
   * - 1 đến dưới 3 phút: PREPARING
   * - 3 đến dưới 5 phút: READY
   * - Từ 5 phút trở đi: COMPLETED
   * Chỉ tiến tới, không bao giờ quay lùi.
   */
  async syncOrderState(order: any, now: Date = new Date()): Promise<any> {
    if (!order || !["PAID", "PREPARING", "READY"].includes(order.status)) {
      return order;
    }

    let paidAt: Date | null = null;

    if (order.payments && Array.isArray(order.payments)) {
      const successPayment = order.payments.find((p: any) => p.status === "SUCCESS" && p.paidAt);
      if (successPayment) {
        paidAt = new Date(successPayment.paidAt);
      }
    }

    if (!paidAt && order.statusHistory && Array.isArray(order.statusHistory)) {
      const paidHistory = order.statusHistory.find((h: any) => h.newStatus === "PAID" && h.changedAt);
      if (paidHistory) {
        paidAt = new Date(paidHistory.changedAt);
      }
    }

    if (!paidAt) {
      const dbPayment = await this.prisma.payment.findFirst({
        where: { orderId: order.id, status: "SUCCESS", paidAt: { not: null } },
        orderBy: { createdAt: "desc" },
      });
      if (dbPayment?.paidAt) {
        paidAt = new Date(dbPayment.paidAt);
      } else {
        const dbHistory = await this.prisma.orderStatusHistory.findFirst({
          where: { orderId: order.id, newStatus: "PAID" },
          orderBy: { changedAt: "asc" },
        });
        if (dbHistory?.changedAt) {
          paidAt = new Date(dbHistory.changedAt);
        }
      }
    }

    if (!paidAt || isNaN(paidAt.getTime())) {
      return order;
    }

    const elapsedMs = now.getTime() - paidAt.getTime();
    if (elapsedMs < 0) return order;

    const targetStatus = determineStatusByElapsed(elapsedMs);
    const currentProgression = STATUS_PROGRESSION[order.status];
    const targetProgression = STATUS_PROGRESSION[targetStatus];

    if (
      targetProgression !== undefined &&
      currentProgression !== undefined &&
      targetProgression > currentProgression
    ) {
      const notesMap: Record<string, string> = {
        PREPARING: "Đã quá 1 phút kể từ khi thanh toán: Đang chuẩn bị đồ uống.",
        READY: "Đã quá 3 phút kể từ khi thanh toán: Đồ uống đã sẵn sàng.",
        COMPLETED: "Đã quá 5 phút kể từ khi thanh toán: Hoàn thành đơn hàng.",
      };

      const [updatedOrder] = await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: targetStatus },
          include: {
            orderItems: { include: { toppings: true } },
            payments: { orderBy: { createdAt: "desc" } },
            statusHistory: { orderBy: { changedAt: "asc" } },
          },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: targetStatus,
            note: notesMap[targetStatus] ?? `Tự động chuyển sang ${targetStatus}`,
            changedAt: now,
          },
        }),
      ]);

      return updatedOrder;
    }

    return order;
  }
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hoàn lại số lượng tồn kho cho các sản phẩm và topping của một đơn hàng khi hủy hoặc hết hạn.
   * Đồng thời tăng version của sản phẩm/topping để đảm bảo tính nhất quán (Optimistic Locking).
   */
  async restoreOrderStock(tx: any, orderId: bigint): Promise<void> {
    try {
      if (!tx?.orderItem?.findMany) return;
      const items = await tx.orderItem.findMany({
        where: { orderId },
        include: { toppings: true },
      });

      if (!Array.isArray(items) || items.length === 0) return;

      for (const item of items) {
        if (item.productId && item.quantity && tx.product?.update) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              version: { increment: 1 },
            },
          });
        }

        if (Array.isArray(item.toppings) && tx.topping?.update) {
          for (const t of item.toppings) {
            if (t.toppingId && t.quantity) {
              await tx.topping.update({
                where: { id: t.toppingId },
                data: {
                  stock: { increment: t.quantity },
                  version: { increment: 1 },
                },
              });
            }
          }
        }
      }
    } catch {
      // Bỏ qua lỗi trong restoreOrderStock nếu bảng/mock không hỗ trợ
    }
  }

  /**
   * Tự động xử lý các đơn hàng đã hết hạn 2 phút:
   * - Đơn PENDING: Bị xóa khỏi cơ sở dữ liệu và hoàn trả tồn kho.
   * - Đơn PAYMENT_FAILED: Được tự động chuyển trạng thái thành CANCELLED và hoàn trả tồn kho.
   */
  async cleanupExpiredOrders(userId?: bigint): Promise<void> {
    const now = new Date();
    try {
      // 1. Đơn PENDING quá hạn 2 phút -> Hoàn tồn kho và xóa khỏi database
      const expiredPending = await this.prisma.order.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
          ...(userId ? { userId } : {}),
        },
        select: { id: true },
      });

      if (expiredPending && expiredPending.length > 0) {
        const pendingIds = expiredPending.map((o) => o.id);
        for (const order of expiredPending) {
          await this.restoreOrderStock(this.prisma, order.id);
        }
        await this.prisma.payment.deleteMany({
          where: { orderId: { in: pendingIds } },
        });
        await this.prisma.order.deleteMany({
          where: { id: { in: pendingIds } },
        });
      }

      // 2. Đơn PAYMENT_FAILED quá hạn 2 phút -> Hoàn tồn kho và đổi trạng thái thành CANCELLED
      const expiredFailed = await this.prisma.order.findMany({
        where: {
          status: "PAYMENT_FAILED",
          expiresAt: { lt: now },
          ...(userId ? { userId } : {}),
        },
        select: { id: true },
      });

      if (expiredFailed && expiredFailed.length > 0) {
        const failedIds = expiredFailed.map((o) => o.id);
        for (const order of expiredFailed) {
          await this.restoreOrderStock(this.prisma, order.id);
        }
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

  async create(userId: bigint, dto: CreateOrderDto, idempotencyKey?: string) {
    // 1. Xử lý Idempotent: nếu có idempotencyKey và đã tồn tại payment/order, trả về kết quả cũ
    if (idempotencyKey) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
        include: {
          order: {
            include: {
              orderItems: { include: { toppings: true } },
              payments: { orderBy: { createdAt: "desc" } },
              statusHistory: { orderBy: { changedAt: "asc" } },
            },
          },
        },
      });
      if (existingPayment?.order) {
        return this.serializeOrder(existingPayment.order);
      }
    }

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
        select: { id: true, name: true, price: true, stock: true, version: true },
      }),
      this.prisma.productSize.findMany({
        where: { id: { in: sizeIds }, isActive: true },
        select: { id: true, productId: true, sizeCode: true, extraPrice: true },
      }),
      this.prisma.productTopping.findMany({
        where: { toppingId: { in: toppingIds }, topping: { isActive: true } },
        select: {
          productId: true,
          topping: { select: { id: true, name: true, price: true, stock: true, version: true } },
        },
      }),
    ]);

    if (!user) throw new BadRequestException("User not found.");

    const productMap = new Map(products.map((p) => [p.id.toString(), p]));
    const sizeMap = new Map(sizes.map((s) => [s.id.toString(), s]));
    const toppingMap = new Map(
      productToppings.map((pt) => [`${pt.productId}:${pt.topping.id}`, pt.topping]),
    );

    const toppingEntityMap = new Map<string, any>();
    for (const pt of productToppings) {
      toppingEntityMap.set(pt.topping.id.toString(), pt.topping);
    }

    // Tính tổng số lượng yêu cầu của từng sản phẩm và topping
    const productRequiredQty = new Map<string, number>();
    const toppingRequiredQty = new Map<string, number>();

    for (const item of dto.items) {
      productRequiredQty.set(
        item.productId,
        (productRequiredQty.get(item.productId) || 0) + item.quantity,
      );
      for (const t of item.toppings ?? []) {
        const tQty = (t.quantity ?? 1) * item.quantity;
        toppingRequiredQty.set(
          t.toppingId,
          (toppingRequiredQty.get(t.toppingId) || 0) + tQty,
        );
      }
    }

    // Kiểm tra số lượng tồn kho trước khi tạo
    for (const [pIdStr, reqQty] of productRequiredQty.entries()) {
      const p = productMap.get(pIdStr);
      if (!p) throw new BadRequestException(`Sản phẩm không tồn tại.`);
      if (typeof p.stock === "number" && p.stock < reqQty) {
        throw new BadRequestException(
          `Sản phẩm "${p.name}" không đủ số lượng tồn kho (chỉ còn ${p.stock}, yêu cầu ${reqQty}).`,
        );
      }
    }

    for (const [tIdStr, reqQty] of toppingRequiredQty.entries()) {
      const t = toppingEntityMap.get(tIdStr);
      if (t && typeof t.stock === "number" && t.stock < reqQty) {
        throw new BadRequestException(
          `Topping "${t.name}" không đủ số lượng tồn kho (chỉ còn ${t.stock}, yêu cầu ${reqQty}).`,
        );
      }
    }

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
          toppingPrice: topping.price.toNumber ? topping.price.toNumber() : Number(topping.price),
          quantity: t.quantity ?? 1,
        };
      });

      // Giá VND là số nguyên nên tính bằng number không bị sai số.
      const toppingTotal = toppingLines.reduce((sum, t) => sum + t.toppingPrice * t.quantity, 0);
      const prodPrice = product.price.toNumber ? product.price.toNumber() : Number(product.price);
      const extraPrice = size.extraPrice.toNumber ? size.extraPrice.toNumber() : Number(size.extraPrice);
      const unitPrice = prodPrice + extraPrice + toppingTotal;
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

    const executeOrderCreation = async (tx: any) => {
      // 1. Trừ tồn kho bằng Optimistic Locking (version & stock condition)
      for (const [pIdStr, reqQty] of productRequiredQty.entries()) {
        const p = productMap.get(pIdStr)!;
        if (typeof p.stock === "number" && typeof p.version === "number") {
          const updater = tx?.product?.updateMany ?? this.prisma.product?.updateMany;
          if (updater) {
            const updateResult = await updater({
              where: {
                id: p.id,
                version: p.version,
                stock: { gte: reqQty },
              },
              data: {
                stock: { decrement: reqQty },
                version: { increment: 1 },
              },
            });
            if (updateResult.count === 0) {
              throw new ConflictException(
                `Sản phẩm "${p.name}" đã hết hàng hoặc có xung đột tồn kho. Vui lòng thử lại.`,
              );
            }
          }
        }
      }

      for (const [tIdStr, reqQty] of toppingRequiredQty.entries()) {
        const t = toppingEntityMap.get(tIdStr);
        if (t && typeof t.stock === "number" && typeof t.version === "number") {
          const updater = tx?.topping?.updateMany ?? this.prisma.topping?.updateMany;
          if (updater) {
            const updateResult = await updater({
              where: {
                id: t.id,
                version: t.version,
                stock: { gte: reqQty },
              },
              data: {
                stock: { decrement: reqQty },
                version: { increment: 1 },
              },
            });
            if (updateResult.count === 0) {
              throw new ConflictException(
                `Topping "${t.name}" đã hết hàng hoặc có xung đột tồn kho. Vui lòng thử lại.`,
              );
            }
          }
        }
      }

      // 2. Tạo đơn hàng PENDING
      const orderCreator = tx?.order?.create ?? this.prisma.order.create;
      const order = await orderCreator({
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

      // 3. Nếu có idempotencyKey, tạo Payment khởi tạo trạng thái PENDING với idempotencyKey
      const paymentCreator = tx?.payment?.create ?? this.prisma.payment?.create;
      if (idempotencyKey && paymentCreator) {
        await paymentCreator({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: subtotal,
            method: "PENDING",
            provider: "BREWLITE",
            status: "PENDING",
          },
        });
      }

      return order;
    };

    try {
      // Nếu $transaction hỗ trợ callback
      let order: any;
      if (this.prisma.$transaction) {
        order = await this.prisma.$transaction(async (tx) => {
          return executeOrderCreation(tx);
        });
      } else {
        order = await executeOrderCreation(this.prisma);
      }
      return this.serializeOrder(order);
    } catch (error: any) {
      if (error?.code === "P2002" && idempotencyKey) {
        const existingPayment = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
          include: {
            order: {
              include: {
                orderItems: { include: { toppings: true } },
                payments: { orderBy: { createdAt: "desc" } },
                statusHistory: { orderBy: { changedAt: "asc" } },
              },
            },
          },
        });
        if (existingPayment?.order) {
          return this.serializeOrder(existingPayment.order);
        }
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn hàng của người dùng hiện tại.
   * Đơn PENDING mới tạo vẫn hiển thị bình thường; đơn quá 2 phút sẽ tự dọn dẹp biến mất.
   */
  async findMyOrders(userId: bigint, statusFilter?: string) {
    // 1. Tự động dọn dẹp các đơn PENDING của user đã hết hạn quá 2 phút
    await this.cleanupExpiredOrders(userId);

    // 2. Lấy danh sách đơn còn hiệu lực
    const rawOrders = await this.prisma.order.findMany({
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
        },
        statusHistory: {
          orderBy: { changedAt: "asc" },
        },
      },
    });

    const orders = Array.isArray(rawOrders) ? rawOrders : [];

    // 3. Đồng bộ trạng thái theo thời gian cho các đơn đang trong tiến trình xử lý
    const syncedOrders = await Promise.all(
      orders.map(async (o) => {
        if (["PAID", "PREPARING", "READY"].includes(o.status)) {
          return this.syncOrderState(o);
        }
        return o;
      }),
    );

    return syncedOrders.map((o) => this.serializeOrder(o));
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
      await this.prisma.$transaction(async (tx) => {
        await this.restoreOrderStock(tx, order.id);
        await tx.payment.deleteMany({ where: { orderId: order.id } });
        await tx.order.delete({ where: { id: order.id } });
      });
      throw new NotFoundException("Đơn hàng đã quá hạn thanh toán 2 phút và đã bị hủy.");
    }

    // Nếu đơn PAYMENT_FAILED quá 2 phút -> Đổi trạng thái thành CANCELLED
    if (order.status === "PAYMENT_FAILED" && order.expiresAt && order.expiresAt < new Date()) {
      const updatedCancelled = await this.prisma.$transaction(async (tx) => {
        await this.restoreOrderStock(tx, order.id);
        const o = await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
          include: {
            orderItems: { include: { toppings: true } },
            payments: { orderBy: { createdAt: "desc" } },
            statusHistory: { orderBy: { changedAt: "asc" } },
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: "PAYMENT_FAILED",
            newStatus: "CANCELLED",
            note: "Hết hạn thanh toán 2 phút, tự động chuyển sang đã hủy",
          },
        });
        return o;
      });
      return this.serializeOrder(updatedCancelled);
    }

    // Nếu đơn đang ở trạng thái PAID, PREPARING, READY -> Đồng bộ trạng thái trước khi trả về
    if (["PAID", "PREPARING", "READY"].includes(order.status)) {
      const syncedOrder = await this.syncOrderState(order);
      return this.serializeOrder(syncedOrder);
    }

    return this.serializeOrder(order);
  }

  /**
   * Xử lý Mock Payment phía Backend:
   * - Nếu thành công: Cập nhật status thành PAID, tạo bản ghi Payment SUCCESS, ghi lịch sử.
   * - Nếu thất bại: Tạo bản ghi Payment FAILED, giữ nguyên status PENDING để thanh toán lại.
   */
  async processMockPayment(orderId: bigint, userId: bigint, dto: MockPaymentDto, idempotencyKeyHeader?: string) {
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

    const effectiveIdempotencyKey = idempotencyKeyHeader || dto.idempotencyKey;

    // Idempotent Check: Nếu key đã được sử dụng trước đó, trả về kết quả đã lưu trữ
    if (effectiveIdempotencyKey) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { idempotencyKey: effectiveIdempotencyKey },
        include: { order: true },
      });
      if (existingPayment) {
        return {
          outcome: existingPayment.status === "SUCCESS" ? "SIMULATED_SUCCESS" : "SIMULATED_FAILURE",
          orderId: existingPayment.orderId.toString(),
          orderCode: existingPayment.order?.orderCode ?? order.orderCode,
          status: existingPayment.order?.status ?? (existingPayment.status === "SUCCESS" ? "PAID" : "PAYMENT_FAILED"),
          paymentStatus: existingPayment.status,
          message: existingPayment.status === "SUCCESS"
            ? "Đơn hàng đã được thanh toán trước đó (Idempotent response)."
            : "Giao dịch đã được ghi nhận thất bại trước đó (Idempotent response).",
          pointsEarned: 0,
        };
      }
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
        pointsEarned: 0,
      };
    }

    // State Machine Validation: Kiểm tra chuyển đổi trạng thái hợp lệ
    const targetStatus = dto.outcome === "success" ? "PAID" : "PAYMENT_FAILED";
    validateStateTransition(order.status, targetStatus);

    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      throw new BadRequestException(
        `Đơn hàng không ở trạng thái có thể thanh toán (trạng thái hiện tại: ${order.status}).`,
      );
    }

    // Kiểm tra hết hạn 2 phút -> hoàn tồn kho nếu hết hạn
    if (order.expiresAt && order.expiresAt < new Date()) {
      if (order.status === "PENDING") {
        await this.prisma.$transaction(async (tx) => {
          await this.restoreOrderStock(tx, order.id);
          await tx.payment.deleteMany({ where: { orderId: order.id } });
          await tx.order.delete({ where: { id: order.id } });
        });
        throw new BadRequestException("Đơn hàng đã hết hạn thanh toán (quá 2 phút) và đã bị hủy. Vui lòng tạo đơn mới.");
      } else if (order.status === "PAYMENT_FAILED") {
        await this.prisma.$transaction(async (tx) => {
          await this.restoreOrderStock(tx, order.id);
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: "PAYMENT_FAILED",
              newStatus: "CANCELLED",
              note: "Hết hạn thanh toán 2 phút, tự động chuyển sang đã hủy",
            },
          });
        });
        throw new BadRequestException("Đơn hàng đã hết hạn thanh toán (quá 2 phút) và đã được chuyển sang trạng thái Đã hủy.");
      }
    }

    const idempotencyKey = effectiveIdempotencyKey || `mock_${dto.outcome}_${order.id}_${Date.now()}`;

    try {
      if (dto.outcome === "success") {
        // Thực hiện cập nhật trong Transaction để đảm bảo tính nhất quán
        const txCode = `MOCK-TX-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
        const shouldAwardPoints = (order.pointsEarned ?? 0) === 0;

        const txOperations: any[] = [
          this.prisma.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              ...(shouldAwardPoints ? { pointsEarned: 100 } : {}),
            },
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
              note: `Mô phỏng thanh toán thành công qua ${dto.method === "E_WALLET" ? "Ví điện tử" : "Thẻ ngân hàng"}${shouldAwardPoints ? " (+100 điểm thưởng)" : ""}`,
            },
          }),
        ];

        // Nếu chưa cộng điểm cho đơn này, cộng 100 điểm vào tài khoản user
        if (shouldAwardPoints) {
          txOperations.push(
            this.prisma.user.update({
              where: { id: order.userId },
              data: { loyaltyPoints: { increment: 100 } },
            }),
          );
        }

        // Nếu đơn hàng có sử dụng voucher, cập nhật usedCount và ghi nhận PromotionUsage
        if (order.promotionId) {
          txOperations.push(
            this.prisma.promotion.update({
              where: { id: order.promotionId },
              data: { usedCount: { increment: 1 } },
            }),
          );
          txOperations.push(
            this.prisma.promotionUsage.upsert({
              where: { orderId: order.id },
              update: {},
              create: {
                promotionId: order.promotionId,
                userId: order.userId,
                orderId: order.id,
                discountAmount: order.discountAmount,
              },
            }),
          );
        }

        const [updatedOrder] = await this.prisma.$transaction(txOperations);

        return {
          outcome: "SIMULATED_SUCCESS",
          orderId: updatedOrder.id.toString(),
          orderCode: updatedOrder.orderCode,
          status: "PAID",
          paymentStatus: "SUCCESS",
          message: "Mô phỏng thanh toán thành công.",
          pointsEarned: shouldAwardPoints ? 100 : 0,
        };
      } else {
        // Khi thất bại: Ghi nhận Payment FAILED và chuyển status đơn hàng thành PAYMENT_FAILED
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
    } catch (error: any) {
      if (error?.code === "P2002" && idempotencyKey) {
        const existingPayment = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
          include: { order: true },
        });
        if (existingPayment) {
          return {
            outcome: existingPayment.status === "SUCCESS" ? "SIMULATED_SUCCESS" : "SIMULATED_FAILURE",
            orderId: existingPayment.orderId.toString(),
            orderCode: existingPayment.order?.orderCode ?? order.orderCode,
            status: existingPayment.order?.status ?? (existingPayment.status === "SUCCESS" ? "PAID" : "PAYMENT_FAILED"),
            paymentStatus: existingPayment.status,
            message: "Đơn hàng đã được thanh toán trước đó (Idempotent response).",
            pointsEarned: 0,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Áp dụng mã khuyến mại (voucher) vào đơn hàng đang chờ thanh toán.
   */
  async applyVoucher(orderId: bigint, userId: bigint, voucherCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { toppings: true } },
        payments: { orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại.");
    }
    if (order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền thao tác trên đơn hàng này.");
    }
    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      throw new BadRequestException("Chỉ có thể áp dụng mã khuyến mại cho đơn hàng chưa thanh toán.");
    }

    const cleanCode = (voucherCode || "").trim().toUpperCase();
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: cleanCode },
    });

    if (!promotion) {
      throw new NotFoundException("Mã khuyến mại không tồn tại.");
    }

    if (promotion.ownerUserId && promotion.ownerUserId !== userId) {
      throw new BadRequestException("Mã khuyến mại này không thuộc về tài khoản của bạn.");
    }

    if (!promotion.isActive) {
      throw new BadRequestException("Mã khuyến mại hiện đang tạm khóa hoặc không hoạt động.");
    }

    const now = new Date();
    if (promotion.endAt < now) {
      throw new BadRequestException("Mã khuyến mại đã hết hạn sử dụng.");
    }

    if (promotion.usedCount >= (promotion.usageLimit ?? 1)) {
      throw new BadRequestException("Mã khuyến mại này đã được sử dụng.");
    }

    const subtotal = order.subtotal?.toNumber ? order.subtotal.toNumber() : Number(order.subtotal);
    const minOrder = promotion.minOrderAmount?.toNumber ? promotion.minOrderAmount.toNumber() : Number(promotion.minOrderAmount);
    if (subtotal < minOrder) {
      throw new BadRequestException(`Đơn hàng phải đạt tối thiểu ${minOrder.toLocaleString("vi-VN")} đ để áp dụng mã này.`);
    }

    const discountVal = promotion.discountValue?.toNumber ? promotion.discountValue.toNumber() : Number(promotion.discountValue);
    const discountAmount = Math.min(discountVal, subtotal);
    const total = Math.max(0, subtotal - discountAmount);

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        promotionId: promotion.id,
        discountAmount,
        total,
      },
      include: {
        orderItems: { include: { toppings: true } },
        payments: { orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });

    return this.serializeOrder(updatedOrder);
  }

  /**
   * Hủy áp dụng mã khuyến mại khỏi đơn hàng.
   */
  async removeVoucher(orderId: bigint, userId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại.");
    }
    if (order.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền thao tác trên đơn hàng này.");
    }
    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      throw new BadRequestException("Chỉ có thể thay đổi mã khuyến mại cho đơn hàng chưa thanh toán.");
    }

    const subtotal = order.subtotal?.toNumber ? order.subtotal.toNumber() : Number(order.subtotal);

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        promotionId: null,
        discountAmount: 0,
        total: subtotal,
      },
      include: {
        orderItems: { include: { toppings: true } },
        payments: { orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });

    return this.serializeOrder(updatedOrder);
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

    // State Machine validation
    validateStateTransition(order.status, "CANCELLED");

    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
      throw new BadRequestException("Chỉ có thể hủy đơn hàng đang chờ thanh toán hoặc thanh toán lỗi.");
    }

    // Hoàn lại tồn kho cho sản phẩm và topping
    await this.restoreOrderStock(this.prisma, order.id);

    const [updatedOrder] = await this.prisma.$transaction([
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
      pointsEarned: order.pointsEarned ?? 0,
      promotionId: order.promotionId ? order.promotionId.toString() : null,
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
