# BrewLite – Branching Strategy & Pull Request Workflow

## 1. Tổng quan

Dự án BrewLite sử dụng Git và GitHub để quản lý mã nguồn, theo dõi thay đổi và hỗ trợ làm việc nhóm.

Nhóm tổ chức quản lý mã nguồn theo **Developer Branch Workflow**, trong đó mỗi thành viên có một nhánh Git riêng được đặt theo tên người phụ trách.

Các thay đổi được phát triển trên nhánh cá nhân và tích hợp vào nhánh `main` thông qua Pull Request.

**Repository:** https://github.com/dkhoaaaaa/brew-lite

## 2. Chiến lược quản lý nhánh (Branching Strategy)

### 2.1. Nguyên tắc tổ chức

- `main`: nhánh tích hợp mã nguồn chung của dự án.
- Mỗi thành viên sử dụng một branch riêng để phát triển và chỉnh sửa code.
- Tên branch được đặt theo tên hoặc định danh của thành viên.
- Các thay đổi được tích hợp vào `main` thông qua Pull Request.
- Thành viên đồng bộ branch cá nhân với `main` để cập nhật các thay đổi mới.

### 2.2. Danh sách nhánh

| Branch | Vai trò |
|---|---|
| `main` | Nhánh tích hợp chung |
| `DangKhoa` | Nhánh làm việc cá nhân của Đăng Khoa |
| `LK` | Nhánh làm việc cá nhân của Luân Khang |
| `LuanKhang` | Nhánh làm việc cá nhân của Luân Khang |
| `QuocHuy` | Nhánh làm việc cá nhân của Quốc Huy |
| `TranThao` | Nhánh làm việc cá nhân của Trần Thao |
| `TranThi` | Nhánh làm việc cá nhân của Đình Thi |

Các nhánh trên đã tồn tại trong repository BrewLite.

## 3. Quy trình phát triển và tích hợp mã nguồn

### Bước 1 – Làm việc trên branch cá nhân

Thành viên chuyển sang branch được phân công và thực hiện công việc trên branch đó.

### Bước 2 – Commit thay đổi

Sau khi hoàn thành một phần công việc, thành viên kiểm tra và commit các thay đổi với nội dung rõ ràng.

Ví dụ:

- `feat: add product page`
- `fix: resolve cart calculation`
- `docs: update architecture documentation`

### Bước 3 – Push lên GitHub

Thành viên push các commit từ máy cá nhân lên branch tương ứng trên GitHub.

### Bước 4 – Tạo Pull Request

Khi cần tích hợp thay đổi, thành viên tạo Pull Request với:

- **Base branch:** `main`
- **Compare branch:** branch cá nhân

Pull Request cần mô tả nội dung thay đổi để các thành viên khác có thể kiểm tra.

### Bước 5 – Review và Merge

Nhóm xem xét mã nguồn, kiểm tra xung đột và kết quả kiểm thử liên quan trước khi tích hợp Pull Request vào `main`.

### Bước 6 – Đồng bộ branch

Sau khi các thay đổi được tích hợp, thành viên cập nhật branch cá nhân bằng phiên bản mới nhất từ `main`.

## 4. Quy định Pull Request

Đối với các thay đổi tiếp theo, nhóm áp dụng các quy định:

1. Không push trực tiếp lên `main` đối với thay đổi chức năng thông thường.
2. Pull Request phải có tiêu đề và mô tả rõ ràng.
3. Kiểm tra code và các bài test liên quan trước khi merge.
4. Giải quyết merge conflict nếu có.
5. Chỉ merge sau khi thay đổi đã được kiểm tra.

## 5. Minh chứng từ GitHub

Các minh chứng cho phương pháp quản lý mã nguồn:

**Danh sách branch:**

https://github.com/dkhoaaaaa/brew-lite/branches

**Danh sách Pull Request:**

https://github.com/dkhoaaaaa/brew-lite/pulls?q=is%3Apr

**Ví dụ Pull Request đã merge:**

https://github.com/dkhoaaaaa/brew-lite/pull/40

Các minh chứng này cho thấy repository có các nhánh thành viên và lịch sử tích hợp thay đổi qua Pull Request.

## 6. Kết luận

Việc quản lý nhánh theo tên thành viên giúp nhóm phân chia khu vực làm việc, theo dõi thay đổi của từng người và giảm nguy cơ ảnh hưởng trực tiếp đến nhánh tích hợp chung.

Quy trình Pull Request giúp việc tích hợp mã nguồn có tổ chức và hỗ trợ kiểm tra các thay đổi trước khi đưa vào `main`.
