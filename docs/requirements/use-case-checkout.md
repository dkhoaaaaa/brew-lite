# 1.3. Detailed Use Case Specification – Đặt hàng và thanh toán

## 1.3.1. Thông tin tổng quan

| Thuộc tính       | Nội dung                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Use Case ID      | UC-12, UC-13                                                                                          |
| Use Case Name    | Đặt hàng và thanh toán                                                                                |
| Primary Actor    | Khách hàng đã đăng nhập (Logged-in Customer)                                                          |
| Supporting Actor | Hệ thống BrewLite, VNPay Gateway                                                                      |
| Goal             | Khách hàng xác nhận giỏ hàng, áp dụng voucher nếu có, tạo đơn hàng và thực hiện thanh toán qua VNPay. |
| Trigger          | Khách hàng chọn chức năng Đặt hàng từ giỏ hàng.                                                       |
| Priority         | High                                                                                                  |
| Frequency of Use | Thường xuyên, mỗi khi khách hàng thực hiện đặt hàng.                                                  |

## 1.3.2. Mô tả Use Case

Use Case Đặt hàng và thanh toán mô tả quá trình khách hàng đã đăng nhập chuyển từ giỏ hàng sang xác nhận thông tin đặt hàng, tạo đơn hàng và thực hiện thanh toán thông qua VNPay Gateway.

Trước khi đặt hàng, khách hàng có thể xem và quản lý giỏ hàng, kiểm tra thông tin sản phẩm và các tùy chỉnh đã lựa chọn như kích thước (size), topping, lượng đường và lượng đá.

Trong quá trình đặt hàng, khách hàng có thể lựa chọn áp dụng voucher nếu có. Hệ thống kiểm tra tính hợp lệ của voucher và tính toán lại tổng tiền sau ưu đãi.

Sau khi khách hàng xác nhận thông tin, hệ thống kiểm tra sản phẩm, số lượng, giá bán, tồn kho và các dữ liệu liên quan trước khi tạo đơn hàng.

Khi đơn hàng được tạo, hệ thống chuyển khách hàng đến VNPay Gateway để thực hiện thanh toán. VNPay Gateway tiếp nhận yêu cầu, xử lý giao dịch và gửi kết quả thanh toán về hệ thống BrewLite.

Ngoài kết quả trả về từ quá trình thanh toán, hệ thống còn tiếp nhận và xử lý thông báo IPN (Instant Payment Notification) từ VNPay Gateway. Backend kiểm tra chữ ký và thông tin giao dịch trước khi cập nhật trạng thái thanh toán.

Nếu giao dịch được xác nhận thành công, hệ thống cập nhật trạng thái thanh toán và hiển thị thông tin xác nhận đơn hàng cho khách hàng.

## 1.3.3. Preconditions (Điều kiện trước)

1. Khách hàng đã truy cập hệ thống BrewLite.
2. Khách hàng đã đăng nhập thành công.
3. Giỏ hàng có ít nhất một sản phẩm.
4. Các sản phẩm trong giỏ hàng có thông tin hợp lệ.
5. Hệ thống có thể truy cập cơ sở dữ liệu để xử lý thông tin sản phẩm, giỏ hàng, voucher và đơn hàng.
6. Hệ thống đã được cấu hình thông tin kết nối VNPay Sandbox/VNPay Gateway.
7. Khách hàng có thể xem và quản lý giỏ hàng trước khi thực hiện đặt hàng.

**Lưu ý:** Khách vãng lai có thể thêm sản phẩm vào giỏ hàng nhưng phải đăng nhập thành công trước khi thực hiện chức năng đặt hàng và thanh toán.

## 1.3.4. Postconditions (Điều kiện sau)

**Trường hợp thành công:**

