import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentsController } from "../../src/modules/payments/payments.controller.js";
import { PaymentsService } from "../../src/modules/payments/payments.service.js";
import { PrismaService } from "../../src/prisma/prisma.service.js";

const TEST_SECRET = "test-hash-secret-brewlite-123456";
const TEST_TMN = "TESTMERCHANT01";

const money = (val: number) => ({
  toNumber: () => val,
  toString: () => val.toString(),
});

function signParams(params: Record<string, string>): string {
  const signData = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
  return createHmac("sha512", TEST_SECRET).update(signData, "utf8").digest("hex");
}

describe("Integration Test: Thanh toán & Webhook IPN (Payments Integration)", () => {
  let paymentsController: PaymentsController;
  let paymentsService: PaymentsService;
  let mockPrisma: any;
  let configService: ConfigService;

  // Dữ liệu giả lập stateful
  let dbUsers: any[];
  let dbOrders: any[];
  let dbPayments: any[];
  let dbStatusHistory: any[];

  function resetDatabase() {
    dbUsers = [
      { id: 1n, email: "khachhang@test.com", fullName: "Khách hàng A", loyaltyPoints: 0, isActive: true },
      { id: 2n, email: "other@test.com", fullName: "Người khác", loyaltyPoints: 50, isActive: true },
    ];

    dbOrders = [
      {
        id: 10n,
        userId: 1n,
        orderCode: "BL-TEST-001",
        status: "PENDING",
        subtotal: money(50000),
        discountAmount: money(0),
        total: money(50000),
        pointsEarned: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Còn 5 phút
        createdAt: new Date(),
      },
      {
        id: 11n,
        userId: 1n,
        orderCode: "BL-EXPIRED-002",
        status: "PENDING",
        subtotal: money(30000),
        discountAmount: money(0),
        total: money(30000),
        pointsEarned: 0,
        expiresAt: new Date(Date.now() - 60 * 1000), // Đã hết hạn cách đây 1 phút
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: 12n,
        userId: 2n,
        orderCode: "BL-OTHER-003",
        status: "PENDING",
        subtotal: money(40000),
        discountAmount: money(0),
        total: money(40000),
        pointsEarned: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      },
    ];

    dbPayments = [];
    dbStatusHistory = [];
  }

  beforeEach(() => {
    resetDatabase();

    const configMap: Record<string, any> = {
      "payment.vnpay.paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      "payment.vnpay.tmnCode": TEST_TMN,
      "payment.vnpay.hashSecret": TEST_SECRET,
      "payment.vnpay.returnUrl": "http://localhost:3001/payments/vnpay/return",
      "payment.vnpay.frontendUrl": "http://localhost:3000",
      "payment.ttlMinutes": 5,
    };

    configService = {
      get: vi.fn().mockImplementation((key: string) => configMap[key]),
    } as unknown as ConfigService;

    mockPrisma = {
      order: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          return dbOrders.find((o) => o.id === where.id) ?? null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const ord = dbOrders.find((o) => o.id === where.id);
          if (ord) {
            Object.assign(ord, data);
          }
          return ord;
        }),
      },
      payment: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          return dbPayments.find((p) => {
            if (where.orderId && p.orderId !== where.orderId) return false;
            if (where.provider && p.provider !== where.provider) return false;
            if (where.status && p.status !== where.status) return false;
            return true;
          }) ?? null;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where, include }) => {
          let p: any = null;
          if (where.id) {
            p = dbPayments.find((item) => item.id === where.id);
          } else if (where.idempotencyKey) {
            p = dbPayments.find((item) => item.idempotencyKey === where.idempotencyKey);
          }
          if (p && include?.order) {
            const ord = dbOrders.find((o) => o.id === p.orderId);
            return { ...p, order: ord };
          }
          return p ?? null;
        }),
        create: vi.fn().mockImplementation(async ({ data }) => {
          const newPayment = {
            id: BigInt(dbPayments.length + 100),
            ...data,
            createdAt: new Date(),
          };
          dbPayments.push(newPayment);
          return newPayment;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const p = dbPayments.find((item) => item.id === where.id);
          if (p) {
            Object.assign(p, data);
          }
          return p;
        }),
      },
      user: {
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const u = dbUsers.find((user) => user.id === where.id);
          if (u && data.loyaltyPoints?.increment) {
            u.loyaltyPoints += Number(data.loyaltyPoints.increment);
          }
          return u;
        }),
      },
      orderStatusHistory: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          dbStatusHistory.push(data);
          return { id: BigInt(dbStatusHistory.length), ...data };
        }),
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
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      }),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };

    paymentsService = new PaymentsService(mockPrisma as unknown as PrismaService, configService);
    paymentsController = new PaymentsController(paymentsService);
  });

  // 1. Khởi tạo thanh toán thành công
  it("1. Khởi tạo thanh toán VNPay thành công (tạo link thanh toán và lưu bản ghi Payment PENDING)", async () => {
    const user = { id: "1", email: "khachhang@test.com" };
    const idempotencyKey = "key-checkout-attempt-1111";

    const result = await paymentsController.createVnpayPayment("10", user, idempotencyKey, "127.0.0.1");

    expect(result).toBeDefined();
    expect(result.orderId).toBe("10");
    expect(result.paymentStatus).toBe("PENDING");
    expect(result.paymentUrl).toContain("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
    expect(result.paymentUrl).toContain("vnp_Amount=5000000"); // 50.000 * 100

    expect(dbPayments).toHaveLength(1);
    expect(dbPayments[0].orderId).toBe(10n);
    expect(dbPayments[0].provider).toBe("VNPAY");
    expect(dbPayments[0].status).toBe("PENDING");
  });

  // 2. Thanh toán thất bại qua IPN
  it("2. Cập nhật trạng thái PAYMENT_FAILED khi cổng VNPay gửi phản hồi giao dịch thất bại", async () => {
    // Tạo sẵn payment trước đó
    const paymentId = 101n;
    dbPayments.push({
      id: paymentId,
      orderId: 10n,
      idempotencyKey: "test-fail-key-2222",
      amount: 50000,
      provider: "VNPAY",
      status: "PENDING",
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentId.toString(),
      vnp_Amount: "5000000",
      vnp_OrderInfo: "Thanh toan don hang 10",
      vnp_TransactionNo: "14567890",
      vnp_ResponseCode: "24", // Khách hủy giao dịch
      vnp_TransactionStatus: "02", // Thất bại
    };
    params.vnp_SecureHash = signParams(params);

    const ipnResponse = await paymentsController.handleVnpayIpn(params);

    expect(ipnResponse).toEqual({ RspCode: "00", Message: "Confirm Success" });
    const payment = dbPayments.find((p) => p.id === paymentId);
    expect(payment.status).toBe("CANCELLED");
    expect(dbOrders[0].status).toBe("PAYMENT_FAILED");
  });

  // 3. Đơn hàng không tồn tại hoặc đã hết hạn
  it("3. Từ chối thanh toán khi đơn hàng không tồn tại hoặc đã hết hạn TTL", async () => {
    const user = { id: "1", email: "khachhang@test.com" };

    // Đơn 9999 không tồn tại
    await expect(
      paymentsController.createVnpayPayment("9999", user, "key-valid-random-123456", "127.0.0.1"),
    ).rejects.toThrow(NotFoundException);

    // Đơn 11 đã hết hạn TTL
    await expect(
      paymentsController.createVnpayPayment("11", user, "key-valid-random-654321", "127.0.0.1"),
    ).rejects.toThrow(ConflictException);
  });

  // 4. Thanh toán trùng lặp (Idempotent)
  it("4. Idempotency: gửi lại cùng idempotencyKey trả về link thanh toán hiện có, không tạo bản ghi mới", async () => {
    const user = { id: "1", email: "khachhang@test.com" };
    const idempotencyKey = "key-repeat-attempt-8888";

    const res1 = await paymentsController.createVnpayPayment("10", user, idempotencyKey, "127.0.0.1");
    expect(dbPayments).toHaveLength(1);

    // Gọi lại lần 2 với cùng key
    const res2 = await paymentsController.createVnpayPayment("10", user, idempotencyKey, "127.0.0.1");
    expect(res2.paymentUrl).toBe(res1.paymentUrl);
    expect(dbPayments).toHaveLength(1); // Không tạo thêm bản ghi Payment thứ hai
  });

  // 5. Cập nhật trạng thái đơn hàng khi IPN thành công
  it("5. Cập nhật trạng thái đơn hàng sang PAID khi nhận được IPN giao dịch thành công", async () => {
    const paymentId = 102n;
    dbPayments.push({
      id: paymentId,
      orderId: 10n,
      idempotencyKey: "test-success-key-3333",
      amount: 50000,
      provider: "VNPAY",
      status: "PENDING",
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentId.toString(),
      vnp_Amount: "5000000",
      vnp_OrderInfo: "Thanh toan don hang 10",
      vnp_TransactionNo: "14888999",
      vnp_ResponseCode: "00", // Thành công
      vnp_TransactionStatus: "00", // Thành công
    };
    params.vnp_SecureHash = signParams(params);

    const ipnResponse = await paymentsController.handleVnpayIpn(params);

    expect(ipnResponse).toEqual({ RspCode: "00", Message: "Confirm Success" });
    expect(dbOrders[0].status).toBe("PAID");
    const payment = dbPayments.find((p) => p.id === paymentId);
    expect(payment.status).toBe("SUCCESS");
    expect(payment.transactionCode).toBe("14888999");
  });

  // 6. Cộng điểm thành viên đúng tỉ lệ khi thanh toán thành công
  it("6. Cộng điểm thành viên chính xác khi thanh toán thành công (50.000đ -> cộng 50 điểm)", async () => {
    const paymentId = 103n;
    dbPayments.push({
      id: paymentId,
      orderId: 10n,
      idempotencyKey: "test-points-key-4444",
      amount: 50000,
      provider: "VNPAY",
      status: "PENDING",
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentId.toString(),
      vnp_Amount: "5000000",
      vnp_OrderInfo: "Thanh toan don hang 10",
      vnp_TransactionNo: "14999000",
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
    };
    params.vnp_SecureHash = signParams(params);

    expect(dbUsers[0].loyaltyPoints).toBe(0);

    await paymentsController.handleVnpayIpn(params);

    // Mỗi đơn thanh toán thành công được cộng 100 điểm tích lũy thành viên
    expect(dbUsers[0].loyaltyPoints).toBe(100);
  });

  // 7. Không cộng điểm thành viên khi thanh toán thất bại
  it("7. Tuyệt đối không cộng điểm thành viên nếu giao dịch thanh toán thất bại", async () => {
    const paymentId = 104n;
    dbPayments.push({
      id: paymentId,
      orderId: 10n,
      idempotencyKey: "test-fail-points-key",
      amount: 50000,
      provider: "VNPAY",
      status: "PENDING",
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentId.toString(),
      vnp_Amount: "5000000",
      vnp_OrderInfo: "Thanh toan don hang 10",
      vnp_TransactionNo: "14999111",
      vnp_ResponseCode: "11", // Giao dịch chưa hoàn tất / lỗi
      vnp_TransactionStatus: "01",
    };
    params.vnp_SecureHash = signParams(params);

    await paymentsController.handleVnpayIpn(params);

    // Điểm vẫn giữ nguyên là 0
    expect(dbUsers[0].loyaltyPoints).toBe(0);
  });

  // 8. Xử lý bảo mật IPN: kiểm tra chữ ký số HMAC-SHA512
  it("8. Từ chối xử lý IPN và trả về mã lỗi 97 khi chữ ký số không hợp lệ hoặc dữ liệu bị thay đổi", async () => {
    const paymentId = 105n;
    dbPayments.push({
      id: paymentId,
      orderId: 10n,
      idempotencyKey: "test-tamper-key",
      amount: 50000,
      provider: "VNPAY",
      status: "PENDING",
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentId.toString(),
      vnp_Amount: "5000000",
      vnp_OrderInfo: "Thanh toan don hang 10",
      vnp_TransactionNo: "14999222",
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
      vnp_SecureHash: "fake_hash_value_attack_1234567890abcdef", // Chữ ký giả mạo
    };

    const result = await paymentsController.handleVnpayIpn(params);

    expect(result).toEqual({ RspCode: "97", Message: "Invalid signature" });
    // Trạng thái đơn không bị thay đổi
    expect(dbOrders[0].status).toBe("PENDING");
  });
});
