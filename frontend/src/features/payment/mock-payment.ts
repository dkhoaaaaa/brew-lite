export type MockPaymentMethod = "E_WALLET" | "BANK_CARD";
export type MockPaymentOutcome = "success" | "failure";

export type MockPaymentResult = {
  outcome: "SIMULATED_SUCCESS" | "SIMULATED_FAILURE";
  message: string;
};

export async function runMockPayment(
  method: MockPaymentMethod,
  outcome: MockPaymentOutcome,
): Promise<MockPaymentResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 450));

  return {
    outcome: outcome === "success" ? "SIMULATED_SUCCESS" : "SIMULATED_FAILURE",
    message:
      outcome === "success"
        ? `Mô phỏng thanh toán ${methodLabel(method)} thành công.`
        : `Mô phỏng thanh toán ${methodLabel(method)} thất bại.`,
  };
}

function methodLabel(method: MockPaymentMethod): string {
  return method === "E_WALLET" ? "ví điện tử" : "thẻ ngân hàng";
}