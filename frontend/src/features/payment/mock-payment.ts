export type MockPaymentMethod = "E_WALLET" | "BANK_CARD";
export type MockPaymentOutcome = "success" | "failure";

export type MockPaymentResult = {
  outcome: "SIMULATED_SUCCESS" | "SIMULATED_FAILURE";
  message: string;
};

export function isMockPaymentMethod(value: unknown): value is MockPaymentMethod {
  return value === "E_WALLET" || value === "BANK_CARD";
}

export function isMockPaymentOutcome(value: unknown): value is MockPaymentOutcome {
  return value === "success" || value === "failure";
}

export function createMockPaymentResult(
  method: unknown,
  outcome: unknown,
): MockPaymentResult {
  if (!isMockPaymentMethod(method)) {
    throw new Error("Vui lòng chọn phương thức thanh toán mô phỏng.");
  }
  if (!isMockPaymentOutcome(outcome)) {
    throw new Error("Kết quả mô phỏng không hợp lệ.");
  }

  return {
    outcome: outcome === "success" ? "SIMULATED_SUCCESS" : "SIMULATED_FAILURE",
    message:
      outcome === "success"
        ? `Mô phỏng thanh toán ${methodLabel(method)} thành công.`
        : `Mô phỏng thanh toán ${methodLabel(method)} thất bại.`,
  };
}

export async function runMockPayment(
  method: unknown,
  outcome: unknown,
): Promise<MockPaymentResult> {
  const result = createMockPaymentResult(method, outcome);
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 450));
  return result;
}

function methodLabel(method: MockPaymentMethod): string {
  return method === "E_WALLET" ? "ví điện tử" : "thẻ ngân hàng";
}