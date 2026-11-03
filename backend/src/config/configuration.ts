export default () => ({
  port: Number(process.env.PORT ?? 3001),

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },

  payment: {
    ttlMinutes: Number(process.env.PAYMENT_TTL_MINUTES ?? 5),
    vnpay: {
      paymentUrl:
        process.env.VNPAY_PAYMENT_URL ??
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      tmnCode: process.env.VNPAY_TMN_CODE,
      hashSecret: process.env.VNPAY_HASH_SECRET,
      returnUrl: process.env.VNPAY_RETURN_URL,
      frontendUrl: process.env.FRONTEND_BASE_URL ?? "http://localhost:3000",
    },
  },
});