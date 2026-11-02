import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { PaymentsService } from "../src/modules/payments/payments.service.js";

const secret = "test-hash-secret";
const tmnCode = "TESTMERCHANT";

function configService(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = {
    "payment.vnpay.paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "payment.vnpay.tmnCode": tmnCode,
    "payment.vnpay.hashSecret": secret,
    "payment.vnpay.returnUrl": "https://example.test/payments/vnpay/return",
    "payment.vnpay.frontendUrl": "https://example.test",
    ...overrides,
  };
  return { get: (key: string) => values[key] };
}

function sign(params: Record<string, string>): string {
  const signData = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
  return createHmac("sha512", secret).update(signData, "utf8").digest("hex");
}

function createIpnQuery(overrides: Record<string, string> = {}) {
  const params = {
    vnp_TmnCode: tmnCode,
    vnp_TxnRef: "21",
    vnp_Amount: "1250000",
    vnp_CurrCode: "VND",
    vnp_OrderInfo: "Thanh toan don hang 7",
    vnp_TransactionNo: "987654",
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
    ...overrides,
  };
  return { ...params, vnp_SecureHash: sign(params) };
}

function paymentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 21n,
    orderId: 7n,
    idempotencyKey: "payment-attempt-0001",
    provider: "VNPAY",
    amount: 12500,
    status: "PENDING",
    transactionCode: null,
    rawResponse: null,
    ...overrides,
  };
}

function orderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 7n,
    userId: 3n,
    status: "PENDING",
    total: 12500,
    pointsEarned: 0,
    promotionId: null,
    discountAmount: 0,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

