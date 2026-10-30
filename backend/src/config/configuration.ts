const orderPaymentExpiryMinutes =
  process.env.ORDER_PAYMENT_EXPIRY_MINUTES === undefined
    ? 2
    : Number(process.env.ORDER_PAYMENT_EXPIRY_MINUTES);

if (
  !Number.isSafeInteger(orderPaymentExpiryMinutes) ||
  orderPaymentExpiryMinutes < 1 ||
  orderPaymentExpiryMinutes > 1440
) {
  throw new Error("ORDER_PAYMENT_EXPIRY_MINUTES must be an integer between 1 and 1440.");
}

export default () => ({
  port: Number(process.env.PORT ?? 3001),

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },

  frontendUrl: process.env.FRONTEND_URL,

  payments: {
    orderExpiryMinutes: orderPaymentExpiryMinutes,
  },

  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    paymentUrl:
      process.env.VNPAY_PAYMENT_URL ??
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNPAY_RETURN_URL,
    ipnUrl: process.env.VNPAY_IPN_URL,
  },
});