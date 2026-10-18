const MONEY_SCALE = 100;

export function toMinorUnits(value: string): number {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error("Giá sản phẩm không hợp lệ.");

  const sign = match[1] === "-" ? -1 : 1;
  const whole = Number(match[2]);
  const fraction = Number((match[3] ?? "").padEnd(2, "0"));
  return sign * (whole * MONEY_SCALE + fraction);
}

export function fromMinorUnits(value: number): string {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const whole = Math.floor(absolute / MONEY_SCALE);
  const fraction = String(absolute % MONEY_SCALE).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

export function formatPrice(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Giá chưa khả dụng";
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(amount)} ₫`;
}