# BrewLite

Ứng dụng đặt đồ uống và bánh trực tuyến, hỗ trợ tùy chỉnh kích thước/topping, kiểm soát tồn kho theo nguyên liệu thực tế (Optimistic Locking) và thanh toán qua cổng VNPay Sandbox.

Dự án sử dụng **duy nhất một kiến trúc mã nguồn chung (Single Monorepo Source Code)** hợp nhất toàn bộ tính năng của **Assignment 1** và **Assignment 2**, hỗ trợ đồng thời hai môi trường:
- **Local Development:** Vận hành 100% bằng **Docker Compose** (không cần cài Node.js, npm hay pnpm trên máy local).
- **Production Deployment:** Triển khai độc lập Frontend trên **Vercel** và Backend trên **Render**, sử dụng cơ sở dữ liệu điện toán đám mây **Neon PostgreSQL**.

**Công nghệ chính:** Next.js 16 (React 19, Tailwind CSS v4, Turbopack), NestJS, Prisma 7, PostgreSQL 17 (Neon Serverless Cloud / Local Docker), Docker Compose.

---

## 1. Kiến trúc hệ thống (Một Source Code duy nhất)

```text
brew-lite/
├── frontend/                   # Ứng dụng Next.js (chạy trong Docker Local hoặc deploy Vercel)
│   ├── src/
│   │   ├── app/                # App Router: menu, cart, checkout, orders, profile, auth
│   │   ├── components/         # UI component dùng chung: Navbar, Toast, State...
│   │   ├── features/           # Module tính năng: cart (state, storage), products
│   │   ├── lib/                # API Client (tự động điều hướng theo NEXT_PUBLIC_API_URL)
│   │   └── types/              # TypeScript interface: Product, Size, Topping, Order
│   ├── Dockerfile              # Dockerfile chạy Next.js dev server cho môi trường Local
│   └── package.json            # Dependencies và scripts frontend
├── backend/                    # Dịch vụ NestJS API (chạy trong Docker Local hoặc deploy Render)
│   ├── src/
│   │   ├── main.ts             # Điểm khởi chạy NestJS, cấu hình CORS động, ValidationPipe
│   │   ├── app.module.ts       # Root module kết nối toàn bộ module nghiệp vụ
│   │   ├── config/             # Nạp biến môi trường tập trung (JWT, VNPay, TTL)
│   │   ├── prisma/             # PrismaService kết nối PostgreSQL (Neon / Local)
│   │   └── modules/            # Nghiệp vụ: auth, products, orders, loyalty, payments
│   ├── prisma/                 # Schema 15 bảng CSDL quan hệ, migrations và seed script
│   ├── Dockerfile              # Production Dockerfile tối ưu cho Render
│   └── package.json            # Dependencies và scripts backend
├── docker-compose.yml          # Docker Compose chuẩn cho Local Development
├── docker-compose.local.yml    # Docker Compose tùy chọn kích hoạt PostgreSQL container nội bộ
├── pnpm-workspace.yaml         # Cấu hình monorepo workspace
├── package.json                # Root package metadata (chuẩn hóa pnpm@12.8.1)
└── README.md                   # Tài liệu hướng dẫn vận hành hệ thống
```

---

## 2. Phân biệt môi trường Local và Production

| Thành phần | Môi trường Local (Development) | Môi trường Production |
|---|---|---|
| **Phương thức chạy** | Docker Compose (`docker compose up -d --build`) | Vercel (Frontend) + Render (Backend) |
| **Cơ sở dữ liệu** | Neon PostgreSQL Cloud HOẶC PostgreSQL Docker Local | Neon Serverless PostgreSQL Cloud |
| **Frontend URL** | `http://localhost:3000` | `https://your-app.vercel.app` |
| **Backend URL** | `http://localhost:3001` | `https://your-backend.onrender.com` |
| **CORS Backend** | Cho phép `localhost:3000`, `127.0.0.1:3000` | Cho phép `FRONTEND_BASE_URL` (Domain Vercel) |
| **Hot Reload** | Hỗ trợ cho cả Backend (Nest watch) & Frontend (Turbopack) | Không áp dụng (Production build tĩnh/tối ưu) |
| **Yêu cầu máy host** | **Chỉ cần Docker Desktop và Git** (Không cần Node.js/pnpm) | N/A (Build tự động trên Cloud) |

