import { describe, expect, it } from "vitest";
import {
  createMockPaymentResult,
  isMockPaymentMethod,
  isMockPaymentOutcome,
  runMockPayment,
} from "../../frontend/src/features/payment/mock-payment.js";

describe("Mock Payment UI simulation", () => {
  it.each(["E_WALLET", "BANK_CARD"])("accepts supported method %s", (method) => {
    expect(isMockPaymentMethod(method)).toBe(true);
  });

  it.each([null, "", "CASH", 1])("rejects invalid method %s", (method) => {
    expect(isMockPaymentMethod(method)).toBe(false);
    expect(() => createMockPaymentResult(method, "success")).toThrow(
      "Vui lòng chọn phương thức thanh toán mô phỏng.",
    );
  });

  it.each(["success", "failure"])("accepts simulated outcome %s", (outcome) => {
    expect(isMockPaymentOutcome(outcome)).toBe(true);
  });

  it("returns only simulated outcomes without order or transaction data", () => {
    const simulatedSuccess = createMockPaymentResult("E_WALLET", "success");
    const simulatedFailure = createMockPaymentResult("BANK_CARD", "failure");

    expect(simulatedSuccess.outcome).toBe("SIMULATED_SUCCESS");
    expect(simulatedFailure.outcome).toBe("SIMULATED_FAILURE");
    expect(simulatedSuccess).not.toHaveProperty("orderId");
    expect(simulatedSuccess).not.toHaveProperty("transactionId");
    expect(simulatedSuccess).not.toHaveProperty("status", "PAID");
  });

  it("validates input before starting the asynchronous simulation", async () => {
    await expect(runMockPayment(null, "success")).rejects.toThrow(
      "Vui lòng chọn phương thức thanh toán mô phỏng.",
    );
    await expect(runMockPayment("E_WALLET", "invalid")).rejects.toThrow(
      "Kết quả mô phỏng không hợp lệ.",
    );
  });
});