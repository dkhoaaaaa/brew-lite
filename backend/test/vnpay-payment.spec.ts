import { describe, expect, it, vi } from "vitest";
import { ValidationPipe } from "@nestjs/common";
import "reflect-metadata";
import { CreateVnpayPaymentDto } from "../src/modules/orders/dto/create-vnpay-payment.dto.js";
import { VnpayPaymentsService } from "../src/modules/orders/vnpay-payments.service.js";
import {
  signVnpayParameters,
  verifyVnpaySignature,
  type VnpayParameters,
} from "../src/modules/orders/vnpay-signature.js";
import {
  getDisplayText,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  shouldClearCartAfterPayment,
} from "../../frontend/src/features/payment/payment-display.js";
import type { CreatedOrderResponse } from "../../frontend/src/lib/orders-api.js";

const TEST_SECRET = "unit-test-key-not-a-vnpay-credential";
const TEST_TMN_CODE = "TESTCODE";

function configuration() {
  const values: Record<string, unknown> = {
    "vnpay.tmnCode": TEST_TMN_CODE,
    "vnpay.hashSecret": TEST_SECRET,
    "vnpay.returnUrl": "https://merchant.example.test/payments/vnpay/return",
    "vnpay.ipnUrl": "https://merchant.example.test/payments/vnpay/ipn",
    "vnpay.paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "payments.orderExpiryMinutes": 2,
  };
  return { get: (key: string) => values[key] } as never;
}

function callbackParameters(
  responseCode = "00",
  transactionStatus = "00",
): VnpayParameters {
  const parameters: VnpayParameters = {
    vnp_TmnCode: TEST_TMN_CODE,
    vnp_TxnRef: "BL20261029-ABC123-AB12CD34",
    vnp_Amount: "9000000",
    vnp_ResponseCode: responseCode,
    vnp_TransactionStatus: transactionStatus,
    vnp_TransactionNo: "123456789",
    vnp_OrderInfo: "Thanh toan don hang",
  };
  return {
    ...parameters,
    vnp_SecureHash: signVnpayParameters(parameters, TEST_SECRET),
  };
}

function callbackPrisma() {
  let paymentStatus = "PENDING";
  let orderStatus = "PENDING";
  const transaction = {
    $queryRaw: vi.fn(),
    payment: {
      findUnique: vi.fn(async () => ({ id: 8n, status: paymentStatus })),
      updateMany: vi.fn(async ({ where, data }) => {
        const allowed = where.status.in as string[];
        if (!allowed.includes(paymentStatus)) return { count: 0 };
        paymentStatus = data.status as string;
        return { count: 1 };
      }),
    },
    order: {
      findUnique: vi.fn(async () => ({ id: 3n, status: orderStatus })),
      update: vi.fn(async ({ data }) => {
        orderStatus = data.status as string;
        return { id: 3n, status: orderStatus };
      }),
    },
    orderStatusHistory: { create: vi.fn().mockResolvedValue({ id: 1n }) },
  };
  const prisma = {
    payment: {
      findFirst: vi.fn().mockResolvedValue({
        id: 8n,
        orderId: 3n,
        amount: { toNumber: () => 90000 },
        status: "PENDING",
        order: {
          id: 3n,
          orderCode: "BL20261029-ABC123",
          status: "PENDING",
        },
      }),
    },
    $transaction: vi.fn((work) => work(transaction)),
  };
  return { prisma, transaction, getPaymentStatus: () => paymentStatus, getOrderStatus: () => orderStatus };
}

const exampleOrder = (status: string): CreatedOrderResponse => ({
  id: "1",
  orderCode: "BL20261029-ABC123",
  status,
  subtotal: 90000,
  discountAmount: 0,
  total: 90000,
  expiresAt: null,
  createdAt: "2026-10-29T00:00:00.000Z",
  items: [],
});

it("verifies the return response without changing payment or order state", async () => {
  const { prisma, transaction, getPaymentStatus, getOrderStatus } = callbackPrisma();
  const service = new VnpayPaymentsService(prisma as never, configuration());

  await expect(service.inspectReturnCallback(callbackParameters())).resolves.toMatchObject({
    accepted: true,
    outcome: "SUCCESS",
  });

  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(getPaymentStatus()).toBe("PENDING");
  expect(getOrderStatus()).toBe("PENDING");
  expect(transaction.payment.updateMany).not.toHaveBeenCalled();
});