1. Hệ thống tạo và lưu đơn hàng với mã đơn hàng duy nhất.
2. Thông tin sản phẩm, tùy chỉnh, số lượng và tổng tiền được lưu trong đơn hàng.
3. Voucher được ghi nhận nếu khách hàng sử dụng voucher hợp lệ.
4. Kết quả thanh toán được xác nhận thành công thông qua quy trình kiểm tra giao dịch.
5. Thông tin IPN được tiếp nhận và xử lý hợp lệ.
6. Trạng thái thanh toán và đơn hàng được cập nhật tương ứng.
7. Hệ thống hiển thị thông tin xác nhận và mã đơn hàng cho khách hàng.

**Trường hợp thanh toán thất bại hoặc bị hủy:**

1. Hệ thống không ghi nhận giao dịch là thanh toán thành công.
2. Kết quả giao dịch được lưu hoặc xử lý theo quy tắc nghiệp vụ.
3. Trạng thái đơn hàng được cập nhật theo quy định của hệ thống.
4. Hệ thống không hiển thị trang xác nhận thanh toán thành công.
5. Khách hàng được thông báo kết quả thanh toán và hướng dẫn xử lý tiếp theo.

## 1.3.5. Main Success Flow (Luồng thành công chính)

| Bước | Tác nhân      | Mô tả hành động                                                         |
| ---- | ------------- | ----------------------------------------------------------------------- |
| 1    | Khách hàng    | Truy cập giỏ hàng và kiểm tra các sản phẩm đã lựa chọn.                 |
| 2    | Hệ thống      | Hiển thị danh sách sản phẩm, số lượng, tùy chỉnh và tổng tiền tạm tính. |
| 3    | Khách hàng    | Kiểm tra thông tin giỏ hàng và chọn chức năng Đặt hàng.                 |
| 4    | Hệ thống      | Kiểm tra trạng thái đăng nhập của khách hàng.                           |
| 5    | Hệ thống      | Nếu khách hàng đã đăng nhập, tiếp tục quy trình đặt hàng.               |
| 6    | Hệ thống      | Hiển thị thông tin sản phẩm, số lượng, tùy chỉnh và tổng tiền.          |
| 7    | Khách hàng    | Kiểm tra thông tin đơn hàng và lựa chọn voucher nếu có.                 |
| 8    | Khách hàng    | Xác nhận áp dụng voucher vào đơn hàng.                                  |
| 9    | Hệ thống      | Kiểm tra tính hợp lệ của voucher và điều kiện sử dụng.                  |
| 10   | Hệ thống      | Tính toán lại tổng tiền sau khi áp dụng voucher.                        |
| 11   | Khách hàng    | Xác nhận thông tin và gửi yêu cầu đặt hàng.                             |
| 12   | Hệ thống      | Kiểm tra tính hợp lệ của sản phẩm, số lượng, giá bán và tồn kho.        |
| 13   | Hệ thống      | Tính tổng tiền cuối cùng của đơn hàng.                                  |
| 14   | Hệ thống      | Tạo đơn hàng và lưu thông tin vào cơ sở dữ liệu.                        |
| 15   | Hệ thống      | Tạo yêu cầu thanh toán và chuyển khách hàng đến VNPay Gateway.          |
| 16   | VNPay Gateway | Tiếp nhận yêu cầu và hiển thị giao diện thanh toán.                     |
| 17   | Khách hàng    | Thực hiện thanh toán qua VNPay Gateway.                                 |
| 18   | VNPay Gateway | Xử lý giao dịch và trả kết quả thanh toán về hệ thống.                  |
| 19   | VNPay Gateway | Gửi thông báo IPN đến hệ thống BrewLite.                                |
| 20   | Hệ thống      | Tiếp nhận và xác thực thông tin IPN, kiểm tra chữ ký và mã giao dịch.   |
| 21   | Hệ thống      | Xác nhận kết quả thanh toán hợp lệ và cập nhật trạng thái đơn hàng.     |
| 22   | Hệ thống      | Hiển thị thông tin xác nhận đơn hàng và mã đơn hàng.                    |
| 23   | Khách hàng    | Xem và nhận thông tin xác nhận đơn hàng.                                |

