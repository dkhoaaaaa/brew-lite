# BrewLite

****Ứng dụng đặt cà phê không dùng tiền mặt****

## 1. Giới thiệu dự án

BrewLite là ứng dụng hỗ trợ khách hàng đặt đồ uống và thanh toán không dùng tiền mặt, giúp giảm thời gian xếp hàng và nhận đơn nhanh chóng tại quầy.

Dự án được phát triển theo mô hình ****Frontend – Backend tách biệt****, sử dụng quy trình ****Agile Scrum****.

- ****Môn học:**** Công nghệ Phần mềm

- ****Học kỳ:**** I – Năm học 2026–2027

- ****Trường:**** Đại học Sài Gòn – Khoa Công nghệ Thông tin

### Công nghệ sử dụng

| Thành phần | Công nghệ |

|---|---|

| Frontend | Next.js, React, TypeScript, Tailwind CSS |

| State & Data | Zustand, React Query |

| Backend | NestJS, TypeScript, REST API |

| Authentication | Passport JWT |

| Database | PostgreSQL |

| ORM & Migration | Prisma |

| Package Manager | pnpm |

| Container | Docker, Docker Compose |

---

## 2. Cấu trúc dự án

BrewLite được tổ chức theo mô hình monorepo, quản lý frontend và backend trong cùng một repository.

```text

brew-lite/

├── frontend/                  # Ứng dụng giao diện

│   ├── src/

│   │   ├── app/               # Pages, layouts, routing

│   │   ├── assets/            # Tài nguyên giao diện (nếu sử dụng)

│   │   ├── components/        # Components dùng chung

│   │   ├── features/          # Chức năng theo nghiệp vụ

│   │   ├── lib/               # API client, utilities

│   │   ├── stores/            # Zustand stores

│   │   └── types/             # TypeScript types

│   ├── public/                # Tài nguyên public

│   ├── Dockerfile

│   ├── package.json

│   └── .env.local             # Biến môi trường frontend

│

├── backend/                   # REST API

│   ├── src/

│   │   ├── main.ts            # Entry point của NestJS

│   │   ├── app.module.ts      # Root module

│   │   ├── common/            # Thành phần dùng chung

│   │   ├── config/            # Cấu hình ứng dụng

│   │   ├── prisma/            # Prisma service/module

│   │   └── modules/           # Các module nghiệp vụ

│   │       ├── auth/          # Xác thực

│   │       ├── users/         # Người dùng

│   │       ├── categories/    # Danh mục

│   │       ├── products/      # Sản phẩm

│   │       ├── toppings/      # Topping

│   │       ├── carts/         # Giỏ hàng

│   │       ├── promotions/    # Khuyến mãi

│   │       ├── loyalty/       # Điểm thưởng

│   │       ├── orders/        # Đơn hàng

│   │       └── payments/      # Thanh toán

│   ├── prisma/

│   │   ├── schema.prisma      # Khai báo database schema

│   │   ├── migrations/        # Lịch sử migration

│   │   └── seed.ts            # Dữ liệu mẫu (nếu có)

│   ├── Dockerfile

│   ├── package.json

│   └── .env                   # Biến môi trường backend (nếu cần)

│

├── docker-compose.yaml        # Cấu hình Docker Compose

├── package.json               # Scripts chạy toàn bộ dự án

├── pnpm-lock.yaml             # Khóa phiên bản dependencies

├── pnpm-workspace.yaml

├── .env.example               # Mẫu biến môi trường root

├── .gitignore

└── README.md

```

Lưu ý: Cấu trúc trên mô tả các thư mục chính. Một số thư mục có thể chưa chứa file nếu chức năng tương ứng chưa được triển khai. Hãy giữ nguyên tên file và cấu trúc thực tế của repository khi cập nhật tài liệu.

### 2.1. Frontend — `frontend/`

Frontend chịu trách nhiệm hiển thị giao diện và tương tác với người dùng.

| Thư mục | Mục đích |