function createCallbackHarness(
  currentPayment = paymentRecord({
    order: orderRecord(),
  }),
) {
  const tx = {
    $queryRaw: vi.fn(),
    payment: {
      findUnique: vi.fn().mockResolvedValue(currentPayment),
      update: vi.fn().mockResolvedValue({}),
    },
    order: {
      update: vi.fn().mockResolvedValue({}),
    },
    orderStatusHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
    promotion: {
      update: vi.fn().mockResolvedValue({}),
    },
    promotionUsage: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    orderItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    product: {
      update: vi.fn().mockResolvedValue({}),
    },
    topping: {
      update: vi.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    payment: { findUnique: vi.fn().mockResolvedValue(currentPayment) },
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  return {
    service: new PaymentsService(prisma as never, configService() as never),
    prisma,
    tx,
  };
}

describe("PaymentsService VNPay", () => {
  it("creates a signed Sandbox URL using the stored order amount", async () => {
    const now = new Date();
    const attempt = paymentRecord({
      createdAt: now,
      rawResponse: { vnpCreateDate: "20261027120000", clientIp: "127.0.0.1" },
    });
    const tx = {
      $queryRaw: vi.fn(),
      order: {
        findUnique: vi.fn().mockResolvedValue(orderRecord()),
      },
      payment: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(attempt),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      order: {
        findUnique: vi.fn().mockResolvedValue({ expiresAt: orderRecord().expiresAt }),
      },
    };
    const service = new PaymentsService(prisma as never, configService() as never);

    const response = await service.createVnpayPayment(
      7n,
      3n,
      "payment-attempt-0001",
      "127.0.0.1",
    );
    const url = new URL(response.paymentUrl);
    const params = Object.fromEntries(url.searchParams.entries());
    const { vnp_SecureHash, ...unsigned } = params;

    expect(response.orderId).toBe("7");
    expect(params.vnp_Amount).toBe("1250000");
    expect(params.vnp_TmnCode).toBe(tmnCode);
    expect(params.vnp_TxnRef).toBe("21");
    expect(params.vnp_ExpireDate).toMatch(/^\d{14}$/);
    expect(vnp_SecureHash).toBe(sign(unsigned));
    expect(response.paymentUrl).not.toContain(secret);
    expect(tx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 7n,
          amount: 12500,
          provider: "VNPAY",
          status: "PENDING",
        }),
      }),
    );
  });

  it("persists a payment expiry for a legacy order without one", async () => {
    const tx = {
      $queryRaw: vi.fn(),
      order: {
        findUnique: vi.fn().mockResolvedValue(orderRecord({ expiresAt: null })),
        update: vi.fn().mockResolvedValue({}),
      },
      payment: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(
          paymentRecord({
            rawResponse: {
              vnpCreateDate: "20261027120000",
              clientIp: "127.0.0.1",
            },
            createdAt: new Date(),
          }),
        ),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new PaymentsService(prisma as never, configService() as never);

    const response = await service.createVnpayPayment(
      7n,
      3n,
      "payment-attempt-0001",
      "127.0.0.1",
    );

    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7n },
        data: { expiresAt: expect.any(Date) },
      }),
    );
    expect(new URL(response.paymentUrl).searchParams.get("vnp_ExpireDate")).toMatch(
      /^\d{14}$/,
    );
  });

  it("rejects a payment attempt belonging to another user's order", async () => {
    const tx = {
      $queryRaw: vi.fn(),
      order: {
        findUnique: vi.fn().mockResolvedValue(orderRecord({ userId: 99n })),
      },
      payment: { findUnique: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new PaymentsService(prisma as never, configService() as never);

    await expect(
      service.createVnpayPayment(7n, 3n, "payment-attempt-0001", "127.0.0.1"),
    ).rejects.toThrow("You cannot pay for this order.");
    expect(tx.payment.findUnique).not.toHaveBeenCalled();
  });

  it("reuses the persisted payment attempt for a repeated idempotency key", async () => {
    const attempt = paymentRecord({
      rawResponse: { vnpCreateDate: "20261027120000", clientIp: "127.0.0.1" },
      createdAt: new Date(),
    });
    const tx = {
      $queryRaw: vi.fn(),
      order: { findUnique: vi.fn().mockResolvedValue(orderRecord()) },
      payment: {
        findUnique: vi.fn().mockResolvedValue(attempt),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      order: {
        findUnique: vi.fn().mockResolvedValue({ expiresAt: orderRecord().expiresAt }),
      },
    };
    const service = new PaymentsService(prisma as never, configService() as never);

    const response = await service.createVnpayPayment(
      7n,
      3n,
      "payment-attempt-0001",
      "127.0.0.1",
    );

    expect(new URL(response.paymentUrl).searchParams.get("vnp_TxnRef")).toBe(
      "21",
    );
    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.payment.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a wrong signature before looking up or modifying a payment", async () => {
    const { service, prisma } = createCallbackHarness();
    const result = await service.handleIpn({
      ...createIpnQuery(),
      vnp_SecureHash: "0".repeat(128),
    });

    expect(result.RspCode).toBe("97");
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a correctly signed callback for a different merchant", async () => {
    const { service, prisma } = createCallbackHarness();
    const result = await service.handleIpn(
      createIpnQuery({ vnp_TmnCode: "OTHERMERCHANT" }),
    );

    expect(result.RspCode).toBe("97");
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it("can process IPN without Return URL or frontend configuration", async () => {
    const { prisma } = createCallbackHarness();
    const service = new PaymentsService(
      prisma as never,
      configService({
        "payment.vnpay.paymentUrl": undefined,
        "payment.vnpay.returnUrl": undefined,
        "payment.vnpay.frontendUrl": undefined,
      }) as never,
    );

    const result = await service.handleIpn(createIpnQuery());

    expect(result.RspCode).toBe("00");
  });

  it("rejects a callback whose signed order reference does not match the payment", async () => {
    const { service, prisma } = createCallbackHarness();
    const result = await service.handleIpn(
      createIpnQuery({ vnp_OrderInfo: "Thanh toan don hang 8" }),
    );

    expect(result.RspCode).toBe("04");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects malformed provider transaction identifiers", async () => {
    const { service, prisma } = createCallbackHarness();
    const result = await service.handleIpn(
      createIpnQuery({ vnp_TransactionNo: "not-a-transaction-number" }),
    );

    expect(result.RspCode).toBe("99");
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric VNPay transaction reference", async () => {
    const { service, prisma } = createCallbackHarness();
    const result = await service.handleIpn(
      createIpnQuery({ vnp_TxnRef: "payment-attempt-0001" }),
    );

    expect(result.RspCode).toBe("99");
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a callback whose amount differs from the payment attempt", async () => {
    const { service, prisma } = createCallbackHarness();
    const result = await service.handleIpn(createIpnQuery({ vnp_Amount: "1250001" }));

    expect(result.RspCode).toBe("04");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("marks the order paid exactly once for a verified successful callback", async () => {
    const { service, tx } = createCallbackHarness();
    const result = await service.handleIpn(createIpnQuery());

    expect(result.RspCode).toBe("00");
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCESS",
          transactionCode: "987654",
        }),
      }),
    );
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7n },
        data: expect.objectContaining({ status: "PAID", pointsEarned: 100 }),
      }),
    );
    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(tx.orderStatusHistory.create).toHaveBeenCalledTimes(1);
  });

  it("records provider failure and transitions the payable order to PAYMENT_FAILED", async () => {
    const { service, tx } = createCallbackHarness();
    const result = await service.handleIpn(
      createIpnQuery({
        vnp_ResponseCode: "05",
        vnp_TransactionStatus: "02",
      }),
    );

    expect(result.RspCode).toBe("00");
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "PAYMENT_FAILED" },
      }),
    );
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("records a provider cancellation without marking the order paid", async () => {
    const { service, tx } = createCallbackHarness();
    const result = await service.handleIpn(
      createIpnQuery({
        vnp_ResponseCode: "24",
        vnp_TransactionStatus: "02",
      }),
    );

    expect(result.RspCode).toBe("00");
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "PAYMENT_FAILED" },
      }),
    );
  });

  it("retains a verified late success for reconciliation without reopening a cancelled order", async () => {
    const { service, tx } = createCallbackHarness(
      paymentRecord({
        status: "EXPIRED",
        order: orderRecord({ status: "CANCELLED" }),
      }),
    );
    const result = await service.handleIpn(createIpnQuery());

    expect(result.RspCode).toBe("00");
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCESS",
          failureReason: expect.stringContaining("manual reconciliation"),
        }),
      }),
    );
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("does not mark an order paid if its total changed after the payment attempt", async () => {
    const { service, tx } = createCallbackHarness(
      paymentRecord({
        order: orderRecord({ total: 11000 }),
      }),
    );
    const result = await service.handleIpn(createIpnQuery());

    expect(result.RspCode).toBe("00");
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCESS",
          failureReason: expect.stringContaining("different from the current order total"),
        }),
      }),
    );
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate callback for the same provider transaction", async () => {
    const { service, prisma } = createCallbackHarness(
      paymentRecord({
        transactionCode: "987654",
        status: "SUCCESS",
        order: orderRecord(),
      }),
    );
    const result = await service.handleIpn(createIpnQuery());

    expect(result.RspCode).toBe("00");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("acknowledges a repeated failure callback without duplicating order history", async () => {
    const pending = paymentRecord({ order: orderRecord() });
    const { service, prisma, tx } = createCallbackHarness(pending);
    const storedFailure = paymentRecord({
      status: "FAILED",
      transactionCode: "987654",
      rawResponse: {
        vnpResponseCode: "05",
        vnpTransactionStatus: "02",
        vnpTransactionNo: "987654",
        vnpTxnRef: "21",
        vnpAmount: "1250000",
      },
      order: orderRecord(),
    });
    prisma.payment.findUnique.mockResolvedValue(pending);
    tx.payment.findUnique.mockResolvedValue(storedFailure);

    const result = await service.handleIpn(
      createIpnQuery({
        vnp_ResponseCode: "05",
        vnp_TransactionStatus: "02",
      }),
    );

    expect(result.RspCode).toBe("00");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.payment.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.orderStatusHistory.create).not.toHaveBeenCalled();
  });

  it("processes a verified success callback when an earlier failure used the same transaction number", async () => {
    const { service, tx } = createCallbackHarness(
      paymentRecord({
        status: "FAILED",
        transactionCode: "987654",
        order: orderRecord(),
      }),
    );
    const result = await service.handleIpn(createIpnQuery());

    expect(result.RspCode).toBe("00");
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUCCESS" }),
      }),
    );
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID" }),
      }),
    );
  });
});
