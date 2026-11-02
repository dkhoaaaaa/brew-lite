# BrewLite

**Ứng dụng đặt đồ uống và thanh toán không dùng tiền mặt**

## 1. Giới thiệu đồ án

BrewLite hỗ trợ khách hàng xem menu, chọn đồ uống, tùy chỉnh kích thước/topping, đặt hàng và thanh toán không dùng tiền mặt. Hệ thống cũng có các nghiệp vụ quản lý đơn hàng, khuyến mãi và tích điểm/đổi thưởng theo các chức năng được triển khai.

Đồ án môn **Công nghệ Phần mềm**, học kỳ **I (2026–2027)**, **Khoa Công nghệ Thông tin – Đại học Sài Gòn**; tổ chức công việc theo Agile Scrum.

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | NestJS, REST API, JWT |
| Database | PostgreSQL 17 |
| ORM / migration / seed | Prisma 7 |
| Quản lý package | pnpm workspace |
| Môi trường chạy | Docker Compose |

## 2. Cấu trúc source code

```text
brew-lite/
├── frontend/                       # Giao diện Next.js
│   ├── src/
│   │   ├── app/                    # Trang và routing
│   │   ├── components/             # Component dùng chung
│   │   ├── features/               # Nghiệp vụ giao diện (nếu có)
│   │   ├── lib/                    # API client và tiện ích
│   │   ├── stores/                 # Quản lý trạng thái (nếu có)
│   │   └── types/                  # Kiểu dữ liệu
│   ├── public/                     # Tài nguyên tĩnh
│   ├── Dockerfile
│   └── package.json
├── backend/                        # API NestJS
│   ├── src/
│   │   ├── main.ts                 # Điểm khởi động ứng dụng
│   │   ├── app.module.ts           # Module gốc
│   │   ├── prisma/                 # PrismaService / PrismaModule
│   │   └── modules/                # auth, products, orders, ...
│   ├── prisma/
│   │   ├── schema.prisma           # Mô hình dữ liệu
│   │   ├── migrations/             # Migration được quản lý bằng Git
│   │   └── seed.ts                 # Menu, khuyến mãi, tài khoản mẫu
│   ├── prisma7.config.ts          # Cấu hình Prisma CLI
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml              # Các service postgres/backend/frontend
├── package.json                    # Script pnpm dev gọi Docker Compose
├── pnpm-workspace.yaml             # Khai báo workspace
├── pnpm-lock.yaml                  # Khóa phiên bản package
├── .env.example                    # Ví dụ biến môi trường (nếu có)
└── README.md
```

*Cây thư mục mô tả thành phần chính; một số thư mục tùy tiến độ triển khai.*

## 3. Chạy dự án end-to-end

### 3.1. Yêu cầu

- **Docker Desktop** (Docker Compose v2), **Git**.
- **Node.js và pnpm trên máy** chỉ để chạy lệnh tiện ích **`pnpm dev`** ở root; tất cả dependencies của Frontend/Backend và Prisma được chạy **trong Docker**, không cần `pnpm install` trên Windows.
- Mở terminal tại **thư mục gốc `brew-lite/`** cho toàn bộ các lệnh dưới đây.

### 3.2. Lấy source và tạo cấu hình

```powershell
git clone https://github.com/dkhoaaaaa/brew-lite
cd brew-lite
Copy-Item .env.example .env
```

Nếu repo không có `.env.example`, hãy tạo `.env` ở **root** và thêm các biến theo mẫu sau (đổi mật khẩu và JWT secret phù hợp):

```dotenv
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=<mat-khau-postgres>
POSTGRES_DB=brewlite
JWT_ACCESS_SECRET=<chuoi-bi-mat-du-manh>
JWT_REFRESH_SECRET=<chuoi-bi-mat-khac>
```

**Quan trọng để tránh nhầm database:** Trong `docker-compose.yml`, cấu hình `backend.environment.DATABASE_URL` theo hostname service `postgres`, ví dụ:

```yaml
services:
  backend:
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
```

Đây là **đoạn cần áp dụng vào Compose hiện tại**, không phải toàn bộ file thay thế. Mật khẩu kết nối trong URL phải được mã hóa nếu chứa ký tự đặc biệt như `@`, `#`, `/`, `:`. Với database đã có dữ liệu, giữ thông tin đăng nhập PostgreSQL thực tế; thay `POSTGRES_PASSWORD` trong `.env` không tự đổi mật khẩu role trong volume cũ.

`backend/.env` (nếu tồn tại) chỉ phục vụ chạy thủ công ngoài Docker; **không dùng nó để seed/migrate khi theo hướng dẫn này**. Trong Docker, biến được Compose truyền vào container được ưu tiên hơn giá trị nạp bằng `dotenv/config` mặc định.

Không commit file `.env` hoặc JWT secret lên Git.