|---|---|

| `src/app/` | Khai báo trang, layout và routing |

| `src/components/` | Các UI component có thể tái sử dụng |

| `src/features/` | Gom code theo chức năng nghiệp vụ |

| `src/lib/` | API client và hàm tiện ích |

| `src/stores/` | Quản lý state bằng Zustand |

| `src/types/` | Khai báo kiểu dữ liệu TypeScript |

| `public/` | Ảnh và tài nguyên phục vụ trực tiếp cho giao diện |

### 2.2. Backend — `backend/`

Backend cung cấp API, xử lý nghiệp vụ và truy cập PostgreSQL.

| Thành phần | Mục đích |

|---|---|

| `src/main.ts` | Khởi tạo ứng dụng NestJS |

| `src/app.module.ts` | Module gốc của ứng dụng |

| `src/common/` | Các thành phần dùng chung |

| `src/config/` | Cấu hình ứng dụng |

| `src/prisma/` | Tích hợp Prisma vào NestJS |

| `src/modules/` | Chia ứng dụng thành các module nghiệp vụ |

| `prisma/schema.prisma` | Khai báo model và cấu hình Prisma |

| `prisma/migrations/` | Lưu các thay đổi cấu trúc database theo phiên bản |

| `prisma/seed.ts` | Khởi tạo dữ liệu mẫu nếu được cấu hình |

****Quy tắc làm việc với database:**** Khi thay đổi cấu trúc dữ liệu, cần tạo migration mới và commit migration vào Git. Thành viên khác phải áp dụng migration đã có, không tự ý tạo lại migration ban đầu.

---

## 3. Yêu cầu môi trường

Trước khi chạy dự án, hãy cài đặt các công cụ sau:

- ****Git:**** tải mã nguồn từ GitHub.

- ****Node.js:**** phiên bản tương thích với các package của dự án.

- ****pnpm:**** phiên bản `12.8.1`.

- ****Docker Desktop:**** chạy PostgreSQL và các service của dự án.

- ****GitHub access:**** bảo đảm tài khoản của bạn có quyền truy cập repository.

Kiểm tra các công cụ bằng PowerShell hoặc terminal:

```powershell

git --version

node --version

pnpm --version

docker --version

docker compose version

```

Nếu `pnpm` chưa được cài đặt, có thể bật Corepack hoặc cài đặt pnpm theo hướng dẫn chính thức phù hợp với phiên bản Node.js đang sử dụng.

Tài liệu tham khảo:

- Node.js: https://nodejs.org/

- pnpm: https://pnpm.io/installation

- Docker Desktop: https://docs.docker.com/desktop/

- Git: https://git-scm.com/downloads

---

## 4. Cài đặt và chạy dự án End-to-End

### Bước 1. Clone repository

Mở terminal tại thư mục muốn lưu dự án:

```powershell

git clone https://github.com/dkhoaaaaa/brew-lite

cd brew-lite

```

Nếu repository có địa chỉ khác, dùng đúng URL GitHub của nhóm.

Nếu đã có mã nguồn, chỉ cần mở terminal tại thư mục gốc của dự án.

### Bước 2. Tạo các file môi trường

Tại thư mục root, sao chép file mẫu:

```powershell

Copy-Item .env.example .env

```

Tiếp theo, kiểm tra file mẫu dành cho frontend. Nếu repository có `frontend/.env.local.example`, tạo file cấu hình local:

```powershell

Copy-Item frontend/.env.local.example frontend/.env.local

```

Nếu backend yêu cầu file `backend/.env` theo cấu hình hiện tại, hãy tạo file này theo mẫu backend tương ứng trong repository.

****Quan trọng:****

- Điền đầy đủ các biến môi trường mà ứng dụng yêu cầu.

- Kiểm tra cấu hình database, JWT và API URL.

- Không ghi đè cấu hình mẫu bằng thông tin bí mật của cá nhân khác.

