# BrewLite – Commit Convention & Definition of Done

## 1. Mục đích

Tài liệu quy định cách đặt tên commit và tiêu chí hoàn thành công việc trong dự án BrewLite.

Các quy định giúp nhóm quản lý lịch sử phát triển, theo dõi thay đổi và thống nhất điều kiện hoàn thành các nhiệm vụ trong Assignment 2.

## 2. Commit Convention

### 2.1. Cấu trúc commit message

Quy ước sử dụng:

`<type>: <description>`

Trong đó:

- `type`: loại thay đổi.
- `description`: mô tả ngắn gọn nội dung commit.

### 2.2. Các loại commit

| Type | Ý nghĩa |
|---|---|
| `feat` | Phát triển chức năng |
| `fix` | Sửa lỗi |
| `docs` | Cập nhật tài liệu |
| `refactor` | Tái cấu trúc mã nguồn |
| `test` | Thêm hoặc chỉnh sửa kiểm thử |
| `chore` | Cập nhật cấu hình, công cụ và công việc bảo trì |

### 2.3. Ví dụ commit

```text
feat: add product menu
fix: resolve checkout validation
docs: add branching strategy
test: add orders service tests
chore: update docker configuration
```

### 2.4. Nguyên tắc

1. Commit message phải mô tả rõ thay đổi.
2. Không gộp nhiều công việc không liên quan vào một commit nếu có thể tách riêng.
3. Commit được thực hiện trên branch của thành viên.
4. Các thay đổi được tích hợp vào `main` thông qua Pull Request.
5. Không đưa mật khẩu, API keys hoặc thông tin bí mật vào commit.

Quy ước này được sử dụng để thống nhất các thay đổi tiếp theo trong Assignment 2. Lịch sử commit từ Assignment 1 được giữ nguyên.

## 3. Definition of Done (DoD)

Definition of Done là tập hợp tiêu chí xác định khi nào một công việc được xem là hoàn thành.

Một backlog item được đánh dấu Done khi đáp ứng các điều kiện phù hợp sau:

### 3.1. Hoàn thành chức năng

- Chức năng đáp ứng các tiêu chí chấp nhận đã xác định.
- Các luồng xử lý chính hoạt động đúng.
- Không còn lỗi nghiêm trọng đã biết trong phạm vi công việc.

### 3.2. Chất lượng mã nguồn

- Code tuân thủ cấu trúc hiện có của dự án.
- Không chứa mã thử nghiệm hoặc debug không cần thiết.
- Các bài kiểm thử liên quan đã được chạy và đạt yêu cầu.

### 3.3. Quản lý phiên bản

- Code được commit lên nhánh phù hợp.
- Có Pull Request hoặc bằng chứng tích hợp thay đổi vào nhánh chung.
- Các xung đột mã nguồn đã được giải quyết.
- Thay đổi đã được kiểm tra trước khi merge.

### 3.4. Tài liệu

- README hoặc tài liệu liên quan được cập nhật nếu thay đổi ảnh hưởng đến cách sử dụng hay vận hành.
- Các quyết định kiến trúc quan trọng được ghi nhận bằng ADR khi cần.

## 4. Quy trình xác nhận hoàn thành

1. Thành viên thực hiện công việc và kiểm tra tiêu chí chấp nhận.
2. Chạy các bài kiểm thử liên quan.
3. Commit và push lên nhánh cá nhân.
4. Tạo Pull Request khi cần tích hợp.
5. Review và merge sau khi đáp ứng yêu cầu.
6. Cập nhật trạng thái Issue thành Done.

## 5. Áp dụng cho BrewLite

BrewLite sử dụng:

- Next.js cho frontend.
- NestJS cho backend.
- Prisma ORM và PostgreSQL.
- Docker Compose để chạy các thành phần.
- GitHub để quản lý mã nguồn và Pull Request.

Các công việc đã có từ Assignment 1 cần được đối chiếu với tiêu chí chấp nhận của Assignment 2 trước khi xác nhận hoàn thành.

## 6. Kết luận

Commit Convention giúp lịch sử mã nguồn nhất quán và dễ theo dõi.

Definition of Done giúp nhóm có tiêu chí chung để xác nhận chất lượng công việc và hạn chế đánh dấu hoàn thành khi chưa kiểm tra đầy đủ.