describe("VNPay payment configuration and callbacks", () => {
  it("signs parameters in sorted order and rejects altered signed values", () => {
    const parameters = callbackParameters();
    expect(verifyVnpaySignature(parameters, TEST_SECRET)).toBe(true);
    expect(
      verifyVnpaySignature(
        { ...parameters, vnp_Amount: "100" },
        TEST_SECRET,
      ),
    ).toBe(false);
  });

  it("creates one URL per idempotency key and uses the order amount in VND x 100", async () => {
    let orderPayments: Array<Record<string, unknown>> = [];
    const order = {
      id: 3n,
      userId: 5n,
      orderCode: "BL20261029-ABC123",
      status: "PENDING",
      total: { toNumber: () => 90000 },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    let savedPayment: Record<string, unknown> | null = null;
    const transaction = {
      $queryRaw: vi.fn(),
      order: {
        findUnique: vi.fn(async () => ({ ...order, payments: orderPayments })),
      },
      payment: {
        findUnique: vi.fn(async () => savedPayment),
        create: vi.fn(async ({ data }) => {
          savedPayment = data;
          orderPayments = [
            {
              provider: data.provider,
              status: data.status,
              rawResponse: data.rawResponse,
            },
          ];
          return data;
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn((work) => work(transaction)),
    };
    const service = new VnpayPaymentsService(prisma as never, configuration());
    const dto = {
      orderId: "3",
      idempotencyKey: "client-retry-key",
      paymentChannel: "VNPAYQR" as const,
    };

    const first = await service.createPayment(3n, 5n, dto, "127.0.0.1");
    const second = await service.createPayment(3n, 5n, dto, "127.0.0.1");
    const duplicateAttempt = await service.createPayment(
      3n,
      5n,
      { orderId: "3", idempotencyKey: "another-browser-attempt" },
      "127.0.0.1",
    );
    const url = new URL(first.checkoutUrl);

    expect(first).toEqual(second);
    expect(duplicateAttempt).toEqual(first);
    expect(url.hostname).toBe("sandbox.vnpayment.vn");
    expect(url.searchParams.get("vnp_Amount")).toBe("9000000");
    expect(url.searchParams.get("vnp_BankCode")).toBe("VNPAYQR");
    expect(
      verifyVnpaySignature(
        Object.fromEntries(url.searchParams.entries()),
        TEST_SECRET,
      ),
    ).toBe(true);
    expect(transaction.payment.create).toHaveBeenCalledTimes(1);
  });

  it("marks an order paid only after a valid signed callback and ignores duplicate success callbacks", async () => {
    const { prisma, transaction, getPaymentStatus, getOrderStatus } = callbackPrisma();
    const service = new VnpayPaymentsService(prisma as never, configuration());
    const callback = callbackParameters();

    await expect(service.processCallback(callback)).resolves.toMatchObject({
      accepted: true,
      outcome: "SUCCESS",
    });
    await expect(service.processCallback(callback)).resolves.toMatchObject({
      accepted: true,
      outcome: "SUCCESS",
    });

    expect(getPaymentStatus()).toBe("SUCCESS");
    expect(getOrderStatus()).toBe("PAID");
    expect(transaction.payment.updateMany).toHaveBeenCalledTimes(1);
    expect(transaction.order.update).toHaveBeenCalledTimes(1);
    expect(transaction.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });

  it("does not create a payment for an expired order", async () => {
    const transaction = {
      $queryRaw: vi.fn(),
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 3n,
          userId: 5n,
          orderCode: "BL20261029-ABC123",
          status: "PENDING",
          total: { toNumber: () => 90000 },
          expiresAt: new Date(Date.now() - 1),
          payments: [],
        }),
      },
      payment: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((work) => work(transaction)),
    };
    const service = new VnpayPaymentsService(prisma as never, configuration());

    await expect(
      service.createPayment(
        3n,
        5n,
        { orderId: "3", idempotencyKey: "late-payment" },
        "127.0.0.1",
      ),
    ).rejects.toThrow("Đơn hàng đã hết hạn thanh toán.");
    expect(transaction.payment.create).not.toHaveBeenCalled();
  });

  it.each([
    ["failed", "05", "01", "FAILED", "PAYMENT_FAILED"],
    ["cancelled", "24", "02", "CANCELLED", "CANCELLED"],
  ])("maps a signed %s callback to a non-paid state and is idempotent", async (_label, code, transactionStatus, expectedPayment, expectedOrder) => {
    const { prisma, transaction, getPaymentStatus, getOrderStatus } = callbackPrisma();
    const service = new VnpayPaymentsService(prisma as never, configuration());
    const callback = callbackParameters(code, transactionStatus);

    await service.processCallback(callback);
    await service.processCallback(callback);

    expect(getPaymentStatus()).toBe(expectedPayment);
    expect(getOrderStatus()).toBe(expectedOrder);
    expect(transaction.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });

  it("does not look up or update an order when a callback signature is invalid", async () => {
    const { prisma } = callbackPrisma();
    const service = new VnpayPaymentsService(prisma as never, configuration());
    const invalid = { ...callbackParameters(), vnp_Amount: "1" };

    await expect(service.processCallback(invalid)).resolves.toMatchObject({
      accepted: false,
      code: "97",
      outcome: "UNKNOWN",
    });
    expect(prisma.payment.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a correctly signed callback with the wrong amount", async () => {
    const { prisma, getPaymentStatus, getOrderStatus } = callbackPrisma();
    const service = new VnpayPaymentsService(prisma as never, configuration());
    const wrongAmount = { ...callbackParameters(), vnp_Amount: "9000001" };
    wrongAmount.vnp_SecureHash = signVnpayParameters(wrongAmount, TEST_SECRET);

    await expect(service.processCallback(wrongAmount)).resolves.toMatchObject({
      accepted: false,
      code: "04",
      outcome: "UNKNOWN",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(getPaymentStatus()).toBe("PENDING");
    expect(getOrderStatus()).toBe("PENDING");
  });

  it("rejects a signed callback whose transaction reference names another order", async () => {
    const { prisma } = callbackPrisma();
    const service = new VnpayPaymentsService(prisma as never, configuration());
    const wrongOrderReference = {
      ...callbackParameters(),
      vnp_TxnRef: "BL20261028-OTHER-AB12CD34",
    };
    wrongOrderReference.vnp_SecureHash = signVnpayParameters(
      wrongOrderReference,
      TEST_SECRET,
    );

    await expect(service.processCallback(wrongOrderReference)).resolves.toMatchObject({
      accepted: false,
      code: "01",
      outcome: "UNKNOWN",
    });
  });

  it("does not whitelist a frontend PAID outcome as a payment command", async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    const transformed = await pipe.transform(
      {
        orderId: "3",
        idempotencyKey: "request-key",
        outcome: "success",
        status: "PAID",
      },
      { type: "body", metatype: CreateVnpayPaymentDto },
    );

    expect(transformed).not.toHaveProperty("outcome");
    expect(transformed).not.toHaveProperty("status");
  });

  it("rejects unsupported VNPay payment channels", async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });

    await expect(
      pipe.transform(
        {
          orderId: "3",
          idempotencyKey: "request-key",
          paymentChannel: "MOMO",
        },
        { type: "body", metatype: CreateVnpayPaymentDto },
      ),
    ).rejects.toThrow();
  });
});

describe("checkout status display", () => {
  it.each([
    ["PENDING", "Chờ thanh toán"],
    ["PAID", "Thành công"],
    ["PAYMENT_FAILED", "Thất bại"],
    ["CANCELLED", "Đã hủy"],
    ["unexpected", "Chưa xác định"],
  ])("maps order status %s to a meaningful label", (status, label) => {
    expect(getOrderStatusLabel(status)).toBe(label);
  });

  it("never renders null or undefined as an order label", () => {
    expect(getDisplayText(null, "Chưa xác định")).toBe("Chưa xác định");
    expect(getDisplayText(undefined, "Chưa xác định")).toBe("Chưa xác định");
    expect(getDisplayText("null", "Chưa xác định")).toBe("Chưa xác định");
    expect(getDisplayText("undefined", "Chưa xác định")).toBe("Chưa xác định");
    expect(getPaymentStatusLabel(exampleOrder("PENDING"))).toBe("Chờ thanh toán");
    expect(getPaymentStatusLabel(exampleOrder("PAID"))).toBe("Thành công");
    expect(getPaymentStatusLabel(exampleOrder("PAYMENT_FAILED"))).toBe("Thất bại");
    expect(getPaymentStatusLabel(exampleOrder("CANCELLED"))).toBe("Đã hủy");
    expect(shouldClearCartAfterPayment("PAYMENT_FAILED")).toBe(false);
    expect(shouldClearCartAfterPayment("CANCELLED")).toBe(false);
    expect(shouldClearCartAfterPayment("PAID")).toBe(true);
  });
});