---

## 3. Cấu hình biến môi trường (Environment Configuration)

Sao chép file `.env.example` thành file `.env` tại **thư mục gốc** dự án:

```bash
# Trên Linux/macOS
cp .env.example .env

# Trên Windows PowerShell
Copy-Item .env.example .env
```

### Danh mục biến môi trường

```env
# ==================================================
# 1. LOCAL POSTGRESQL - DOCKER (Tùy chọn Local DB)
# ==================================================
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=your_local_postgres_password
POSTGRES_DB=brewlite
LOCAL_DATABASE_URL="postgresql://brewlite:your_local_postgres_password@postgres:5432/brewlite?schema=public"
LOCAL_DIRECT_URL="postgresql://brewlite:your_local_postgres_password@postgres:5432/brewlite?schema=public"

# ==================================================
# 2. NEON POSTGRESQL - CLOUD (Mặc định & Production)
# ==================================================
# Pooled connection - Dành cho ứng dụng backend (NestJS PrismaService)
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-NEON-POOLER-HOST/neondb?sslmode=require"

# Direct connection - Dành cho Prisma CLI migrations (bắt buộc với Neon)
DIRECT_URL="postgresql://USER:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require"

# ==================================================
# 3. JWT AUTHENTICATION
# ==================================================
JWT_ACCESS_SECRET=your_development_access_secret
JWT_REFRESH_SECRET=your_development_refresh_secret

# ==================================================
# 4. FRONTEND & CORS CONFIGURATION
# ==================================================
# Local: http://localhost:3001 | Production: https://your-backend.onrender.com
NEXT_PUBLIC_API_URL=http://localhost:3001

# Local: http://localhost:3000 | Production: https://your-frontend.vercel.app
FRONTEND_BASE_URL=http://localhost:3000

# ==================================================
# 5. VNPAY SANDBOX CONFIGURATION
# ==================================================
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=your_vnpay_sandbox_tmn_code
VNPAY_HASH_SECRET=your_vnpay_sandbox_hash_secret
VNPAY_RETURN_URL=http://localhost:3001/payments/vnpay/return
PAYMENT_TTL_MINUTES=5
```

---

## 4. Hướng dẫn chạy Local bằng Docker Compose

### Bước 1: Khởi chạy hệ thống

**Lệnh chính thức (kết nối Neon Database mặc định):**
```bash
docker compose up -d --build
```

*(Nếu muốn chạy với PostgreSQL nội bộ bằng Docker container thay vì Neon Cloud)*:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

### Bước 2: Chạy Prisma Migration & Seed dữ liệu mẫu

Thực hiện trực tiếp thông qua Docker container (không cần Node.js trên máy host):

```bash
# Áp dụng migration cơ sở dữ liệu
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy

# Nạp dữ liệu mẫu (151 sản phẩm, công thức nguyên liệu, topping, voucher, tài khoản demo)
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
```