- Không commit các file `.env`, `.env.local` hoặc thông tin đăng nhập lên GitHub.

Các biến thường gặp ở root gồm:

```dotenv

POSTGRES_USER=

POSTGRES_PASSWORD=

POSTGRES_DB=

DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

```

Hãy sử dụng đúng giá trị và tên biến được khai báo trong `.env.example` của repository; không tự đổi tên biến nếu code đang sử dụng tên hiện tại.

### Bước 3. Cài đặt dependencies

Tại thư mục gốc `brew-lite/`, chạy:

```powershell

pnpm install

```

Lệnh này cài đặt dependencies theo cấu hình workspace và lockfile của dự án.

Nếu gặp lỗi phiên bản pnpm, hãy kiểm tra trường `packageManager` trong `package.json` và sử dụng đúng phiên bản yêu cầu.

### Bước 4. Khởi động toàn bộ hệ thống

Bảo đảm Docker Desktop đã khởi động và các file môi trường đã được cấu hình.

Tại thư mục root, chạy:

```powershell

pnpm dev

```

Lệnh này sử dụng script đã được cấu hình trong `package.json` root để khởi chạy hệ thống bằng Docker Compose, bao gồm frontend, backend và PostgreSQL.

Không cần mở ba terminal riêng để chạy từng service khi sử dụng cách này.

Nếu cần khởi chạy trực tiếp bằng Docker Compose thay vì script root:

```powershell

docker compose up --build

```

Lần chạy đầu tiên có thể mất thêm thời gian để tải image, cài đặt dependencies và build các container.

Nếu terminal báo thiếu biến môi trường, lỗi kết nối database hoặc migration, hãy xử lý lỗi đó trước khi kiểm tra giao diện.

### Bước 5. Khởi tạo database bằng Prisma Migration

> Các lệnh dưới đây chạy trong **PowerShell tại thư mục root `brew-lite/`**, khi Docker Desktop và các container đã khởi động. Backend kết nối PostgreSQL qua host `postgres` trong mạng Docker Compose (không phải `localhost`).

Trong `.env` ở root, đặt `DATABASE_URL` theo định dạng:

```dotenv
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=<MAT_KHAU_CUA_BAN>
POSTGRES_DB=brewlite
DATABASE_URL=postgresql://brewlite:<MAT_KHAU_CUA_BAN>@postgres:5432/brewlite?schema=public
```

Đây là ví dụ; thay mật khẩu thật của môi trường development và không commit `.env`. Nếu Docker volume PostgreSQL đã được khởi tạo từ trước, đổi `POSTGRES_PASSWORD` trong `.env` **không tự đổi mật khẩu của role đã tồn tại**.

**5.1. Kiểm tra container**

```powershell
docker compose ps
```

Đảm bảo `postgres` đang healthy và `backend` đang chạy.

**5.2. Kiểm tra trạng thái migration**

```powershell
docker compose exec backend sh -c "cd /app/backend && pnpm exec prisma migrate status"
```

**5.3. Áp dụng các migration đã có trong repository**

```powershell
docker compose exec backend sh -c "cd /app/backend && pnpm exec prisma migrate deploy"
```

`migrate deploy` áp dụng những migration chưa chạy trong `backend/prisma/migrations/`; nó **không tạo migration mới**. Thành viên clone dự án cần dùng lệnh này nếu repo đã có migration. Khi thay đổi cấu trúc schema, người phụ trách database tạo migration mới trong môi trường development rồi commit cùng `schema.prisma`.

**Dự án BrewLite đã có migration trong `backend/prisma/migrations/`, vì vậy sử dụng `migrate deploy` để cập nhật database. Không sử dụng `prisma db push` trong quy trình khởi tạo của dự án này.**

**5.4. Tạo/cập nhật Prisma Client**

```powershell
docker compose exec backend sh -c "cd /app/backend && pnpm exec prisma generate"
```

**5.5. Kiểm tra bảng đã tạo trong PostgreSQL Docker**

