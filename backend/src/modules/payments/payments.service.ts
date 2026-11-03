import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service.js";

type VnpayParams = Record<string, string>;

const VNPAY_PROVIDER = "VNPAY";

function vietnamTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

function orderedQuery(params: VnpayParams): string {
  return Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createVnpayPayment(
    orderId: bigint,
    userId: bigint,
    idempotencyKey: string,
    clientIp: string,
  ): Promise<{ paymentUrl: string; orderId: string; paymentStatus: string }> {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      throw new BadRequestException("A valid Idempotency-Key header is required.");
    }

    const config = this.getVnpayConfig();
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException("Order not found.");
      if (order.userId !== userId) {
        throw new ForbiddenException("You cannot pay for this order.");
      }
      if (order.status === "PAID" || order.status === "PREPARING" ||
          order.status === "READY" || order.status === "COMPLETED") {
        throw new ConflictException("This order has already been paid.");
      }
      if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
        throw new ConflictException("This order is not payable.");
      }
      if (order.expiresAt && order.expiresAt <= now) {
        throw new ConflictException("This order has expired.");
      }

      let expiresAt = order.expiresAt;
      if (!expiresAt) {
        const ttlMinutes = this.config.get<number>("payment.ttlMinutes") ?? 5;
        if (!Number.isSafeInteger(ttlMinutes) || ttlMinutes < 1 || ttlMinutes > 1440) {
          throw new ServiceUnavailableException(
            "PAYMENT_TTL_MINUTES must be an integer between 1 and 1440.",
          );
        }
        expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
        await tx.order.update({
          where: { id: orderId },
          data: { expiresAt },
        });
      }

      const requestPayment = await tx.payment.findUnique({
        where: { idempotencyKey },
      });
      if (requestPayment) {
        if (
          requestPayment.orderId !== order.id ||
          requestPayment.provider !== VNPAY_PROVIDER
        ) {
          throw new ConflictException(
            "Idempotency key has already been used for another payment.",
          );
        }
        if (requestPayment.status === "SUCCESS") {
          throw new ConflictException("This payment has already succeeded.");
        }
        if (requestPayment.status !== "PENDING") {
          throw new ConflictException(
            "This payment attempt is no longer active. Start a new attempt.",
          );
        }
        return { payment: requestPayment, expiresAt };
      }

      const previousAttempt = await tx.payment.findFirst({
        where: { orderId, provider: VNPAY_PROVIDER, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      if (previousAttempt) return { payment: previousAttempt, expiresAt };

      const amountVnd = Number(order.total);
      if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0) {
        throw new BadRequestException("Order total must be a positive integer in VND.");
      }

      const payment = await tx.payment.create({
        data: {
          orderId,
          idempotencyKey,
          amount: amountVnd,
          method: VNPAY_PROVIDER,
          provider: VNPAY_PROVIDER,
          status: "PENDING",
          rawResponse: {
            vnpCreateDate: vietnamTimestamp(now),
            clientIp: clientIp.slice(0, 45),
          },
        },
      });
      return { payment, expiresAt };
    });

    const resultPayment = result.payment;
    const metadata = resultPayment.rawResponse;
    const createDate =
      typeof metadata === "object" && metadata !== null &&
      "vnpCreateDate" in metadata && typeof metadata.vnpCreateDate === "string"
        ? metadata.vnpCreateDate
        : vietnamTimestamp(resultPayment.createdAt);
    const ip =
      typeof metadata === "object" && metadata !== null &&
      "clientIp" in metadata && typeof metadata.clientIp === "string"
        ? metadata.clientIp
        : clientIp.slice(0, 45);
    const params: VnpayParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: (Number(resultPayment.amount) * 100).toString(),
      vnp_CurrCode: "VND",
      vnp_TxnRef: resultPayment.id.toString(),
      vnp_OrderInfo: `Thanh toan don hang ${orderId.toString()}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: ip || "127.0.0.1",
      vnp_CreateDate: createDate,
      vnp_ExpireDate: vietnamTimestamp(result.expiresAt),
    };

    const signData = orderedQuery(params);
    const signature = createHmac("sha512", config.hashSecret)
      .update(signData, "utf8")
      .digest("hex");
    const paymentUrl = `${config.paymentUrl}?${signData}&vnp_SecureHash=${signature}`;

    return {
      paymentUrl,
      orderId: orderId.toString(),
      paymentStatus: resultPayment.status,
    };
  }

  async handleIpn(query: Record<string, string | string[] | undefined>) {
    const config = this.getVnpayConfig();
    const params = this.normalizedQuery(query);
    const signature = params.vnp_SecureHash;
    if (!signature || !this.verifySignature(params, config.hashSecret)) {
      return { RspCode: "97", Message: "Invalid signature" };
    }
    if (params.vnp_TmnCode !== config.tmnCode) {
      return { RspCode: "97", Message: "Invalid merchant" };
    }
    if (
      !/^\d{1,19}$/.test(params.vnp_TxnRef ?? "") ||
      !/^\d+$/.test(params.vnp_Amount ?? "") ||
      !/^\d+$/.test(params.vnp_TransactionNo ?? "") ||
      !/^\d{2}$/.test(params.vnp_ResponseCode ?? "") ||
      !/^\d{2}$/.test(params.vnp_TransactionStatus ?? "")
    ) {
      return { RspCode: "99", Message: "Invalid callback data" };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: BigInt(params.vnp_TxnRef) },
      include: { order: { select: { id: true } } },
    });
    if (!payment || payment.provider !== VNPAY_PROVIDER) {
      return { RspCode: "01", Message: "Order not found" };
    }
    if (
      !payment.order ||
      params.vnp_OrderInfo !== `Thanh toan don hang ${payment.order.id.toString()}`
    ) {
      return { RspCode: "04", Message: "Invalid order reference" };
    }
    const callbackAmount = Number(params.vnp_Amount);
    const expectedAmount = Number(payment.amount) * 100;
    if (
      !Number.isSafeInteger(callbackAmount) ||
      !Number.isSafeInteger(expectedAmount) ||
      callbackAmount !== expectedAmount
    ) {
      return { RspCode: "04", Message: "Invalid amount" };
    }
    if (
      payment.status === "SUCCESS" &&
      payment.transactionCode === params.vnp_TransactionNo
    ) {
      return { RspCode: "00", Message: "Confirm Success" };
    }
    if (!["PENDING", "EXPIRED", "FAILED"].includes(payment.status)) {
      return { RspCode: "02", Message: "Payment already processed" };
    }

    const success =
      params.vnp_ResponseCode === "00" &&
      params.vnp_TransactionStatus === "00";
    const paymentStatus = success
      ? "SUCCESS"
      : params.vnp_ResponseCode === "24"
        ? "CANCELLED"
        : "FAILED";
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.orderId} FOR UPDATE`;
      const current = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { order: true },
      });
      if (!current) return;
      if (!["PENDING", "EXPIRED", "FAILED"].includes(current.status)) return;

      const callbackData = {
        vnpResponseCode: params.vnp_ResponseCode,
        vnpTransactionStatus: params.vnp_TransactionStatus,
        vnpTransactionNo: params.vnp_TransactionNo,
        vnpTxnRef: params.vnp_TxnRef,
        vnpAmount: params.vnp_Amount,
        receivedAt: new Date().toISOString(),
      };
      const now = new Date();
      const expired =
        current.order.expiresAt !== null && current.order.expiresAt <= now;
      const currentOrderAmount = Number(current.order.total);
      const amountMatchesCurrentOrder =
        Number.isSafeInteger(currentOrderAmount) &&
        currentOrderAmount === Number(current.amount);
      const stateIsPayable =
        current.order.status === "PENDING" ||
        current.order.status === "PAYMENT_FAILED";
      const canPay = !expired && stateIsPayable && amountMatchesCurrentOrder;

      if (!canPay) {
        if (expired && stateIsPayable) {
          await tx.order.update({
            where: { id: current.orderId },
            data: { status: "CANCELLED" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: current.orderId,
              oldStatus: current.order.status,
              newStatus: "CANCELLED",
              note: "Payment window expired before the provider callback was processed.",
              changedAt: now,
            },
          });
          await this.restoreOrderStock(tx, current.orderId);
        }
        await tx.payment.update({
          where: { id: current.id },
          data: {
            status: paymentStatus,
            transactionCode: params.vnp_TransactionNo,
            failureReason: success
              ? amountMatchesCurrentOrder
                ? "Provider reported success after the order became non-payable; manual reconciliation required."
                : "Provider reported success for an amount different from the current order total; manual reconciliation required."
              : `VNPay response ${params.vnp_ResponseCode}/${params.vnp_TransactionStatus}`,
            rawResponse: callbackData,
            ...(success ? { paidAt: now } : {}),
          },
        });
        return;
      }

      const shouldAwardPoints = current.order.pointsEarned === 0;
      await tx.payment.update({
        where: { id: current.id },
        data: {
          status: paymentStatus,
          transactionCode: params.vnp_TransactionNo,
          failureReason: success
            ? null
            : `VNPay response ${params.vnp_ResponseCode}/${params.vnp_TransactionStatus}`,
          rawResponse: callbackData,
          ...(success ? { paidAt: now } : {}),
        },
      });

      const targetStatus = success ? "PAID" : "PAYMENT_FAILED";
      await tx.order.update({
        where: { id: current.orderId },
        data: {
          status: targetStatus,
          ...(success && shouldAwardPoints ? { pointsEarned: 100 } : {}),
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: current.orderId,
          oldStatus: current.order.status,
          newStatus: targetStatus,
          note: success ? "VNPay payment confirmed by IPN." : "VNPay payment failed.",
          changedAt: now,
        },
      });

      if (success && shouldAwardPoints) {
        await tx.user.update({
          where: { id: current.order.userId },
          data: { loyaltyPoints: { increment: 100 } },
        });
      }
      if (success && current.order.promotionId) {
        await tx.promotion.update({
          where: { id: current.order.promotionId },
          data: { usedCount: { increment: 1 } },
        });
        await tx.promotionUsage.upsert({
          where: { orderId: current.orderId },
          update: {},
          create: {
            promotionId: current.order.promotionId,
            userId: current.order.userId,
            orderId: current.orderId,
            discountAmount: current.order.discountAmount,
          },
        });
      }
    });

    return { RspCode: "00", Message: "Confirm Success" };
  }

  async getReturnDestination(query: Record<string, string | string[] | undefined>) {
    const config = this.getVnpayConfig();
    const reference = typeof query.vnp_TxnRef === "string" ? query.vnp_TxnRef : "";
    const payment = /^\d{1,19}$/.test(reference)
      ? await this.prisma.payment.findUnique({
          where: { id: BigInt(reference) },
          select: { orderId: true, provider: true },
        })
      : null;
    const destination = new URL("/checkout/confirmation", config.frontendUrl);
    if (payment?.provider === VNPAY_PROVIDER) {
      destination.searchParams.set("orderId", payment.orderId.toString());
    }
    destination.searchParams.set("paymentReturn", "vnpay");
    return destination.toString();
  }

  private getVnpayConfig() {
    const paymentUrl = this.config.get<string>("payment.vnpay.paymentUrl");
    const tmnCode = this.config.get<string>("payment.vnpay.tmnCode");
    const hashSecret = this.config.get<string>("payment.vnpay.hashSecret");
    const returnUrl = this.config.get<string>("payment.vnpay.returnUrl");
    const frontendUrl = this.config.get<string>("payment.vnpay.frontendUrl");
    if (!paymentUrl || !tmnCode || !hashSecret || !returnUrl || !frontendUrl) {
      throw new ServiceUnavailableException(
        "VNPay configuration is incomplete. Set the required backend environment variables.",
      );
    }
    return { paymentUrl, tmnCode, hashSecret, returnUrl, frontendUrl };
  }

  private normalizedQuery(
    query: Record<string, string | string[] | undefined>,
  ): VnpayParams {
    return Object.fromEntries(
      Object.entries(query)
        .filter(
          (entry): entry is [string, string] =>
            typeof entry[1] === "string" && entry[0].startsWith("vnp_"),
        ),
    );
  }

  private verifySignature(params: VnpayParams, secret: string): boolean {
    const signature = params.vnp_SecureHash;
    if (!signature || !/^[a-fA-F0-9]{128}$/.test(signature)) return false;
    const unsigned = { ...params };
    delete unsigned.vnp_SecureHash;
    delete unsigned.vnp_SecureHashType;
    const expected = createHmac("sha512", secret)
      .update(orderedQuery(unsigned), "utf8")
      .digest();
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  private async restoreOrderStock(tx: any, orderId: bigint): Promise<void> {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      include: { toppings: true },
    });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          version: { increment: 1 },
        },
      });
      for (const topping of item.toppings) {
        await tx.topping.update({
          where: { id: topping.toppingId },
          data: {
            stock: { increment: topping.quantity },
            version: { increment: 1 },
          },
        });
      }
    }
  }
}