### Bước 3: Truy cập ứng dụng
- **Giao diện người dùng (Frontend):** [http://localhost:3000](http://localhost:3000)
- **API Dịch vụ (Backend):** [http://localhost:3001](http://localhost:3001)
- **Kiểm tra trạng thái Backend:** [http://localhost:3001/health](http://localhost:3001/health)

---

## 5. Các lệnh quản lý Docker thường dùng

| Thao tác | Lệnh thực thi |
|---|---|
| **Khởi chạy chính thức (Build & Run ngầm)** | `docker compose up -d --build` |
| **Khởi chạy thông thường** | `docker compose up -d` |
| **Xem nhật ký hoạt động (Logs)** | `docker compose logs -f` |
| **Xem logs riêng biệt** | `docker compose logs -f backend` hoặc `docker compose logs -f frontend` |
| **Khởi động lại toàn bộ** | `docker compose restart` |
| **Dừng hệ thống** | `docker compose down` |
| **Chạy Unit Test Backend** | `docker compose exec -w /app/backend backend pnpm test` |
| **Kiểm tra Linter Backend** | `docker compose exec -w /app/backend backend pnpm run lint` |
| **Kiểm tra Linter Frontend** | `docker compose exec -w /app/frontend frontend pnpm run lint` |

---

## 6. Hướng dẫn Deployment Production

### 6.1. Thiết lập Database trên Neon Cloud
1. Đăng ký tài khoản tại [Neon.tech](https://neon.tech) và tạo project PostgreSQL mới.
2. Tại mục **Connection Details**, sao chép:
   - **Pooled connection string:** Điền vào biến `DATABASE_URL` (dùng port 6543 hoặc pooler host).
   - **Direct connection string:** Điền vào biến `DIRECT_URL` (dùng port 5432 direct host).

### 6.2. Triển khai Backend lên Render
1. Đăng nhập [Render.com](https://render.com), chọn **New +** -> **Web Service**.
2. Kết nối tới repository GitHub `brew-lite`.
3. Cấu hình triển khai:
   - **Language:** `Docker`.
   - **Dockerfile Path:** `backend/Dockerfile`.
   - **Docker Context:** `.` (thư mục gốc).
4. Thiết lập các **Environment Variables** trên Render:
   - `DATABASE_URL`: Chuỗi kết nối Neon Pooled.
   - `DIRECT_URL`: Chuỗi kết nối Neon Direct.
   - `JWT_ACCESS_SECRET`: Chuỗi bí mật ngẫu nhiên.
   - `JWT_REFRESH_SECRET`: Chuỗi bí mật ngẫu nhiên.
   - `FRONTEND_BASE_URL`: URL production của Frontend trên Vercel (ví dụ `https://brew-lite.vercel.app`).
   - `VNPAY_*`: Các biến cấu hình VNPay Sandbox.
5. Render sẽ tự động build image và chạy lệnh `pnpm --dir backend start:prod`.

### 6.3. Triển khai Frontend lên Vercel
1. Đăng nhập [Vercel.com](https://vercel.com), chọn **Add New...** -> **Project**.
2. Import repository `brew-lite`.
3. Tại phần cấu hình dự án:
   - **Framework Preset:** `Next.js`.
   - **Root Directory:** Bấm Edit và chọn thư mục `frontend`.
4. Thiết lập **Environment Variables** trên Vercel:
   - `NEXT_PUBLIC_API_URL`: Điền địa chỉ Render backend (ví dụ: `https://your-backend.onrender.com`, không có dấu `/` ở cuối).
5. Bấm **Deploy**. Vercel sẽ tự động build và cung cấp domain HTTPS miễn phí.

---

## 7. Tài khoản mẫu (Demo Accounts)

Sau khi chạy lệnh Seed, hệ thống cung cấp sẵn các tài khoản sau:

| Tài khoản | Email | Mật khẩu mẫu | Ghi chú |
|---|---|---|---|
| Khách hàng mẫu | `example@gmail.com` | `Example@123` | Tài khoản khách hàng mặc định |
| Khách hàng thân thiết | `customer1@gmail.com` | `Customer@123` | Có sẵn 200 điểm thưởng để kiểm tra đổi voucher |

---

## 8. Thiết lập VNPay Sandbox

1. **Đăng ký Sandbox:** Đăng ký tài khoản thử nghiệm tại cổng [VNPay Sandbox](https://sandbox.vnpayment.vn/devreg/).
2. **Cấu hình credentials:** Cập nhật `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` vào file `.env`.
3. **Thông tin thẻ thử nghiệm NCB:**
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **Mã OTP:** `123456`