**Kết quả:** Đơn hàng được tạo, giao dịch thanh toán được xác nhận thành công và khách hàng nhận được thông tin xác nhận đơn hàng.

## 1.3.6. Alternative Flows (Luồng thay thế)

### AF-01 – Khách hàng chưa đăng nhập

1. Tại bước 4 của Main Success Flow, hệ thống phát hiện khách hàng chưa đăng nhập.
2. Hệ thống chuyển khách hàng đến trang đăng nhập.
3. Khách hàng nhập thông tin tài khoản và thực hiện đăng nhập.
4. Hệ thống kiểm tra thông tin xác thực.
5. Nếu đăng nhập thành công, hệ thống chuyển khách hàng quay lại quy trình đặt hàng.
6. Khách hàng tiếp tục thực hiện quy trình.
7. Nếu đăng nhập không thành công, hệ thống thông báo lỗi và yêu cầu khách hàng thực hiện lại.

### AF-02 – Khách hàng thay đổi giỏ hàng trước khi đặt hàng

1. Tại bước 2 của Main Success Flow, khách hàng lựa chọn thay đổi số lượng hoặc xóa sản phẩm.
2. Hệ thống cập nhật thông tin giỏ hàng.
3. Hệ thống tính toán lại tổng tiền.
4. Hệ thống hiển thị giỏ hàng mới nhất.
5. Khách hàng tiếp tục quy trình đặt hàng.

### AF-03 – Khách hàng áp dụng voucher

1. Tại bước 7 của Main Success Flow, khách hàng lựa chọn chức năng áp dụng voucher.
2. Hệ thống hiển thị các voucher khách hàng có thể sử dụng.
3. Khách hàng lựa chọn voucher muốn áp dụng.
4. Hệ thống kiểm tra thời hạn, điều kiện và tính hợp lệ của voucher.
5. Nếu voucher hợp lệ, hệ thống áp dụng ưu đãi và tính toán lại tổng tiền.
6. Khách hàng tiếp tục xác nhận thông tin đặt hàng.
7. Nếu voucher không hợp lệ, hệ thống thông báo lý do và cho phép khách hàng lựa chọn lại.

### AF-04 – Khách hàng đổi điểm thưởng lấy voucher

1. Khách hàng truy cập chức năng xem điểm thưởng.
2. Hệ thống hiển thị số điểm thưởng hiện có.
3. Khách hàng lựa chọn chức năng đổi điểm lấy voucher.
4. Hệ thống kiểm tra số điểm hiện có và điều kiện đổi.
5. Nếu đủ điều kiện, hệ thống thực hiện đổi điểm và cấp voucher.
6. Voucher được lưu vào tài khoản khách hàng.
7. Khách hàng có thể sử dụng voucher trong quá trình đặt hàng nếu đáp ứng điều kiện áp dụng.

### AF-05 – Khách hàng quay lại giỏ hàng

1. Trong quá trình đặt hàng, khách hàng chọn quay lại giỏ hàng.
2. Hệ thống hiển thị lại thông tin giỏ hàng.
3. Khách hàng có thể thay đổi sản phẩm hoặc số lượng.
4. Hệ thống cập nhật thông tin giỏ hàng và tổng tiền.
5. Khách hàng có thể bắt đầu lại quy trình đặt hàng.

### AF-06 – Khách hàng thực hiện thanh toán lại

1. Khách hàng thực hiện thanh toán nhưng giao dịch trước đó không thành công.
2. Hệ thống ghi nhận kết quả giao dịch theo trạng thái trả về từ VNPay.
3. Nếu đơn hàng vẫn đáp ứng điều kiện thanh toán lại, hệ thống cho phép khách hàng thực hiện lại quy trình thanh toán.
4. Hệ thống tạo yêu cầu thanh toán mới theo quy tắc xử lý giao dịch.
5. Khách hàng tiếp tục thanh toán qua VNPay Gateway.

## 1.3.7. Exception Flows (Luồng ngoại lệ)

### EF-01 – Giỏ hàng trống