```powershell
docker compose exec postgres psql -U brewlite -d brewlite -c "\dt public.*"
```

Bảng `public.products` và các bảng tương ứng trong schema phải tồn tại trước khi seed. Nếu username/database thực tế khác, thay hai giá trị `brewlite` trong câu lệnh trên.

### Bước 6. Chạy seed tạo dữ liệu mẫu

Sau khi `prisma migrate deploy` thành công, chạy `backend/prisma/seed.ts` để thêm dữ liệu phát triển: danh mục, sản phẩm, size, topping, khuyến mãi và phần thưởng (theo nội dung file seed hiện tại).

```powershell
docker compose exec backend sh -c "cd /app/backend && pnpm exec tsx prisma/seed.ts"
```

Lệnh yêu cầu package `tsx` có sẵn trong backend và Prisma Client đã được generate. Nếu backend có cấu hình seed trong `prisma.config.ts`, có thể dùng `pnpm exec prisma db seed` thay thế sau khi xác nhận cấu hình đó.

File seed hiện tại được thiết kế để **cập nhật bản ghi đã có thay vì tạo trùng** khi chạy tuần tự nhiều lần; tuy nhiên có thể ghi đè giá/tồn kho về giá trị mẫu. Không chạy đồng thời nhiều seed process, vì một số model không có unique constraint phù hợp để bảo đảm chống trùng ở cấp database.

**Kiểm tra số lượng sản phẩm và mã khuyến mãi**

```powershell
docker compose exec postgres psql -U brewlite -d brewlite -c "SELECT COUNT(*) FROM public.products;"
docker compose exec postgres psql -U brewlite -d brewlite -c "SELECT COUNT(*) FROM public.promotions;"
```

Lệnh thứ hai giả định bảng khuyến mãi được ánh xạ là `promotions` trong Prisma schema. Nếu seed thành công nhưng menu không có sản phẩm, kiểm tra `is_active = true` và log backend:

```powershell
docker compose logs --tail=100 backend
```

**Thứ tự cần nhớ:** `docker compose up` → `prisma migrate deploy` → `prisma generate` → chạy `seed.ts` → kiểm tra API `/products`.

### Bước 7. Kiểm tra ứng dụng

Khi các service đã khởi động thành công, truy cập:

| Thành phần | Địa chỉ |

|---|---|

| Frontend | http://localhost:3000 |

| Backend API | http://localhost:3001 |
| API menu | http://localhost:3001/products |
| Trang menu | http://localhost:3000/menu |

| PostgreSQL | `localhost:5432` |

Cổng `3001` ở máy host được ánh xạ vào cổng `3000` của container backend theo cấu hình Docker Compose.

Nếu truy cập backend bằng trình duyệt mà không thấy giao diện người dùng, điều đó là bình thường: backend cung cấp API, còn giao diện nằm ở frontend.

---

## 5. Quy trình làm việc hằng ngày

Sau khi đã thiết lập môi trường thành công:

1\. Pull code mới nhất từ nhánh làm việc.

2\. Kiểm tra thay đổi trong `package.json`, lockfile và migration.

3\. Chạy `pnpm install` nếu dependencies thay đổi.

4\. Khởi động dự án bằng `pnpm dev`.

5\. Thực hiện công việc trên nhánh cá nhân hoặc nhánh feature.

6\. Kiểm tra và chạy thử chức năng trước khi commit.

7\. Push code và tạo Pull Request theo quy định của nhóm.

Ví dụ:

```powershell

git pull

pnpm install

pnpm dev

```

Không cần cài đặt lại toàn bộ dự án mỗi lần mở máy nếu môi trường đã được thiết lập và các dependencies vẫn còn đầy đủ.

---

## 6. Lưu ý khi phát triển chung

### Biến môi trường

- Không commit file chứa mật khẩu database, JWT secret hoặc thông tin xác thực.

- Khi thêm biến môi trường mới, cập nhật file `.env.example` tương ứng.

