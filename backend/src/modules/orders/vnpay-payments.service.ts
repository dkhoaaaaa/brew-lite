import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { CreateVnpayPaymentDto } from "./dto/create-vnpay-payment.dto.js";
import {
  signVnpayParameters,
  verifyVnpaySignature,
  type VnpayParameters,
} from "./vnpay-signature.js";

const VNPAY_PROVIDER = "VNPAY_SANDBOX";
const SANDBOX_PAYMENT_URL =
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

type CallbackResult = {
  accepted: boolean;
  code: string;
  message: string;
  orderId?: string;
  outcome: "SUCCESS" | "FAILED" | "CANCELLED" | "UNKNOWN";
};

type ValidatedCallback = {
  valid: true;
  result: CallbackResult;
  paymentId: bigint;
  orderId: bigint;
  paymentStatus: "SUCCESS" | "FAILED" | "CANCELLED";
  orderStatus: "PAID" | "PAYMENT_FAILED" | "CANCELLED";
  sanitizedResponse: {
    responseCode: string;
    transactionStatus: string;
    transactionNo: string | null;
  };
};

type CallbackValidation =
  | ValidatedCallback
  | { valid: false; result: CallbackResult };

@Injectable()
export class VnpayPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createPayment(
    orderId: bigint,
    userId: bigint,
    dto: CreateVnpayPaymentDto,
    ipAddress: string,
  ) {
    const configuration = this.getConfiguration();
    const paymentChannel = dto.paymentChannel ?? "VNBANK";
    const idempotencyKey = `vnpay:${orderId}:${paymentChannel}:${dto.idempotencyKey}`;
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });
      if (!order) throw new NotFoundException("Đơn hàng không tồn tại.");
      if (order.userId !== userId) {
        throw new ForbiddenException("Bạn không có quyền thanh toán đơn hàng này.");
      }
      if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
        throw new BadRequestException(
          `Đơn hàng không thể thanh toán ở trạng thái ${order.status}.`,
        );
      }
      if (order.expiresAt && order.expiresAt <= new Date()) {
        throw new BadRequestException("Đơn hàng đã hết hạn thanh toán.");
      }

      const previousPayment = await transaction.payment.findUnique({
        where: { idempotencyKey },
      });
      if (previousPayment) {
        if (previousPayment.orderId !== orderId || previousPayment.provider !== VNPAY_PROVIDER) {
          throw new BadRequestException("Khóa idempotency đã được dùng cho giao dịch khác.");
        }
        if (previousPayment.status !== "PENDING") {
          throw new BadRequestException(
            "Yêu cầu thanh toán này đã được xử lý. Hãy bắt đầu một lần thử mới.",
          );
        }
        const savedUrl = this.readCheckoutUrl(previousPayment.rawResponse);
        if (savedUrl) {
          return { orderId: orderId.toString(), checkoutUrl: savedUrl };
        }
        throw new BadRequestException("Không tìm thấy URL của yêu cầu thanh toán đang chờ.");
      }

      const activePayment = order.payments.find(
        (payment) => payment.provider === VNPAY_PROVIDER && payment.status === "PENDING",
      );
      if (activePayment) {
        const activeUrl = this.readCheckoutUrl(activePayment.rawResponse);
        if (activeUrl) {
          return { orderId: orderId.toString(), checkoutUrl: activeUrl };
        }
        throw new BadRequestException("Đơn hàng đã có một giao dịch VNPay đang chờ.");
      }

      const amount = order.total.toNumber();
      const amountInCents = amount * 100;
      if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) {
        throw new BadRequestException("Số tiền đơn hàng không hợp lệ để thanh toán.");
      }

      const transactionReference = `${order.orderCode}-${randomBytes(4).toString("hex").toUpperCase()}`;
      const expiryMinutes = this.config.get<number>("payments.orderExpiryMinutes");
      if (
        !Number.isSafeInteger(expiryMinutes) ||
        expiryMinutes === undefined ||
        expiryMinutes < 1 ||
        expiryMinutes > 1440
      ) {
        throw new ServiceUnavailableException("Thời hạn thanh toán chưa được cấu hình hợp lệ.");
      }
      const expiresAt =
        order.expiresAt ?? new Date(Date.now() + expiryMinutes * 60 * 1000);
      const parameters: VnpayParameters = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: configuration.tmnCode,
        vnp_Amount: String(amountInCents),
        vnp_CurrCode: "VND",
        vnp_BankCode: paymentChannel,
        vnp_TxnRef: transactionReference,
        vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: configuration.returnUrl,
        vnp_IpAddr: normalizeIpAddress(ipAddress),
        vnp_CreateDate: formatVnpayDate(new Date()),
        vnp_ExpireDate: formatVnpayDate(expiresAt),
      };
      const signature = signVnpayParameters(parameters, configuration.hashSecret);
      const checkoutUrl = new URL(configuration.paymentUrl);
      for (const [key, value] of Object.entries(parameters)) {
        checkoutUrl.searchParams.set(key, value);
      }
      checkoutUrl.searchParams.set("vnp_SecureHash", signature);

      const rawResponse = {
        checkoutUrl: checkoutUrl.toString(),
        expiresAt: expiresAt.toISOString(),
        paymentChannel,
      };
      await transaction.payment.create({
        data: {
          orderId,
          idempotencyKey,
          amount: order.total,
          method: "VNPAY",
          provider: VNPAY_PROVIDER,
          status: "PENDING",
          transactionCode: transactionReference,
          rawResponse,
        },
      });

      return { orderId: orderId.toString(), checkoutUrl: checkoutUrl.toString() };
    });
  }

  async inspectReturnCallback(
    rawParameters: Record<string, unknown>,
  ): Promise<CallbackResult> {
    const validation = await this.validateCallback(rawParameters);
    return validation.result;
  }

  async processCallback(rawParameters: Record<string, unknown>): Promise<CallbackResult> {
    const validation = await this.validateCallback(rawParameters);
    if (!validation.valid) return validation.result;

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT id FROM orders WHERE id = ${validation.orderId} FOR UPDATE
      `;

      const currentPayment = await transaction.payment.findUnique({
        where: { id: validation.paymentId },
      });
      if (!currentPayment) {
        return {
          accepted: false,
          code: "01",
          message: "Order not found",
          orderId: validation.orderId.toString(),
          outcome: "UNKNOWN",
        };
      }
      if (currentPayment.status === "SUCCESS") {
        return { ...validation.result, outcome: "SUCCESS" };
      }

      const allowedStatuses =
        validation.paymentStatus === "SUCCESS"
          ? ["PENDING", "FAILED", "CANCELLED"]
          : ["PENDING"];
      const paymentUpdate = await transaction.payment.updateMany({
        where: {
          id: validation.paymentId,
          status: { in: allowedStatuses },
        },
        data: {
          status: validation.paymentStatus,
          failureReason:
            validation.paymentStatus === "SUCCESS"
              ? null
              : `VNPAY response ${validation.sanitizedResponse.responseCode}`,
          rawResponse: validation.sanitizedResponse,
          paidAt: validation.paymentStatus === "SUCCESS" ? new Date() : null,
        },
      });
      if (paymentUpdate.count === 0) {
        const latestPayment = await transaction.payment.findUnique({
          where: { id: validation.paymentId },
        });
        return {
          ...validation.result,
          outcome: paymentStatusToOutcome(latestPayment?.status),
        };
      }

      const currentOrder = await transaction.order.findUnique({
        where: { id: validation.orderId },
      });
      if (!currentOrder) {
        return {
          accepted: false,
          code: "01",
          message: "Order not found",
          orderId: validation.orderId.toString(),
          outcome: "UNKNOWN",
        };
      }

      const shouldUpdateOrder =
        validation.orderStatus === "PAID"
          ? currentOrder.status !== "PAID"
          : currentOrder.status === "PENDING" ||
            (validation.orderStatus === "CANCELLED" &&
              currentOrder.status === "PAYMENT_FAILED");
      if (shouldUpdateOrder) {
        await transaction.order.update({
          where: { id: validation.orderId },
          data: { status: validation.orderStatus },
        });
        await transaction.orderStatusHistory.create({
          data: {
            orderId: validation.orderId,
            oldStatus: currentOrder.status,
            newStatus: validation.orderStatus,
            note:
              validation.paymentStatus === "SUCCESS"
                ? "VNPay IPN xác nhận thanh toán qua chữ ký hợp lệ."
                : validation.paymentStatus === "CANCELLED"
                  ? "Khách hàng đã hủy giao dịch tại VNPay."
                  : "VNPay xác nhận giao dịch không thành công.",
          },
        });
      }

      return validation.result;
    });
  }

  private async validateCallback(
    rawParameters: Record<string, unknown>,
  ): Promise<CallbackValidation> {
    const invalid = (code: string, message: string, orderId?: string): CallbackValidation => ({
      valid: false,
      result: { accepted: false, code, message, orderId, outcome: "UNKNOWN" },
    });

    let parameters: VnpayParameters;
    try {
      parameters = toVnpayParameters(rawParameters);
    } catch {
      return invalid("99", "Invalid callback parameters");
    }

    const configuration = this.getConfigurationOrNull();
    if (!configuration) {
      return invalid("99", "Payment gateway is not configured");
    }
    if (
      parameters.vnp_TmnCode !== configuration.tmnCode ||
      !verifyVnpaySignature(parameters, configuration.hashSecret)
    ) {
      return invalid("97", "Invalid signature");
    }

    const transactionReference = parameters.vnp_TxnRef;
    const amount = Number(parameters.vnp_Amount);
    if (
      !transactionReference ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !/^\d{2}$/.test(parameters.vnp_ResponseCode ?? "") ||
      !/^\d{2}$/.test(parameters.vnp_TransactionStatus ?? "")
    ) {
      return invalid("99", "Missing or invalid transaction fields");
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: VNPAY_PROVIDER,
        transactionCode: transactionReference,
      },
      include: { order: true },
    });
    if (!payment) {
      return invalid("01", "Order not found");
    }
    const expectedAmount = payment.amount.toNumber() * 100;
    if (amount !== expectedAmount) {
      return invalid("04", "Invalid amount", payment.orderId.toString());
    }
    const transactionPrefix = `${payment.order.orderCode}-`;
    const transactionSuffix = transactionReference.startsWith(transactionPrefix)
      ? transactionReference.slice(transactionPrefix.length)
      : "";
    if (!/^[A-F0-9]{8}$/.test(transactionSuffix)) {
      return invalid("01", "Transaction reference does not match the order", payment.orderId.toString());
    }

    const isSuccess =
      parameters.vnp_ResponseCode === "00" &&
      parameters.vnp_TransactionStatus === "00";
    const isCancelled = parameters.vnp_ResponseCode === "24";
    const paymentStatus = isSuccess
      ? "SUCCESS"
      : isCancelled
        ? "CANCELLED"
        : "FAILED";
    const orderStatus = isSuccess
      ? "PAID"
      : isCancelled
        ? "CANCELLED"
        : "PAYMENT_FAILED";
    const callbackResult: CallbackResult = {
      accepted: true,
      code: "00",
      message: "Confirm Success",
      orderId: payment.orderId.toString(),
      outcome: paymentStatus,
    };

    return {
      valid: true,
      result: callbackResult,
      paymentId: payment.id,
      orderId: payment.orderId,
      paymentStatus,
      orderStatus,
      sanitizedResponse: {
        responseCode: parameters.vnp_ResponseCode!,
        transactionStatus: parameters.vnp_TransactionStatus!,
        transactionNo: parameters.vnp_TransactionNo ?? null,
      },
    };
  }

  private getConfiguration() {
    const configuration = this.getConfigurationOrNull();
    if (!configuration) {
      throw new ServiceUnavailableException(
        "VNPay Sandbox chưa được cấu hình. Hãy khai báo merchant credentials ở backend.",
      );
    }
    return configuration;
  }

  private getConfigurationOrNull() {
    const tmnCode = this.config.get<string>("vnpay.tmnCode");
    const hashSecret = this.config.get<string>("vnpay.hashSecret");
    const returnUrl = this.config.get<string>("vnpay.returnUrl");
    const ipnUrl = this.config.get<string>("vnpay.ipnUrl");
    if (!tmnCode || !hashSecret || !returnUrl || !ipnUrl) return null;
    const paymentUrl =
      this.config.get<string>("vnpay.paymentUrl") ?? SANDBOX_PAYMENT_URL;
    try {
      const parsedPaymentUrl = new URL(paymentUrl);
      const parsedReturnUrl = new URL(returnUrl);
      const parsedIpnUrl = new URL(ipnUrl);
      if (
        parsedPaymentUrl.protocol !== "https:" ||
        parsedPaymentUrl.hostname !== "sandbox.vnpayment.vn" ||
        normalizePath(parsedReturnUrl.pathname) !== "/payments/vnpay/return" ||
        parsedIpnUrl.protocol !== "https:" ||
        normalizePath(parsedIpnUrl.pathname) !== "/payments/vnpay/ipn"
      ) {
        return null;
      }
    } catch {
      return null;
    }

    return {
      tmnCode,
      hashSecret,
      returnUrl,
      ipnUrl,
      paymentUrl,
    };
  }

  private readCheckoutUrl(value: unknown): string | null {
    if (
      typeof value === "object" &&
      value !== null &&
      "checkoutUrl" in value &&
      typeof value.checkoutUrl === "string"
    ) {
      return value.checkoutUrl;
    }
    return null;
  }

}

function toVnpayParameters(value: Record<string, unknown>): VnpayParameters {
  const parameters: VnpayParameters = {};
  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(entry) || (entry !== undefined && typeof entry !== "string")) {
      throw new BadRequestException("Duplicate or invalid VNPAY parameter.");
    }
    if (typeof entry === "string") parameters[key] = entry;
  }
  return parameters;
}

function formatVnpayDate(date: Date): string {
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
  const values = new Map(parts.map(({ type, value }) => [type, value]));
  return `${values.get("year")}${values.get("month")}${values.get("day")}${values.get("hour")}${values.get("minute")}${values.get("second")}`;
}

function normalizeIpAddress(value: string): string {
  const address = value.trim().replace(/^::ffff:/i, "");
  return address && address.length <= 45 ? address : "127.0.0.1";
}

function paymentStatusToOutcome(
  status: string | undefined,
): CallbackResult["outcome"] {
  if (status === "SUCCESS") return "SUCCESS";
  if (status === "FAILED") return "FAILED";
  if (status === "CANCELLED") return "CANCELLED";
  return "UNKNOWN";
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}