1. Khách hàng chọn chức năng Đặt hàng khi giỏ hàng không có sản phẩm.
2. Hệ thống kiểm tra và phát hiện giỏ hàng trống.
3. Hệ thống không cho phép tiếp tục đặt hàng.
4. Hệ thống hiển thị thông báo yêu cầu khách hàng thêm sản phẩm vào giỏ hàng.

### EF-02 – Sản phẩm không hợp lệ hoặc không đủ số lượng

1. Khách hàng gửi yêu cầu đặt hàng.
2. Hệ thống kiểm tra tình trạng sản phẩm và số lượng tồn kho.
3. Hệ thống phát hiện một hoặc nhiều sản phẩm không hợp lệ, ngừng kinh doanh hoặc không đủ số lượng.
4. Hệ thống dừng quá trình đặt hàng.
5. Hệ thống không chuyển khách hàng sang thanh toán.
6. Hệ thống thông báo sản phẩm gặp vấn đề và yêu cầu khách hàng cập nhật giỏ hàng.

### EF-03 – Voucher không hợp lệ

1. Khách hàng lựa chọn áp dụng voucher.
2. Hệ thống kiểm tra điều kiện sử dụng.
3. Hệ thống phát hiện voucher hết hạn, không đủ điều kiện hoặc không thuộc quyền sử dụng của khách hàng.
4. Hệ thống từ chối áp dụng voucher.
5. Hệ thống thông báo nguyên nhân và cho phép khách hàng tiếp tục đặt hàng mà không sử dụng voucher hoặc chọn voucher khác.

### EF-04 – Thông tin đặt hàng không hợp lệ

1. Khách hàng gửi thông tin đặt hàng bị thiếu hoặc không hợp lệ.
2. Hệ thống kiểm tra dữ liệu đầu vào.
3. Hệ thống phát hiện thông tin không hợp lệ.
4. Hệ thống không tiếp tục xử lý yêu cầu đặt hàng.
5. Hệ thống hiển thị thông báo để khách hàng bổ sung hoặc sửa thông tin.

### EF-05 – Lỗi kết nối cơ sở dữ liệu

1. Khách hàng gửi yêu cầu đặt hàng.
2. Hệ thống không thể kết nối hoặc truy cập cơ sở dữ liệu.
3. Hệ thống dừng quá trình xử lý yêu cầu.
4. Hệ thống thông báo lỗi và đề nghị khách hàng thử lại sau.
5. Hệ thống không hiển thị đơn hàng là đã tạo thành công khi chưa xác nhận được kết quả lưu dữ liệu.

### EF-06 – Lỗi khi tạo đơn hàng

1. Hệ thống bắt đầu xử lý yêu cầu tạo đơn hàng.
2. Quá trình lưu đơn hàng gặp lỗi.
3. Hệ thống xử lý lỗi và đảm bảo dữ liệu đơn hàng không rơi vào trạng thái không nhất quán.
4. Hệ thống thông báo khách hàng không thể hoàn tất đặt hàng.
5. Khách hàng có thể kiểm tra lại giỏ hàng và thử lại.

### EF-07 – Thanh toán thất bại hoặc bị hủy

1. Khách hàng được chuyển sang VNPay Gateway để thực hiện thanh toán.
2. Giao dịch thanh toán thất bại hoặc khách hàng chủ động hủy giao dịch.
3. VNPay Gateway trả kết quả thất bại hoặc hủy về hệ thống BrewLite.
4. Hệ thống tiếp nhận và kiểm tra kết quả giao dịch.
5. Hệ thống không ghi nhận thanh toán thành công.
6. Hệ thống cập nhật trạng thái đơn hàng theo quy tắc nghiệp vụ đã thống nhất.
7. Hệ thống không hiển thị trang xác nhận thanh toán thành công.
8. Hệ thống thông báo kết quả và hướng dẫn khách hàng xử lý tiếp theo.

### EF-08 – IPN không hợp lệ

