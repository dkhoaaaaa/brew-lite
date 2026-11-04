# BrewLite

Ứng dụng đặt đồ uống và bánh trực tuyến, hỗ trợ tùy chỉnh kích thước/topping, kiểm soát tồn kho theo nguyên liệu thực tế và thanh toán qua cổng VNPay Sandbox. Hệ thống được tổ chức theo mô hình Monorepo gồm Next.js cho giao diện người dùng và NestJS cho dịch vụ API backend.

**Công nghệ chính:** Next.js 16 (React 19, Tailwind CSS), NestJS, Prisma 7, PostgreSQL 17, Docker Compose, pnpm workspace.

---

## 1. Yêu cầu môi trường

- **Docker Desktop** (khuyến nghị chạy toàn bộ ứng dụng qua Docker Compose).
- **Node.js 20+** và **pnpm** (tùy chọn, chỉ cần nếu chạy lệnh tiện ích ngoài Docker).
- **Git**.

### Cấu hình biến môi trường
Sao chép file `.env.example` thành file `.env` tại **thư mục gốc** dự án:

| Biến môi trường | Ý nghĩa | Mặc định mẫu |
|---|---|---|
| `POSTGRES_USER` | Tên người dùng database | `brewlite` |
| `POSTGRES_PASSWORD` | Mật khẩu database | `123456` |
| `POSTGRES_DB` | Tên cơ sở dữ liệu | `brewlite` |
| `JWT_ACCESS_SECRET` | Khóa bí mật ký Access Token | Chuỗi ngẫu nhiên bảo mật |
| `JWT_REFRESH_SECRET` | Khóa bí mật ký Refresh Token | Chuỗi ngẫu nhiên bảo mật |
| `NEXT_PUBLIC_API_URL`| Địa chỉ API backend cho frontend | `http://localhost:3001` |
| `VNPAY_PAYMENT_URL` | Cổng thanh toán VNPay Sandbox | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_TMN_CODE` | Mã định danh merchant VNPay | Do VNPay Sandbox cấp |
| `VNPAY_HASH_SECRET` | Khóa bí mật băm HMAC-SHA512 | Do VNPay Sandbox cấp |
| `VNPAY_RETURN_URL` | URL nhận kết quả sau thanh toán | `http://localhost:3001/payments/vnpay/return` |
| `FRONTEND_BASE_URL` | Địa chỉ frontend nhận redirect | `http://localhost:3000` |
| `PAYMENT_TTL_MINUTES`| Thời gian chờ thanh toán (phút) | `5` |

---

## 2. Hướng dẫn chạy End-to-End

Mở terminal và thực hiện lần lượt các bước sau tại thư mục gốc:

### Bước 1: Clone mã nguồn
```bash
git clone https://github.com/dkhoaaaaa/brew-lite.git
cd brew-lite
```

### Bước 2: Thiết lập cấu hình môi trường
```bash
# Trên Linux/macOS
cp .env.example .env

# Trên Windows PowerShell
Copy-Item .env.example .env
```

### Bước 3: Khởi chạy các dịch vụ với Docker Compose
```bash
docker compose up -d --build
```

### Bước 4: Chạy Prisma Migration
```bash
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
```

### Bước 5: Sinh Prisma Client và nạp dữ liệu mẫu (Seed)
```bash
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts generate
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
```