### 3.3. Khởi động bằng `pnpm dev`

```powershell
pnpm dev
```

Script tại root `package.json`:

```json
{
  "scripts": {
    "dev": "docker compose -f docker-compose.yml up --build"
  }
}
```

`pnpm dev` **chạy Docker Compose**, không khởi động Next.js/NestJS trực tiếp trên Windows. Lệnh chạy ở chế độ hiện log (foreground); **mở thêm một terminal tại root** để chạy migration và seed. Dừng bằng `Ctrl+C` (hoặc dùng `docker compose down` khi muốn dừng service).

> Nếu vừa đổi `.env` hoặc sửa Compose, hãy dừng lần chạy cũ rồi chạy lại `pnpm dev` để container nhận cấu hình mới.

### 3.4. Kiểm tra URL kết nối trước khi chạy migration/seed

```powershell
docker compose config | Select-String "DATABASE_URL"
docker compose exec backend node -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname,db:u.pathname})"
docker compose ps
```

Hostname của URL trong container **phải là `postgres`** và database đúng dự kiến. Nếu vẫn là `localhost`, **dừng lại, chưa migration hoặc seed**; kiểm tra Compose, `.env` root và biến môi trường shell. Không chia sẻ nguyên chuỗi kết nối có mật khẩu.

### 3.5. Migration, generate và seed (đều chạy trong Docker)

Sau khi `postgres` healthy và `backend` đang chạy:

**Áp dụng migration đã commit:**

```powershell
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
```

**Generate Prisma Client:**

```powershell
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts generate
```

**Seed dữ liệu mẫu (chỉ chạy lần đầu hoặc khi thực sự muốn cập nhật dữ liệu mẫu):**

```powershell
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
```

Seed theo mã đã trao đổi gồm **5 danh mục, 50 đồ uống, size S/M/L, 6 topping, 10 khuyến mãi và phần thưởng đổi điểm**. Tài khoản mẫu chỉ được tạo nếu phiên bản `backend/prisma/seed.ts` hiện tại có đoạn seed người dùng và `NODE_ENV` cho phép. Seed chạy lại có thể **ghi đè giá, tồn kho hoặc mật khẩu tài khoản mẫu**, tùy cách seed đang được viết. Không chạy seed trên môi trường chứa dữ liệu thật.

**Nếu báo `Command "prisma" not found`:** kiểm tra `backend/package.json` có `prisma` và `tsx`, rồi đồng bộ dependencies **trong Docker** (không xóa volume DB):

```powershell
docker compose exec -w /app backend pnpm install --frozen-lockfile
docker compose exec -w /app/backend backend pnpm exec prisma --version
```

Nếu cài thất bại do lockfile chưa đồng bộ, liên hệ người cập nhật dependencies để commit lại `pnpm-lock.yaml`; không tự xóa lockfile hay volume dữ liệu.

### 3.6. Truy cập ứng dụng

Sau khi chạy `pnpm dev` và các container khởi động thành công, mở các đường dẫn sau:

| Thành phần | Đường dẫn |
|---|---|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:3001](http://localhost:3001) |

Backend cung cấp API nên khi mở địa chỉ gốc có thể hiển thị phản hồi JSON hoặc thông báo từ server thay vì giao diện web.

### 3.7. Chạy những lần tiếp theo

Từ root, chỉ cần:

```powershell
pnpm dev
```

Nếu vừa `git pull` và có migration mới, chạy lại **migrate deploy**. Không cần seed lại mỗi lần mở máy. Các lệnh kiểm tra và bảo trì vẫn dùng Docker:

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

`docker compose down` thông thường giữ named volume. **Không dùng `docker compose down -v`, `prisma migrate reset` hoặc `prisma db push`** để xử lý lỗi thông thường; chúng có thể xóa hoặc làm thay đổi dữ liệu và lịch sử schema.

## 4. Tài khoản mẫu (development/test)

| Email | Mật khẩu mẫu | Ghi chú |
|---|---|---|
| `example@example.com` | `Example@123` | Tài khoản ví dụ |
| `customer1@example.com` | `Customer@123` | Khách hàng, 100 điểm mẫu |

Các tài khoản trên **chỉ có sau khi seed tài khoản được chạy thành công**. Trong Prisma schema hiện tại, `User` không có cột `role`, nên không có tài khoản Admin/Staff được phân quyền bởi schema này. Mật khẩu được lưu ở dạng bcrypt hash, không lưu dạng plaintext.


---

**Quy ước của nhóm:** `pnpm dev` chỉ dùng để **khởi động Docker Compose** cho tiện; **mọi lệnh migration, generate, seed, logs, kiểm tra và dừng container đều sử dụng `docker compose ...`**. Không cài và không chạy Prisma hoặc Backend/Frontend trực tiếp trên Windows theo quy trình này.

## 5. VNPay Sandbox

Thanh toán sử dụng VNPay Sandbox. Checkout chỉ khởi tạo giao dịch ở backend và chuyển trình duyệt sang VNPay; trạng thái đơn chỉ được cập nhật sau khi backend xác minh chữ ký và dữ liệu IPN. Return URL chỉ điều hướng người dùng về trang xác nhận, trang này tải lại trạng thái từ API.

1. Sao chép `.env.example` thành `.env` nếu chưa có. Điền `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` do VNPay cấp cho môi trường Sandbox. Không đưa Hash Secret vào frontend hoặc commit file `.env`.
2. Cấu hình `VNPAY_RETURN_URL` là URL người dùng được chuyển về sau khi thanh toán, ví dụ `http://localhost:3001/payments/vnpay/return` khi trình duyệt và backend đang chạy trên cùng máy. Return URL chỉ điều hướng người dùng về trang xác nhận; nó không thay thế IPN và việc quay về URL này không xác nhận giao dịch đã được backend cập nhật.
3. IPN là callback server-to-server riêng, dùng route `GET /payments/vnpay/ipn`. URL đăng ký với VNPay có dạng `https://<host-api-cong-khai>/payments/vnpay/ipn`. Endpoint cần HTTPS/SSL và có thể truy cập công khai; VNPay không thể gọi `localhost`, địa chỉ LAN hoặc backend chưa public. IPN URL không lấy từ `VNPAY_RETURN_URL`; trong cấu hình hiện tại không có biến môi trường `VNPAY_IPN_URL`.
4. Cung cấp IPN URL, môi trường (Sandbox/Production) và `VNPAY_TMN_CODE` tương ứng cho quản trị viên merchant hoặc đầu mối hỗ trợ VNPay để đăng ký với website/mã merchant đó. Tài liệu tích hợp PAY chính thức yêu cầu merchant gửi IPN URL cho VNPay sau khi thiết lập, nhưng tài liệu công khai không nêu đường dẫn menu Merchant Admin cụ thể. Không gửi `VNPAY_HASH_SECRET` qua kênh không an toàn.
5. Khởi động ứng dụng bằng `pnpm dev`. Có thể cấu hình `PAYMENT_TTL_MINUTES` cho thời gian thanh toán (số nguyên từ 1 đến 1440; mặc định 2 phút); thay đổi này chỉ áp dụng cho đơn tạo mới.
6. Tạo đơn và hoàn tất giao dịch Sandbox. Kiểm tra log backend và trạng thái đơn được tải trên trang xác nhận để đối chiếu việc xử lý. Chỉ xác nhận IPN thực tế khi backend có endpoint HTTPS công khai và quan sát được callback từ VNPay; giao dịch Sandbox hoặc việc quay về Return URL riêng lẻ không đủ để kết luận IPN đã hoạt động.

Biến môi trường liên quan: `VNPAY_PAYMENT_URL`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`, `FRONTEND_BASE_URL` (và `PORT` nếu đổi cổng). Riêng xử lý IPN chỉ cần `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET`; tạo payment/luồng return cũng cần `VNPAY_RETURN_URL`. `VNPAY_PAYMENT_URL` mặc định là Sandbox, `FRONTEND_BASE_URL` mặc định là localhost. Không có biến môi trường IPN riêng: host công khai được vận hành/deploy bên ngoài, còn path là `/payments/vnpay/ipn`.

Đối chiếu luồng và response theo [tài liệu tích hợp PAY chính thức của VNPay](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html): IPN dùng GET, cần SSL, là server-to-server và phản hồi JSON có `RspCode` cùng `Message`; mã 00/02 được xem là đã xác nhận, còn 01/04/97/99 có thể bị retry (tối đa 10 lần, cách nhau 5 phút theo tài liệu). Return URL là điều hướng người dùng, IPN URL mới là nơi backend cập nhật giao dịch.

Các endpoint tích hợp:

| Endpoint | Mục đích |
|---|---|
| `POST /payments/orders/:id/vnpay` | Khởi tạo hoặc tiếp tục payment attempt; yêu cầu JWT và `Idempotency-Key` |
| `GET /payments/vnpay/ipn` | Nhận và xác minh IPN từ VNPay; dùng URL HTTPS công khai đã đăng ký với VNPay |
| `GET /payments/vnpay/return` | Điều hướng về frontend, không cập nhật trạng thái thanh toán |

Không thể xác nhận giao dịch Sandbox thật nếu chưa có credentials hợp lệ và IPN HTTPS công khai hoạt động. Unit test chỉ xác minh logic backend; không thay thế giao dịch Sandbox thật. Callback thành công đến sau khi đơn đã hủy/hết hạn được lưu để đối soát nhưng không tự mở lại đơn hoặc tích điểm.