1. VNPay Gateway gửi thông báo IPN đến hệ thống BrewLite.
2. Backend tiếp nhận thông báo.
3. Hệ thống kiểm tra chữ ký và thông tin giao dịch.
4. Hệ thống phát hiện dữ liệu không hợp lệ hoặc chữ ký không chính xác.
5. Hệ thống từ chối cập nhật trạng thái thanh toán.
6. Hệ thống ghi nhận thông tin lỗi để phục vụ kiểm tra.

### EF-09 – IPN được gửi lặp

1. VNPay Gateway gửi thông báo IPN cho một giao dịch đã được xử lý.
2. Hệ thống tiếp nhận thông báo.
3. Backend kiểm tra mã giao dịch và trạng thái xử lý trước đó.
4. Hệ thống phát hiện thông báo đã được xử lý.
5. Hệ thống không thực hiện cập nhật trạng thái hoặc trừ dữ liệu lần thứ hai.
6. Hệ thống trả kết quả xử lý phù hợp theo quy tắc tích hợp VNPay.

### EF-10 – Không nhận được kết quả thanh toán

1. Khách hàng hoàn tất thao tác thanh toán trên VNPay Gateway.
2. Hệ thống không nhận được kết quả thanh toán trong khoảng thời gian xử lý dự kiến.
3. Hệ thống không tự động xác định giao dịch là thành công.
4. Hệ thống kiểm tra trạng thái giao dịch bằng cơ chế đối soát hoặc xử lý lại theo quy tắc tích hợp.
5. Hệ thống chỉ cập nhật thanh toán thành công khi có kết quả hợp lệ.

## 1.3.8. Business Rules (Quy tắc nghiệp vụ)

| ID    | Quy tắc                   | Mô tả                                                                                                |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| BR-01 | Giỏ hàng không được trống | Khách hàng chỉ được đặt hàng khi giỏ hàng có ít nhất một sản phẩm.                                   |
| BR-02 | Yêu cầu đăng nhập         | Khách hàng phải đăng nhập trước khi thực hiện đặt hàng và các chức năng yêu cầu xác thực.            |
| BR-03 | Kiểm tra sản phẩm         | Sản phẩm phải tồn tại và còn được phép kinh doanh tại thời điểm xử lý đặt hàng.                      |
| BR-04 | Kiểm tra tùy chỉnh        | Các lựa chọn size, topping, lượng đường và lượng đá phải hợp lệ theo cấu hình sản phẩm.              |
| BR-05 | Kiểm tra tồn kho          | Số lượng sản phẩm đặt mua phải đáp ứng số lượng tồn kho theo quy tắc quản lý kho.                    |
| BR-06 | Tính tổng tiền            | Tổng tiền được tính dựa trên giá sản phẩm, tùy chọn bổ sung, số lượng và ưu đãi hợp lệ.              |
| BR-07 | Điều kiện voucher         | Voucher phải còn hiệu lực và đáp ứng các điều kiện sử dụng của chương trình.                         |
| BR-08 | Đổi điểm thưởng           | Khách hàng chỉ được đổi voucher khi có đủ điểm và đáp ứng điều kiện đổi.                             |
| BR-09 | Tính nhất quán dữ liệu    | Thông tin đơn hàng và chi tiết đơn hàng phải được lưu trữ nhất quán.                                 |
| BR-10 | Trạng thái đơn hàng       | Đơn hàng phải được cập nhật trạng thái phù hợp với kết quả xử lý đặt hàng và thanh toán.             |
| BR-11 | Quyền truy cập            | Khách hàng chỉ được xem và thao tác với dữ liệu đơn hàng thuộc quyền truy cập của mình.              |
| BR-12 | Chống xử lý trùng         | Hệ thống cần hạn chế việc gửi yêu cầu đặt hàng hoặc IPN lặp tạo ra dữ liệu trùng.                    |
| BR-13 | Xác nhận thanh toán       | Chỉ kết quả giao dịch hợp lệ mới được ghi nhận là thanh toán thành công.                             |
| BR-14 | Xử lý IPN                 | Thông báo IPN phải được xác thực trước khi cập nhật trạng thái thanh toán.                           |
| BR-15 | Điều kiện hủy đơn         | Khách hàng chỉ được hủy đơn khi trạng thái đơn hàng đáp ứng điều kiện hủy.                           |
| BR-16 | Xác nhận đơn hàng         | Hệ thống chỉ hiển thị xác nhận thanh toán thành công sau khi kết quả giao dịch được kiểm tra hợp lệ. |