### Bước 6: Truy cập ứng dụng
- **Giao diện người dùng (Frontend):** [http://localhost:3000](http://localhost:3000)
- **Dịch vụ API (Backend):** [http://localhost:3001](http://localhost:3001)

### Bước 7: Kiểm tra nhanh luồng đặt hàng
1. Mở [http://localhost:3000/login](http://localhost:3000/login) và đăng nhập tài khoản demo.
2. Vào trang **Thực đơn**, bấm chọn sản phẩm, kích cỡ và topping mong muốn.
3. Vào **Giỏ hàng**, kiểm tra số lượng và bấm **Đặt hàng**.
4. Tại trang **Thanh toán**, chọn thanh toán qua **VNPay Sandbox** để mở cổng thanh toán.
5. Sau khi thanh toán, hệ thống tự động quay lại trang **Xác nhận đơn** với trạng thái đã thanh toán thành công.

---

## 3. Hướng dẫn nạp dữ liệu mẫu (Seed)

Dữ liệu mẫu được định nghĩa tại `backend/prisma/seed.ts`.

### Lệnh chạy Seed
```bash
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
```

- **Dữ liệu được tạo:** 5 danh mục sản phẩm, 50 đồ uống và bánh, 3 kích cỡ (S, M, L), 6 loại topping, 15 loại nguyên liệu kho, định lượng công thức pha chế, 10 mã giảm giá (voucher) và 2 tài khoản mẫu.
- **Tính Idempotent:** Script sử dụng `upsert` và kiểm tra khóa trùng lặp, do đó có thể chạy lại nhiều lần an toàn mà không làm nhân bản dữ liệu.
- **Cảnh báo khi Reset Database:** Nếu cần xóa trắng dữ liệu để khởi tạo lại từ đầu, chạy lệnh dưới đây (thao tác này sẽ xóa toàn bộ dữ liệu hiện có):
  ```bash
  docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate reset
  ```

---

## 4. Tài khoản mẫu (Demo Accounts)

Hệ thống cung cấp sẵn các tài khoản sau sau khi chạy Seed:

| Tài khoản | Email | Mật khẩu mẫu | Ghi chú |
|---|---|---|---|
| Khách hàng mẫu | `example@gmail.com` | `Example@123` | Tài khoản khách hàng mặc định |
| Khách hàng thân thiết | `customer1@gmail.com` | `Customer@123` | Có sẵn 200 điểm thưởng để kiểm tra đổi voucher |

*Lưu ý: Mật khẩu được mã hóa an toàn bằng Bcrypt trước khi lưu vào cơ sở dữ liệu.*

---

## 5. Thiết lập VNPay Sandbox

1. **Đăng ký Sandbox:** Đăng ký tài khoản thử nghiệm tại cổng đối tác [VNPay Sandbox](https://sandbox.vnpayment.vn/devreg/).
2. **Cấu hình credentials:** Cập nhật `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` được cấp vào file `.env`.
3. **URL cấu hình:**
   - `VNPAY_PAYMENT_URL`: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
   - `VNPAY_RETURN_URL`: `http://localhost:3001/payments/vnpay/return` (trả kết quả về cho client)
   - `VNPAY_IPN_URL`: `https://<public-domain>/payments/vnpay/ipn` (webhook thông báo server-to-server; yêu cầu domain công khai có HTTPS khi test webhook ngoài Internet).
4. **Thông tin thẻ thử nghiệm NCB:**
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **Mã OTP:** `123456`

---

## 6. Cấu trúc thư mục Source Code (Tổng quan)

```text
brew-lite/
├── frontend/src/
│   ├── app/                    # Định tuyến App Router: menu, cart, checkout, orders, profile, auth
│   ├── components/             # UI component dùng chung: Navbar, Toast...
│   ├── features/               # Module tính năng: cart (state, storage), products (card, detail, selector)
│   ├── lib/                    # API client gọi backend: orders, products, loyalty, auth và tiện ích tiền tệ
│   ├── styles/                 # Cấu hình CSS toàn cục, font chữ tiếng Việt, Tailwind v4
│   └── types/                  # Định nghĩa TypeScript interface: Product, Size, Topping, Order
├── backend/src/
│   ├── main.ts                 # Điểm khởi chạy NestJS, cấu hình CORS, ValidationPipe
│   ├── app.module.ts           # Root module kết nối toàn bộ các module nghiệp vụ
│   ├── config/                 # Nạp cấu hình biến môi trường tập trung (JWT, VNPay, TTL)
│   ├── prisma/                 # PrismaService kết nối PostgreSQL
│   └── modules/                # Các module nghiệp vụ chính:
│       ├── auth/               # Đăng ký, đăng nhập JWT, Bcrypt hash, JwtAuthGuard
│       ├── products/           # Quản lý danh mục, menu, tính tồn kho theo nguyên liệu thực tế
│       ├── orders/             # Xử lý đơn hàng, State Machine, trừ tồn kho bằng Optimistic Locking
│       ├── loyalty/            # Quản lý tích điểm thưởng (+100 điểm/đơn) và đổi voucher
│       └── payments/           # Tích hợp VNPay Sandbox, ký băm HMAC-SHA512, xác thực IPN
├── backend/prisma/
│   ├── schema.prisma           # Định nghĩa cấu trúc 15 bảng cơ sở dữ liệu quan hệ
│   ├── migrations/             # Lịch sử các bản migration database
│   └── seed.ts                 # Script nạp danh mục, sản phẩm, nguyên liệu, voucher và tài khoản demo
├── docker-compose.yml          # Cấu hình container hóa các dịch vụ postgres, backend, frontend
├── pnpm-workspace.yaml         # Cấu hình pnpm monorepo workspace
└── README.md                   # Hướng dẫn cài đặt và vận hành hệ thống
```

---

## 7. Các lệnh bảo trì thường dùng

```bash
# Xem nhật ký hoạt động (logs)
docker compose logs -f backend
docker compose logs -f frontend

# Dừng toàn bộ hệ thống (giữ lại dữ liệu)
docker compose down

# Chạy bộ kiểm thử tự động của Backend
docker compose exec -w /app/backend backend pnpm test
```