- Không đưa giá trị bí mật thật vào file mẫu.

### Database và Prisma

- Không tự ý chỉnh sửa hoặc xóa các migration đã được nhóm chia sẻ.

- Mỗi thay đổi schema cần có migration mới.

- Commit cả file schema và migration tương ứng.

- Thành viên mới nên áp dụng migration đã có thay vì tự tạo migration `init` mới.

- Không chạy lệnh reset database trên môi trường có dữ liệu quan trọng nếu chưa được nhóm thống nhất.

### Frontend và Backend

- Frontend gọi backend thông qua API URL được cấu hình.

- Không sử dụng URL nội bộ của Docker container trong trình duyệt nếu trình duyệt không thể truy cập URL đó.

- Khi thêm API hoặc thay đổi dữ liệu trả về, cần phối hợp cập nhật cả frontend và backend nếu chức năng có liên quan.

### Git

- Không commit `node_modules/`, `.next/`, `dist/`, file môi trường chứa secret hoặc dữ liệu database phát sinh.

- Giữ nguyên lockfile được quản lý bởi pnpm.

- Không tự ý thay đổi cấu hình Docker hoặc package manager chung khi chưa trao đổi với nhóm.

---

## 7. Xử lý lỗi thường gặp

| Lỗi | Hướng xử lý |

|---|---|

| `pnpm` không được nhận diện | Kiểm tra cài đặt pnpm và PATH, sau đó mở terminal mới |

| Docker daemon không chạy | Mở Docker Desktop và đợi Docker sẵn sàng |

| Port `3000`, `3001` hoặc `5432` đã được sử dụng | Kiểm tra tiến trình đang chiếm cổng hoặc cấu hình cổng |

| Backend không kết nối được PostgreSQL | Kiểm tra `DATABASE_URL`, thông tin database, trạng thái container và network |

| Prisma Client chưa được tạo hoặc không khớp schema | Kiểm tra phiên bản Prisma và cấu hình generator, sau đó chạy lệnh generate phù hợp |

| Database thiếu bảng (`P2021`) | Kiểm tra `DATABASE_URL` trỏ tới PostgreSQL Docker và chạy migration trước khi seed |
| Seed báo lỗi thiếu bảng | Chạy `pnpm exec prisma migrate deploy` trong container backend trước khi seed |
| Menu trống sau khi seed | Kiểm tra dữ liệu `products` và cột `is_active`; thử API `/products` |

| Frontend không gọi được backend | Kiểm tra API URL, trạng thái backend và cấu hình CORS nếu cần |

| Thay đổi code nhưng ứng dụng chưa cập nhật | Kiểm tra log container, trạng thái build và khởi động lại service khi cần |

Một số lệnh kiểm tra Docker hữu ích:

```powershell

docker compose ps

docker compose logs -f

```

Xem log riêng của backend:

```powershell

docker compose logs -f backend

```

Xem log riêng của frontend:

```powershell

docker compose logs -f frontend

```

Dừng các service:

```powershell

docker compose down

```

Lệnh `docker compose down` không xóa volume database nếu không chỉ định tùy chọn xóa volume. Tránh sử dụng `docker compose down -v` khi chưa hiểu rõ hậu quả vì thao tác đó có thể xóa dữ liệu database được lưu trong volume.

---

## 8. Tài liệu dành cho thành viên

- `README.md`: giới thiệu dự án và hướng dẫn chạy nhanh.

- `.env.example`: danh sách biến môi trường cần thiết.

- `docker-compose.yaml` (hoặc tên file Compose thực tế): cấu hình các service Docker.

- `frontend/package.json`: scripts và dependencies frontend.

- `backend/package.json`: scripts và dependencies backend.

- `backend/prisma/schema.prisma`: cấu trúc dữ liệu.

- `backend/prisma/migrations/`: lịch sử thay đổi database.
- `backend/prisma/seed.ts`: dữ liệu mẫu cho môi trường development.

---
