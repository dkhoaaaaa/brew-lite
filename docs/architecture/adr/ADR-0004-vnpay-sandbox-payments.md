# ADR-0004: Tích hợp VNPay Sandbox cho thanh toán

## Trạng thái

Accepted

## Bối cảnh

Brew Lite cần kiểm thử luồng thanh toán đơn hàng mà chưa xử lý giao dịch tiền thật.

## Quyết định

Tích hợp VNPay Sandbox. PaymentsService tạo URL thanh toán; backend xử lý các endpoint IPN và Return callback.

## Hệ quả

- Nhóm có thể kiểm thử luồng tích hợp thanh toán trong môi trường Sandbox.

- Sandbox không đại diện cho giao dịch production.

- Khi chuyển sang môi trường thật, cần cấu hình thông tin VNPay production và kiểm thử lại callback.

- Các khóa và thông tin xác thực phải được quản lý bằng cấu hình bảo mật, không commit vào repository.