## 1.3.9. Special Requirements (Yêu cầu đặc biệt)

1. Hệ thống cần phản hồi rõ ràng khi yêu cầu đặt hàng thành công hoặc thất bại.
2. Hệ thống cần bảo vệ thông tin tài khoản và dữ liệu đơn hàng của khách hàng.
3. Quá trình tạo đơn hàng cần đảm bảo tính nhất quán của dữ liệu.
4. Hệ thống cần xử lý các yêu cầu gửi lặp để hạn chế phát sinh đơn hàng trùng.
5. Hệ thống cần kiểm tra tính hợp lệ của voucher trước khi áp dụng vào đơn hàng.
6. Chức năng đổi điểm thưởng cần đảm bảo số điểm bị trừ và voucher được cấp chính xác.
7. Quá trình thanh toán sử dụng VNPay Sandbox/VNPay Gateway theo yêu cầu Assignment 2.
8. Hệ thống cần xác thực thông tin trả về từ VNPay trước khi cập nhật trạng thái thanh toán.
9. Thông báo IPN cần được kiểm tra chữ ký và mã giao dịch để đảm bảo tính hợp lệ.
10. Hệ thống cần hạn chế xử lý lặp thông báo IPN gây cập nhật trạng thái nhiều lần.
11. Hệ thống chỉ hiển thị xác nhận thanh toán thành công khi kết quả giao dịch đã được kiểm tra hợp lệ.
12. Các lỗi phát sinh trong quá trình đặt hàng và thanh toán cần được ghi nhận để hỗ trợ kiểm tra và xử lý.

## 1.3.10. Open Issues (Các vấn đề cần xác nhận)

| ID    | Vấn đề cần xác nhận                                                                                    | Người xác nhận |
| ----- | ------------------------------------------------------------------------------------------------------ | -------------- |
| OI-01 | Tồn kho được trừ tại thời điểm tạo đơn hay sau khi thanh toán thành công?                              | PM/BE          |
| OI-02 | Khi thanh toán thất bại hoặc bị hủy, đơn hàng được giữ lại hay tự động hủy?                            | PM/BE          |
| OI-03 | Hệ thống có hỗ trợ khách hàng thanh toán lại trên cùng một đơn hàng không?                             | PM/BE          |
| OI-04 | Quy tắc xử lý khi nhận kết quả thanh toán chậm hoặc IPN được gửi lặp là gì?                            | PM/BE          |
| OI-05 | Tỷ lệ tích điểm và số điểm cần thiết để đổi voucher được quy định như thế nào?                         | PM/BA          |
| OI-06 | Voucher có những điều kiện áp dụng nào như thời hạn, giá trị đơn hàng tối thiểu và số lần sử dụng?     | PM/BA          |
| OI-07 | Khi đổi điểm lấy voucher, điểm thưởng được trừ tại thời điểm yêu cầu đổi hay khi voucher được sử dụng? | PM/BA          |
| OI-08 | Đơn hàng được phép hủy ở những trạng thái nào?                                                         | PM/BA          |
| OI-09 | Khi hủy đơn đã thanh toán, hệ thống xử lý hoàn tiền và hoàn điểm/voucher như thế nào?                  | PM/BA          |
| OI-10 | Khi nhận IPN không hợp lệ hoặc không nhận được IPN, hệ thống thực hiện đối soát và xử lý như thế nào?  | BE             |

Các vấn đề chưa được xác nhận cần được ghi nhận và thống nhất với nhóm trước khi xem tài liệu là đặc tả nghiệp vụ chính thức.
