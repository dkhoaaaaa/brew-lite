# ADR-0006: Đồng bộ vòng đời và trạng thái đơn hàng

## Trạng thái

Accepted

## Bối cảnh

Luồng đặt hàng đi qua frontend Next.js, backend NestJS, PostgreSQL/Prisma và VNPay Sandbox. Trạng thái đơn hàng, giá trị thanh toán và kết quả giao dịch cần nhất quán giữa các thành phần; trang Return của cổng thanh toán không thể tự xác nhận giao dịch thành công.

## Quyết định

- Backend và PostgreSQL là nguồn dữ liệu chính thức cho đơn hàng. Frontend gửi lựa chọn sản phẩm, kích cỡ, topping và số lượng; backend kiểm tra dữ liệu, lấy giá từ database, tính tổng tiền và lưu snapshot các dòng hàng.

- Khi tạo đơn, backend xử lý việc kiểm tra và giữ tồn kho, tạo đơn `PENDING`, ghi lịch sử trạng thái ban đầu và xử lý idempotency trong transaction. Frontend chỉ xóa giỏ hàng và chuyển sang checkout sau khi nhận được đơn hàng đã tạo thành công.

- Trạng thái đơn hàng tuân theo các chuyển tiếp:
  - `PENDING` → `PAID`, `PAYMENT_FAILED` hoặc `CANCELLED`.
  - `PAYMENT_FAILED` → `PAID` hoặc `CANCELLED`.
  - `PAID` → `PREPARING`, `READY` hoặc `COMPLETED`.
  - `PREPARING` → `READY` hoặc `COMPLETED`.
  - `READY` → `COMPLETED`.
  - `COMPLETED` và `CANCELLED` là trạng thái kết thúc.

- Trước khi thanh toán, khách hàng có thể áp dụng hoặc gỡ voucher nếu chưa có giao dịch VNPay đang chờ xử lý. Backend tính lại số tiền; chỉ ghi nhận lượt sử dụng voucher và cộng điểm thành viên sau khi xác nhận thanh toán thành công.

- Backend tạo URL thanh toán VNPay và chỉ cập nhật kết quả thanh toán khi nhận IPN hợp lệ. Return URL chỉ điều hướng người dùng về frontend; trang xác nhận đọc trạng thái từ backend và thăm dò lại khi đơn còn `PENDING`.

- Mỗi lần thay đổi trạng thái được ghi vào `OrderStatusHistory`. Đơn có thời hạn thanh toán; khi hủy hoặc hết hạn, backend hoàn tồn kho. Đơn đã hủy được giữ lại để tra cứu. Giao dịch VNPay hết hạn được giữ thông tin để đối soát callback đến muộn.

- Trong triển khai hiện tại, backend tự đồng bộ các trạng thái sau thanh toán: tiến từ `PAID` sang `PREPARING`, `READY`, rồi `COMPLETED` dựa trên thời gian kể từ lúc thanh toán; tác vụ đồng bộ chạy định kỳ mỗi 15 giây.

## Hệ quả

- Frontend không tự suy diễn hoặc ghi trạng thái thanh toán; mọi màn hình đơn hàng hiển thị dữ liệu lấy từ backend.

- Transaction, idempotency và lịch sử trạng thái giúp hạn chế tạo đơn/trừ kho lặp lại và hỗ trợ theo dõi các lần chuyển trạng thái.

- Cần tiếp tục bảo đảm callback IPN được xác thực và xử lý an toàn với các trường hợp gửi lặp, đến muộn hoặc đơn đã hết hạn.

- Việc tự chuyển trạng thái theo thời gian phù hợp với luồng hiện tại; khi có quy trình vận hành thực tế, cần thay bằng sự kiện cập nhật trạng thái từ nhân viên hoặc hệ thống xử lý đơn.
