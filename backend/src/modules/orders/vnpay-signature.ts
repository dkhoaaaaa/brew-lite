import { createHmac, timingSafeEqual } from "node:crypto";

export type VnpayParameters = Record<string, string>;

export function getVnpaySignData(parameters: VnpayParameters): string {
  return Object.keys(parameters)
    .filter((key) => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
}

export function signVnpayParameters(
  parameters: VnpayParameters,
  secret: string,
): string {
  return createHmac("sha512", secret)
    .update(getVnpaySignData(parameters), "utf8")
    .digest("hex");
}

export function verifyVnpaySignature(
  parameters: VnpayParameters,
  secret: string,
): boolean {
  const providedHash = parameters.vnp_SecureHash;
  if (!providedHash || !/^[a-f\d]{128}$/i.test(providedHash)) return false;

  const expectedHash = signVnpayParameters(parameters, secret);
  return timingSafeEqual(
    Buffer.from(providedHash.toLowerCase(), "hex"),
    Buffer.from(expectedHash, "hex"),
  );
}
