# Hướng Dẫn Cài Đặt & Vận Hành Dự Án BrewLite (SETUP.md)

> **Tài liệu kỹ thuật chuẩn DevOps & Onboarding dành cho lập trình viên**  
> **Phiên bản:** 2.1.0 (Cập nhật quy trình Prisma Migrate)  
> **Ngày cập nhật:** 13/10/2026  
> **Tình trạng kiểm chứng:** Đã xác minh trực tiếp từ tệp cấu hình, scripts, môi trường thực tế và log thực thi của repository.

---

## Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Yêu Cầu Môi Trường & Kiểm Tra Công Cụ](#2-yêu-cầu-môi-trường--kiểm-tra-công-cụ)
3. [Lấy Mã Nguồn (Clone Repository)](#3-lấy-mã-nguồn-clone-repository)
4. [Cài Đặt Dependencies](#4-cài-đặt-dependencies)
5. [Cấu Hình Biến Môi Trường (Environment Variables)](#5-cấu-hình-biến-môi-trường-environment-variables)
6. [Thiết Lập Cơ Sở Dữ Liệu PostgreSQL & Prisma ORM](#6-thiết-lập-cơ-sở-dữ-liệu-postgresql--prisma-orm)
7. [Hướng Dẫn Chạy Riêng Backend (NestJS)](#7-hướng-dẫn-chạy-riêng-backend-nestjs)
8. [Hướng Dẫn Chạy Riêng Frontend (Next.js)](#8-hướng-dẫn-chạy-riêng-frontend-nextjs)
9. [Hướng Dẫn Chạy Toàn Dự Án](#9-hướng-dẫn-chạy-toàn-dự-án)
10. [Build, Test & Kiểm Tra Hệ Thống (Verification)](#10-build-test--kiểm-tra-hệ-thống-verification)
11. [Xử Lý Lỗi Thường Gặp (Troubleshooting)](#11-xử-lý-lỗi-thường-gặp-troubleshooting)
12. [Checklist Setup Nhanh Cho Thành Viên Mới (Quick Start)](#12-checklist-setup-nhanh-cho-thành-viên-mới-quick-start)
13. [An Toàn Và Bảo Trì Hệ Thống (Security & Maintenance)](#13-an-toàn-và-bảo-trì-hệ-thống-security--maintenance)
14. [Quy Trình Tạo Migration Mới (Schema Change Workflow)](#14-quy-trình-tạo-migration-mới-schema-change-workflow)

---

## 1. Giới Thiệu

**BrewLite** là ứng dụng web hiện đại phục vụ quy trình đặt món và thanh toán cà phê. Dự án được tổ chức theo mô hình **Monorepo đa tầng (Multi-package Monorepo)** gồm hai ứng dụng độc lập:

- **Frontend Client (`frontend/`):** Ứng dụng giao diện người dùng và cổng quản trị, xây dựng bằng **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Zustand 5** và **Axios**. Cổng dịch vụ mặc định: `3000`.
- **Backend API (`backend/`):** Máy chủ cung cấp REST API, xây dựng bằng **NestJS 12**, **Prisma ORM**, **PostgreSQL**, **Passport JWT** và **class-validator**. Cổng dịch vụ mặc định: `4000` với tiền tố endpoint toàn cục: `/api`.
- **Thư mục gốc (`brew-lite/`):** Điều phối tác vụ phát triển song song hai dịch vụ thông qua công cụ `concurrently`.

> [!NOTE]
> **Phân định phạm vi tài liệu:**  
> Tài liệu này chỉ tập trung vào **quy trình cài đặt, cấu hình môi trường, khởi chạy, kiểm thử và xử lý lỗi vận hành**. Toàn bộ kiến trúc chi tiết, cây thư mục toàn diện, sơ đồ thực thể ERD, phân tích Clean Architecture và trách nhiệm từng module nghiệp vụ đã được tài liệu hóa riêng biệt tại [STRUCTURE.md].

---

## 2. Yêu Cầu Môi Trường & Kiểm Tra Công Cụ

Trước khi tiến hành cài đặt, máy tính lập trình viên (Windows / macOS / Linux) cần chuẩn bị đầy đủ các công cụ theo thông số đã được đối soát thực tế từ dự án:

### 2.1. Bảng Thông Số Môi Trường

| Công cụ        | Phiên bản khuyến nghị                            | Phiên bản đã kiểm chứng hệ thống              | Vị trí định nghĩa / Ghi chú                                                                                 |
| :------------- | :----------------------------------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **Node.js**    | `>= 20.x` (Khuyên dùng `v20.x` LTS hoặc `v24.x`) | `v24.18.0`                                    | `frontend/package.json` khai báo `@types/node: ^20`, `backend/package.json` khai báo `@types/node: ^24.0.0` |
| **pnpm**       | `12.8.1`                                         | `12.8.1`                                      | Khai báo trực tiếp tại trường `packageManager` trong `package.json` (root) và `frontend/package.json`       |
| **PostgreSQL** | `>= 15.x`                                        | Bản cài đặt Local hoặc Cloud (Neon, Supabase) | Định nghĩa `provider = "postgresql"` trong `backend/prisma/schema.prisma`                                   |
| **Git**        | `>= 2.40.x`                                      | Bất kỳ bản ổn định                            | Quản lý mã nguồn dự án                                                                                      |

### 2.2. Kiểm Tra Môi Trường Trên Windows PowerShell

Mở cửa sổ **PowerShell** và chạy các lệnh kiểm tra:

```powershell
# 1. Kiểm tra phiên bản Node.js
node -v
# Kết quả mong đợi: v20.x.x hoặc v24.x.x (ví dụ: v24.18.0)

# 2. Kiểm tra phiên bản pnpm
pnpm -v
# Kết quả mong đợi: 12.8.1

# 3. Kiểm tra PostgreSQL client (nếu cài đặt cục bộ)
psql --version

# 4. Kiểm tra Git
git --version
```

> [!TIP]
> **Cài đặt hoặc kích hoạt đúng phiên bản `pnpm 12.8.1`:**  
> Nếu máy của bạn chưa có đúng phiên bản `pnpm 12.8.1`, hãy chạy lệnh:
>
> ```powershell
> npm install -g pnpm@12.8.1
> ```
>
> Hoặc kích hoạt nhanh qua Corepack đi kèm Node.js:
>
> ```powershell
> corepack enable
> corepack prepare pnpm@12.8.1 --activate
> ```

---

## 3. Lấy Mã Nguồn (Clone Repository)

Kho lưu trữ chính thức của dự án được lưu trữ tại GitHub. Thực hiện clone về máy tính:

```powershell
git clone https://github.com/dkhoaaaaa/brew-lite.git
cd brew-lite
```

> [!IMPORTANT]
> **Đặc điểm kiến trúc gói của dự án:**  
> Repository này không sử dụng pnpm monorepo workspace liên kết chia sẻ `node_modules` ở root. Thay vào đó, dự án quản lý **3 tệp lockfile độc lập** (`pnpm-lock.yaml` tại thư mục root, `backend/`, và `frontend/`). Do đó, các dependencies bắt buộc phải được cài đặt riêng biệt cho từng thành phần.

---

## 4. Cài Đặt Dependencies

Do mỗi thư mục sở hữu `package.json` và `pnpm-lock.yaml` riêng, lập trình viên cần cài đặt tuần tự theo một trong hai cách dưới đây:

### Cách 1: Di Chuyển Tuần Tự Vào Từng Thư Mục (Khuyến Nghị)

Thực hiện lần lượt các lệnh tại PowerShell:

```powershell
# Bước 1: Cài đặt công cụ điều phối tại root (cài concurrently)
pnpm install

# Bước 2: Cài đặt gói phụ thuộc cho Backend NestJS
cd backend
pnpm install

# Bước 3: Cài đặt gói phụ thuộc cho Frontend Next.js
cd ..\frontend
pnpm install

# Bước 4: Quay về thư mục gốc
cd ..
```

### Cách 2: Cài Đặt Trực Tiếp Từ Thư Mục Gốc Bằng Cờ `--dir`

```powershell
pnpm install
pnpm --dir backend install
pnpm --dir frontend install
```

> [!NOTE]
> **Về tệp `pnpm-workspace.yaml` tại `backend/` và `frontend/`:**  
> Cả hai thư mục đều chứa tệp cấu hình `pnpm-workspace.yaml` thiết lập cờ `allowBuilds` của `pnpm v12` (như chặn tự động build script của `bcrypt`, `esbuild`, `sharp`). Đây là tính năng bảo mật mặc định của pnpm nhằm ngăn chặn mã độc thực thi ngầm trong lúc cài đặt. Không tự ý chỉnh sửa nếu chưa nắm rõ quy tắc build native binary.

---

## 5. Cấu Hình Biến Môi Trường (Environment Variables)

> [!NOTE]
> **Tệp mẫu `.env.example` trong repository:**  
> Repository đã có sẵn tệp mẫu [`.env.example`](/.env.example) tại thư mục root. Đây là tài liệu tham chiếu tập trung liệt kê tất cả biến môi trường thực sự được dùng trong codebase (đã đối soát từ mã nguồn). Tham khảo file này trước khi tạo các file `.env` riêng cho từng ứng dụng.

### 5.1. Nguyên Tắc Phân Định Biến

- **Biến Public Client-Side (Frontend):** Bắt buộc phải có tiền tố `NEXT_PUBLIC_` để Next.js nhúng vào mã client chạy trên trình duyệt.
- **Biến Private Server-Side (Backend):** Không có tiền tố `NEXT_PUBLIC_`, chỉ tồn tại trong runtime Node.js của NestJS và tuyệt đối không để lộ ra ngoài giao diện.
- **Cơ chế nạp biến:** Next.js đọc `.env*` từ thư mục `frontend/`; NestJS đọc `.env` từ thư mục `backend/`. Tệp `.env.example` ở root chỉ đóng vai trò tài liệu tham chiếu — không được nạp tự động bởi ứng dụng.

### 5.2. Cấu Hình Backend (`backend/.env`)

Tạo một tệp mới có tên `.env` nằm tại thư mục `backend/` với nội dung sau (thay thế các placeholder bằng thông tin thực tế):

```env
# Cổng lắng nghe của máy chủ Backend (backend/src/main.ts fallback về 4000)
PORT=4000

# Chuỗi kết nối PostgreSQL — bắt buộc cho Prisma (backend/prisma/schema.prisma)
# Thay <user>, <password>, <dbname> bằng thông tin PostgreSQL local của bạn
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>"

# Khóa bí mật ký JWT access token (backend/src/modules/auth/jwt.strategy.ts)
# Dùng chuỗi ngẫu nhiên >= 32 ký tự. KHÔNG dùng giá trị mẫu này trên production!
JWT_SECRET="<random_string_min_32_chars>"

# Khóa bí mật ký JWT refresh token — PHẢI khác JWT_SECRET
JWT_REFRESH_SECRET="<another_random_string_min_32_chars>"
```

> [!TIP]
> Tạo secret ngẫu nhiên nhanh bằng Node.js:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 5.3. Cấu Hình Frontend (`frontend/.env.local`)

Tạo một tệp mới có tên `.env.local` nằm tại thư mục `frontend/` với nội dung:

```env
# Địa chỉ gốc gọi API Backend (frontend/src/lib/axios.ts fallback về http://localhost:4000/api)
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

> [!CAUTION]
> **Quy chuẩn bảo mật bắt buộc:**  
> Cả `backend/.env` và `frontend/.env.local` đều đã được khai báo trong `.gitignore` của thư mục tương ứng. Tuyệt đối không commit các tệp này chứa thông tin thật lên GitHub! Chỉ commit tệp `.env.example` ở root (không chứa secret thật).

---

## 6. Thiết Lập Cơ Sở Dữ Liệu PostgreSQL & Prisma ORM

Lược đồ cơ sở dữ liệu được định nghĩa toàn bộ trong tệp [backend/prisma/schema.prisma](backend/prisma/schema.prisma) gồm **18 Models** (người dùng, phân quyền, sản phẩm, kích cỡ, topping, giỏ hàng, đơn hàng, thanh toán, điểm thưởng, khuyến mãi).

> [!IMPORTANT]
> **Quy trình chuẩn của nhóm: Prisma Migrate**  
> Dự án sử dụng **Prisma Migrate** làm quy trình quản lý schema. Mỗi thay đổi schema sẽ tạo ra một tệp migration SQL được **commit vào Git cùng với code**, giúp toàn bộ thành viên đồng bộ lịch sử thay đổi database.  
> Không dùng `db push` như quy trình cộng tác chuẩn; lệnh này không lưu lịch sử và có thể gây xung đột trên database dùng chung.

### 6.1. Chuẩn Bị Database PostgreSQL

1. Đảm bảo dịch vụ PostgreSQL đang chạy:
   ```powershell
   Get-Service postgresql*
   # Nếu Stopped, khởi động:
   Start-Service postgresql*
   ```
2. Mở công cụ quản trị (pgAdmin, DBeaver hoặc `psql`) và tạo database mới:
   ```sql
   CREATE DATABASE brewlite;
   ```
3. Đảm bảo `DATABASE_URL` tại `backend/.env` khớp với thông số database vừa tạo.

### 6.2. Áp Dụng Migration Cho Database Mới (Thành Viên Mới)

Khi clone repository và database của bạn hoàn toàn mới (chưa có bảng nào), thực hiện:

```powershell
cd backend

# Bước 1: Kiểm tra trạng thái migration hiện tại
pnpm prisma migrate status

# Bước 2: Áp dụng toàn bộ migration đã có trong thư mục prisma/migrations/
pnpm prisma migrate dev

# Bước 3: Sinh Prisma Client type-safe
pnpm prisma generate
```

> [!NOTE]
> **Hiện trạng Migration của Repository:**  
> Thư mục `backend/prisma/migrations/` **chưa tồn tại** (chưa có migration nào được commit vào Git). Thành viên đầu tiên thiết lập quy trình migrate cần tạo migration khởi đầu — xem hướng dẫn tại [Mục 14](#14-quy-trình-tạo-migration-mới-schema-change-workflow).

> [!IMPORTANT]
> **Lưu ý kỹ thuật về phiên bản Prisma trong `backend/package.json`:**  
> Dự án khai báo `@prisma/client: ^7.10.0` và devDependency `prisma: 8.0.0-rc.22`.  
> Phiên bản CLI `8.0.0-rc.22` là Prisma Platform (có thể thay đổi cú pháp lệnh). Nếu `pnpm prisma migrate dev` báo lỗi `UNKNOWN_COMMAND`, chạy qua npx của Prisma ORM tương thích:
> ```powershell
> npx prisma@7 migrate dev
> npx prisma@7 generate
> ```

### 6.3. Bảng Tham Chiếu Lệnh Prisma

| Lệnh | Mục đích | Môi trường |
| :--- | :--- | :--- |
| `pnpm prisma migrate dev --name <ten>` | Tạo migration mới từ thay đổi schema và áp dụng vào database local | **Dev only** |
| `pnpm prisma migrate dev` | Áp dụng các migration chưa chạy (không tạo mới) | **Dev only** |
| `pnpm prisma migrate status` | Xem trạng thái migration: đã áp dụng / chưa áp dụng | Mọi môi trường |
| `pnpm prisma migrate deploy` | Áp dụng migration trên staging / production (không tương tác) | **Staging/Prod** |
| `pnpm prisma generate` | Sinh Prisma Client từ schema hiện tại | Mọi môi trường |
| `pnpm prisma studio` | Giao diện trực quan quản lý dữ liệu tại `localhost:5555` | Dev only |
| `pnpm prisma db push` | Đồng bộ schema trực tiếp **không tạo migration** — chỉ dùng cho prototyping nhanh cá nhân, **không dùng làm quy trình chuẩn** | Đặc biệt |

### 6.4. Xem Và Quản Trị Dữ Liệu Bằng Prisma Studio

```powershell
cd backend
pnpm prisma studio
```

- **Địa chỉ truy cập:** [http://localhost:5555](http://localhost:5555)

> [!WARNING]
> **Hiện trạng Seed Dữ Liệu & Cảnh Báo An Toàn:**
>
> 1. Repository hiện **chưa có script seed dữ liệu tự động**. Sau khi áp dụng migration, bạn cần thêm dữ liệu mẫu (vai trò, sản phẩm, người dùng) thủ công qua Prisma Studio hoặc API khởi tạo.
> 2. **Tuyệt đối không tự ý chạy** `prisma migrate reset` hoặc `prisma db push --force-reset` — hai lệnh này sẽ DROP toàn bộ bảng và xóa sạch dữ liệu!

### 6.5. Cảnh Báo: Database Đã Từng Dùng `db push`

> [!CAUTION]
> **Nếu database của bạn đã có bảng được tạo bằng `db push` mà chưa có lịch sử migration tương ứng:**
>
> - **KHÔNG** chạy `migrate dev` một cách mù quáng — Prisma sẽ phát hiện drift và có thể đề xuất reset database.
> - **KHÔNG** tự ý reset database nếu còn dữ liệu thử nghiệm quan trọng.
> - **Thực hiện đúng quy trình:**
>   1. Chạy `pnpm prisma migrate status` để xem trạng thái.
>   2. Kiểm tra sự khác biệt giữa schema hiện tại và database bằng `pnpm prisma db pull` (chỉ để xem, không commit kết quả).
>   3. Nếu cần thiết lập baseline (hợp thức hóa trạng thái hiện tại), liên hệ người phụ trách database của nhóm để thực hiện đúng quy trình `prisma migrate resolve --applied` theo tài liệu Prisma chính thức.
>   4. Không thực hiện bất kỳ lệnh phá hủy dữ liệu nào mà không có sự đồng thuận của nhóm.

---

## 7. Hướng Dẫn Chạy Riêng Backend (NestJS)

### 7.1. Khởi Chạy Server Phát Triển

Mở một cửa sổ PowerShell độc lập và thực hiện:

```powershell
cd backend
pnpm start:dev
```

_(Hoặc chạy trực tiếp từ thư mục gốc `brew-lite/` bằng lệnh `pnpm --dir backend start:dev`)_.

### 7.2. Thông Số Vận Hành Đã Xác Minh

- **Địa chỉ lắng nghe:** `http://localhost:4000`
- **Tiền tố API toàn cục (Global Prefix):** `/api` (được cấu hình bằng `app.setGlobalPrefix('api')` tại `backend/src/main.ts`).
- **URL gốc gọi API:** `http://localhost:4000/api`
- **CORS:** Backend cấu hình `origin: 'http://localhost:3000'` với `credentials: true`.
- **Cơ chế khởi động kết nối DB:** `PrismaService` thực hiện `await this.$connect()` trong hook `onModuleInit`. Nếu PostgreSQL chưa bật hoặc `DATABASE_URL` sai, server sẽ báo lỗi và dừng tiến trình.

### 7.3. Bảng Lệnh Backend (Theo `backend/package.json`)

| Lệnh thực thi      | Mô tả chức năng                                                     | Ghi chú vận hành                                     |
| :----------------- | :------------------------------------------------------------------ | :--------------------------------------------------- |
| `pnpm start:dev`   | Chạy NestJS ở chế độ phát triển kèm Watch Mode                      | Tự động biên dịch lại khi file trong `src/` thay đổi |
| `pnpm start`       | Chạy NestJS thông thường (không watch)                              | Dùng cho chạy kiểm thử một lần                       |
| `pnpm start:debug` | Chạy NestJS kèm chế độ Debug (`--debug --watch`)                    | Hỗ trợ đính kèm Node debugger qua port 9229          |
| `pnpm build`       | Biên dịch TypeScript bằng `nest build` ra thư mục `dist/`           | Dùng chuẩn bị bản sản xuất                           |
| `pnpm start:prod`  | Chạy ứng dụng sản xuất đã build (`node dist/main`)                  | Đòi hỏi phải chạy `pnpm build` trước                 |
| `pnpm lint`        | Kiểm tra lỗi cú pháp bằng Oxlint (`oxlint --type-aware src/ test/`) | Linter tốc độ cao thay thế ESLint                    |
| `pnpm format`      | Tự động định dạng mã bằng Prettier                                  | Quét và format mã trong `src/` và `test/`            |
| `pnpm test`        | Chạy Unit Test bằng Vitest (`vitest run`)                           | Xem chi tiết tình trạng tại Mục 10                   |
| `pnpm test:e2e`    | Chạy End-to-End Test bằng Vitest (`vitest.config.e2e.ts`)           | Xem chi tiết tình trạng tại Mục 10                   |

---

## 8. Hướng Dẫn Chạy Riêng Frontend (Next.js)

### 8.1. Khởi Chạy Server Phát Triển

Mở một cửa sổ PowerShell độc lập khác và thực hiện:

```powershell
cd frontend
pnpm dev
```

_(Hoặc chạy trực tiếp từ thư mục gốc `brew-lite/` bằng lệnh `pnpm --dir frontend dev`)_.

### 8.2. Thông Số Vận Hành Đã Xác Minh

- **Địa chỉ truy cập trình duyệt:** [http://localhost:3000](http://localhost:3000)
- **Cơ chế phát triển:** Tự động nạp lại giao diện tức thời (Hot Module Replacement / Turbopack).
- **Cấu hình Axios Client:** Đọc từ `NEXT_PUBLIC_API_URL` (nếu không khai báo, tự động fallback về `http://localhost:4000/api` tại `frontend/src/lib/axios.ts`).

### 8.3. Bảng Lệnh Frontend (Theo `frontend/package.json`)

| Lệnh thực thi | Mô tả chức năng                                       | Ghi chú vận hành                                |
| :------------ | :---------------------------------------------------- | :---------------------------------------------- |
| `pnpm dev`    | Khởi chạy Next.js dev server tại cổng `3000`          | Môi trường làm việc chính của frontend dev      |
| `pnpm build`  | Biên dịch bản dựng sản xuất tối ưu (`next build`)     | Xem lưu ý về lỗi xung đột route tại Mục 10      |
| `pnpm start`  | Chạy server bản dựng sản xuất (`next start`)          | Đòi hỏi phải chạy `pnpm build` thành công trước |
| `pnpm lint`   | Kiểm tra cú pháp mã nguồn bằng ESLint 9 (`next lint`) | Tuân thủ cấu hình Next.js Core Web Vitals       |

---

## 9. Hướng Dẫn Chạy Toàn Dự Án

### 9.1. Chạy Gộp Bằng Script Root — Một Lệnh Duy Nhất (Khuyến Nghị Hàng Đầu)

Dự án đã định nghĩa sẵn script `dev` trong tệp [package.json](package.json) ở thư mục gốc, sử dụng `concurrently` để chạy đồng thời cả Frontend và Backend:

```json
"scripts": {
  "dev": "concurrently \"pnpm --dir frontend dev\" \"pnpm --dir backend start:dev\""
}
```

Thực hiện **một lệnh duy nhất** tại thư mục gốc `brew-lite/`:

```powershell
pnpm dev
```

- **Frontend:** Khởi chạy tại [http://localhost:3000](http://localhost:3000)
- **Backend:** Khởi chạy tại [http://localhost:4000](http://localhost:4000)

> [!IMPORTANT]
> **Điều kiện tiên quyết trước khi chạy `pnpm dev`:**
>
> 1. Đã chạy `pnpm install` ở root (để tải thư viện `concurrently`).
> 2. Đã chạy `pnpm install` ở cả `backend/` và `frontend/`.
> 3. PostgreSQL đang chạy và `backend/.env` đã cấu hình đúng `DATABASE_URL`.
> 4. Đã áp dụng migration: `pnpm prisma migrate dev` trong `backend/`.
> 5. Đã sinh Prisma Client: `pnpm prisma generate` trong `backend/`.

---

### 9.2. Phương Pháp Thay Thế: Chạy Hai Cửa Sổ Terminal Độc Lập

Phương pháp này phân tách log của Client và Server rõ ràng hơn, hữu ích khi cần debug từng phần:

- **Terminal 1 (Backend Server):**
  ```powershell
  cd backend
  pnpm start:dev
  ```
- **Terminal 2 (Frontend Client):**
  ```powershell
  cd frontend
  pnpm dev
  ```

---

## 10. Build, Test & Kiểm Tra Hệ Thống (Verification)

Mục này trình bày các bước kiểm tra chất lượng mã nguồn và trạng thái kiểm chứng thực tế trên codebase hiện tại.

### 10.1. Kiểm Tra Biên Dịch Sản Xuất (Production Build)

```powershell
# 1. Kiểm tra build Backend
cd backend
pnpm build

# 2. Kiểm tra build Frontend
cd ..\frontend
pnpm build
```

> [!WARNING]
> **Hiện trạng thực tế khi chạy Build trên Repository hiện tại:**  
> Đội ngũ kỹ thuật đã tiến hành chạy thử nghiệm lệnh build thực tế và ghi nhận hai vấn đề mã nguồn cần đội phát triển xử lý:
>
> 1. **Backend (`pnpm build`):** Lệnh `nest build` hiện tại gặp lỗi biên dịch TypeScript do thiếu khai báo kiểu từ `@prisma/client` (khi chưa generate) và lỗi phân giải đường dẫn alias `@/database/prisma.service` trong NodeNext module resolution. Đội backend cần chuẩn hóa import path alias hoặc relative path.
> 2. **Frontend (`pnpm build`):** Lệnh `next build` gặp lỗi xung đột định tuyến (Routing Collision): `You cannot have two parallel pages that resolve to the same path. Please check /(admin)/orders and /(shop)`. Cả hai thư mục `src/app/(admin)/orders/page.tsx` và `src/app/(shop)/orders/page.tsx` đều phân giải về đường dẫn `/orders`. Đội frontend cần đổi tên đường dẫn trang quản trị (ví dụ: `src/app/(admin)/admin/orders/page.tsx`).

### 10.2. Kiểm Tra Cú Pháp & Định Dạng (Lint & Format)

```powershell
# Kiểm tra Backend bằng Oxlint (linter hiệu năng cao)
cd backend
pnpm lint

# Định dạng code Backend bằng Prettier
pnpm format

# Kiểm tra Frontend bằng ESLint 9
cd ..\frontend
pnpm lint
```

### 10.3. Hiện Trạng Kiểm Thử Tự Động (Testing)

- **Tại thư mục root:** Script `"test": "echo \"Error: no test specified\" && exit 1"` chỉ là placeholder mặc định của npm, không chạy bài test nào.
- **Tại Backend (`backend/package.json`):**
  - `pnpm test` (Vitest): Quét các tệp `**/*.spec.ts`. _Hiện trạng:_ Chưa có tệp unit test nào trong `backend/src/`.
  - `pnpm test:e2e` (Vitest E2E): Chạy bài test [backend/test/app.e2e-spec.ts](file:///d:/CNPM/brew-lite/backend/test/app.e2e-spec.ts). _Hiện trạng:_ Bài test này kỳ vọng route `GET /` trả về `'Hello World!'`, trong khi `AppModule` hiện tại chỉ import `DatabaseModule` mà chưa có AppController, do đó bài test e2e này hiện tại sẽ không pass nếu chạy.
- **Tại Frontend:** Chưa cấu hình script test trong `package.json`.

### 10.4. Checklist Nghiệm Thu Vận Hành

Sau khi khởi chạy ứng dụng thành công, hãy đánh dấu kiểm tra:

- [ ] **Backend Service:** Truy cập [http://localhost:4000](http://localhost:4000), log terminal hiển thị: `BrewLite Backend đang chạy tại: http://localhost:4000`.
- [ ] **Frontend Application:** Truy cập [http://localhost:3000](http://localhost:3000), giao diện tải thành công không bị lỗi màn hình trắng.
- [ ] **Kết nối CORS & API:** Mở Tab Network trên DevTools (F12) trình duyệt, các request gửi sang `http://localhost:4000/api` phản hồi mã HTTP hợp lệ, không bị chặn bởi chính sách CORS (`Access-Control-Allow-Origin: http://localhost:3000`).
- [ ] **Prisma Studio:** Truy cập [http://localhost:5555](http://localhost:5555), hiển thị đầy đủ danh sách 18 bảng dữ liệu quan hệ.

---

## 11. Xử Lý Lỗi Thường Gặp (Troubleshooting)

### 11.1. Lỗi: `Cannot find module '@prisma/client'` hoặc `PrismaClientInitializationError`

- **Nguyên nhân:** Chưa chạy lệnh sinh client từ `schema.prisma`, hoặc vừa pull mã nguồn mới có thay đổi schema mà chưa cập nhật client.
- **Cách xử lý:**
  ```powershell
  cd backend
  pnpm prisma generate
  # Nếu báo lỗi command not found trên Prisma 8-rc:
  npx prisma@7 generate
  ```

---

### 11.2. Lỗi: Không thể kết nối cơ sở dữ liệu khi khởi động NestJS

- **Dấu hiệu:** Terminal backend in ra lỗi: `Can't reach database server at localhost:5432` hoặc `PrismaClientInitializationError` và ứng dụng dừng ngay lập tức.
- **Nguyên nhân:** `PrismaService` gọi `this.$connect()` trong lifecycle hook `onModuleInit`. Nếu PostgreSQL chưa được bật hoặc thông tin trong `DATABASE_URL` tại `backend/.env` bị sai, server sẽ từ chối khởi động.
- **Cách xử lý:**
  1. Kiểm tra dịch vụ PostgreSQL trên máy:
     ```powershell
     Get-Service postgresql*
     ```
     Nếu đang dừng (`Stopped`), hãy khởi động lại dịch vụ:
     ```powershell
     Start-Service postgresql*
     ```
  2. Mở tệp `backend/.env` và kiểm tra lại username, password, cổng (mặc định 5432) và tên database (`brewlite`).

---

### 11.3. Lỗi: Trùng cổng dịch vụ (`EADDRINUSE: address already in use :::4000` hoặc `:::3000`)

- **Nguyên nhân:** Cổng 4000 (Backend) hoặc 3000 (Frontend) đang bị chiếm dụng bởi một tiến trình cũ chưa tắt hẳn hoặc một ứng dụng khác.
- **Cách xử lý trên Windows PowerShell:**

  ```powershell
  # 1. Tìm PID của tiến trình đang chiếm cổng (ví dụ cổng 4000)
  netstat -ano | findstr :4000

  # 2. Dừng tiến trình dựa vào số PID tìm được (ví dụ PID là 12345)
  Stop-Process -Id 12345 -Force
  ```

  _(Thực hiện tương tự với cổng 3000 hoặc 5555 nếu bị trùng)_.

---

### 11.4. Lỗi CORS khi gọi API từ Frontend sang Backend

- **Dấu hiệu:** Console trình duyệt báo đỏ: `Access to XMLHttpRequest at 'http://localhost:4000/api' from origin 'http://localhost:3001' has been blocked by CORS policy`.
- **Nguyên nhân:** Khi cổng 3000 bận, Next.js tự động chuyển sang cổng 3001. Trong khi đó, `backend/src/main.ts` đang cấu hình cứng:
  ```typescript
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });
  ```
- **Cách xử lý:**
  - Giải phóng cổng 3000 để Frontend chạy đúng tại `http://localhost:3000`.
  - Hoặc nếu bắt buộc chạy cổng khác, bổ sung cổng đó vào mảng `origin` trong cấu hình `enableCors` tại `backend/src/main.ts`.

---

### 11.5. Lỗi: `'concurrently' is not recognized as an internal or external command`

- **Nguyên nhân:** Lập trình viên chạy lệnh `pnpm dev` tại thư mục root nhưng chưa từng chạy `pnpm install` tại thư mục root.
- **Cách xử lý:**
  ```powershell
  cd brew-lite
  pnpm install
  ```

---

### 11.6. Lỗi khi cài đặt native package (bcrypt) trên Windows

- **Nguyên nhân:** Thư viện `bcrypt` có thành phần C++ native. Nếu máy thiếu công cụ build Visual Studio C++, lệnh cài đặt có thể gặp cảnh báo.
- **Cách xử lý:**
  - Dự án đã cấu hình `allowBuilds: { bcrypt: false }` trong `backend/pnpm-workspace.yaml` để tận dụng prebuilt binary.
  - Đảm bảo bạn đang sử dụng Node.js LTS tương thích (Node 20 hoặc Node 24).

---

## 12. Checklist Setup Nhanh Cho Thành Viên Mới (Quick Start)

Dành cho lập trình viên muốn thiết lập nhanh toàn bộ dự án từ đầu trong 5 - 10 phút:

|  Bước  | Thao tác thực hiện                        | Lệnh dòng lệnh (PowerShell)                                          | Thư mục thực thi      |
| :----: | :---------------------------------------- | :------------------------------------------------------------------- | :-------------------- |
| **1**  | Clone repository                          | `git clone https://github.com/dkhoaaaaa/brew-lite.git; cd brew-lite` | Thư mục cha           |
| **2**  | Cài đặt pnpm 12.8.1                       | `npm install -g pnpm@12.8.1`                                         | Bất kỳ                |
| **3**  | Cài đặt gói root                          | `pnpm install`                                                       | `brew-lite/`          |
| **4**  | Cài đặt Backend                           | `cd backend; pnpm install`                                           | `brew-lite/backend/`  |
| **5**  | Tạo DB & cấu hình `backend/.env`          | Tạo DB `brewlite` trong PostgreSQL, điền `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` — xem Mục 5.2 | `brew-lite/backend/`  |
| **6**  | Kiểm tra trạng thái migration             | `pnpm prisma migrate status`                                         | `brew-lite/backend/`  |
| **7**  | Áp dụng migration & sinh Prisma Client    | `pnpm prisma migrate dev` rồi `pnpm prisma generate`                 | `brew-lite/backend/`  |
| **8**  | Cài đặt Frontend                          | `cd ..\frontend; pnpm install`                                       | `brew-lite/frontend/` |
| **9**  | Tạo file `frontend/.env.local`            | Nhập `NEXT_PUBLIC_API_URL="http://localhost:4000/api"`               | `brew-lite/frontend/` |
| **10** | Khởi chạy toàn bộ dự án (một lệnh)       | `cd ..; pnpm dev`                                                    | `brew-lite/`          |
| **11** | Kiểm tra trình duyệt                      | Mở `http://localhost:3000` (FE) và `http://localhost:4000` (BE)      | Trình duyệt           |

---

## 13. An Toàn Và Bảo Trì Hệ Thống (Security & Maintenance)

Để đảm bảo tính ổn định và bảo mật cao nhất trong suốt quá trình phát triển của toàn đội ngũ, mọi thành viên bắt buộc phải tuân thủ các quy tắc vận hành sau:

### 13.1. Quản Lý Secrets & Biến Nhạy Cảm

- Tuyệt đối không commit tệp `.env`, `.env.local` hoặc bất kỳ khóa bí mật (`JWT_SECRET`), mật khẩu database thật nào lên GitHub.
- Trước khi thực hiện lệnh `git add .` hoặc tạo Pull Request, luôn chạy `git status` để kiểm tra chắc chắn không có tệp cấu hình môi trường nào nằm trong danh sách staged.

### 13.2. Bảo Vệ Dữ Liệu Cơ Sở Dữ Liệu (Database Safeguard)

- Tuyệt đối không chạy lệnh `prisma migrate reset` hoặc `prisma db push --force-reset` trên bất kỳ database nào dùng chung hoặc database chứa dữ liệu thử nghiệm quan trọng.
- Khi làm việc trên môi trường Production hoặc Staging, luôn sử dụng quy trình `prisma migrate deploy` thay vì `db push`.

### 13.3. Bảo Toàn Tính Toàn Vẹn Của Lockfile (Lockfile Integrity)

- Không tùy tiện xóa các tệp `pnpm-lock.yaml` (ở root, `backend/`, hay `frontend/`) để giải quyết xung đột cài đặt. Việc xóa lockfile sẽ dẫn đến nguy cơ tự động nâng cấp các thư viện không tương thích (breaking changes).
- Khi cần cài thêm thư viện mới, luôn chỉ định rõ ràng qua lệnh `pnpm add <package>` hoặc `pnpm add -D <package>` bên trong thư mục tương ứng.

### 13.4. Giữ Đồng Bộ Môi Trường Runtime

- Toàn bộ nhóm phát triển cần thống nhất sử dụng phiên bản Node.js `>= 20.x` (khuyến nghị phiên bản LTS đã kiểm chứng `v24.18.0`) và trình quản lý gói `pnpm@12.8.1`. Tránh sử dụng npm hoặc yarn để tránh phát sinh tệp `package-lock.json` hay `yarn.lock` gây phân mảnh cấu hình dự án.

### 13.5. Quản Lý Migration (Database Change Safeguard)

- Luôn commit thư mục `backend/prisma/migrations/` và `backend/prisma/schema.prisma` vào cùng Pull Request.
- **Không sửa hoặc xóa** tệp migration đã được merge lên nhánh chính hoặc đã áp dụng trên database dùng chung. Nếu cần sửa logic, hãy tạo migration mới.
- Không chạy `prisma migrate reset` trên database dùng chung. Lệnh này xóa toàn bộ dữ liệu.

---

## 14. Quy Trình Tạo Migration Mới (Schema Change Workflow)

Mọi thay đổi schema (`backend/prisma/schema.prisma`) đều phải đi kèm migration. Thực hiện đúng quy trình sau:

### 14.1. Trước Khi Thay Đổi

```powershell
# 1. Đảm bảo đang ở nhánh feature mới, đã pull code mới nhất
git checkout -b feature/<ten-tinh-nang>
git pull origin main

# 2. Kiểm tra trạng thái migration trước khi bắt đầu
cd backend
pnpm prisma migrate status
```

### 14.2. Chỉnh Sửa Schema

Mở và chỉnh sửa tệp `backend/prisma/schema.prisma` theo yêu cầu nghiệp vụ.

### 14.3. Tạo Migration Mới

```powershell
# Chạy từ thư mục backend/
# Đặt tên migration mô tả rõ thay đổi, dùng snake_case
pnpm prisma migrate dev --name add_product_description
# Ví dụ khác:
pnpm prisma migrate dev --name add_refresh_token_to_users
pnpm prisma migrate dev --name rename_order_status_column
```

Lệnh này sẽ:
1. So sánh `schema.prisma` với trạng thái database hiện tại.
2. Sinh tệp SQL migration trong `backend/prisma/migrations/<timestamp>_<ten>/migration.sql`.
3. Áp dụng migration vào database local của bạn.
4. Cập nhật Prisma Client.

### 14.4. Kiểm Tra Kết Quả

```powershell
# Xem tệp SQL được sinh ra
# (kiểm tra thủ công thư mục backend/prisma/migrations/)

# Xác minh trạng thái migration
pnpm prisma migrate status

# Khởi động lại backend và kiểm tra không có lỗi
pnpm start:dev
```

> [!WARNING]
> **Khi migration lỗi:**  
> - Dừng lại, **đọc kỹ thông báo lỗi** từ Prisma.
> - Chạy `pnpm prisma migrate status` để xem migration nào bị Failed.
> - Kiểm tra trạng thái database thực tế bằng pgAdmin hoặc `psql`.
> - **Không tự ý reset hoặc xóa dữ liệu** — liên hệ nhóm trước khi thực hiện bất kỳ lệnh phá hủy nào.

### 14.5. Commit Và Tạo Pull Request

```powershell
# Từ thư mục root brew-lite/
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add product description column"
git push origin feature/<ten-tinh-nang>
```

> [!IMPORTANT]
> **Bắt buộc commit cả hai:**
> - `backend/prisma/schema.prisma` — định nghĩa schema mới
> - `backend/prisma/migrations/` — tệp migration SQL tương ứng
>
> Không commit schema mà thiếu migration, hoặc ngược lại — sẽ gây drift trên database của thành viên khác.

### 14.6. Thành Viên Khác Pull Và Đồng Bộ

Sau khi Pull Request được merge, các thành viên khác cần:

```powershell
git pull origin main

cd backend
# Kiểm tra migration mới chưa được áp dụng
pnpm prisma migrate status

# Áp dụng migration mới lên database local
pnpm prisma migrate dev

# Sinh lại Prisma Client nếu cần
pnpm prisma generate
```

> [!NOTE]
> Nếu thành viên chạy `pnpm prisma migrate dev` (không có `--name`) thì Prisma chỉ áp dụng các migration chưa chạy, không tạo migration mới — đây là hành vi bình thường khi đồng bộ sau khi pull.
