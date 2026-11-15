# 1.2. Software Requirements Specification (SRS)

## 1.2.1. Giới thiệu

### 1.2.1.1. Mục đích tài liệu

Tài liệu Software Requirements Specification (SRS) mô tả các yêu cầu chức năng và phi chức năng của hệ thống BrewLite. Tài liệu được sử dụng làm cơ sở để nhóm phát triển phân tích, thiết kế, lập trình, kiểm thử và đánh giá mức độ đáp ứng của hệ thống đối với các yêu cầu nghiệp vụ.

Các yêu cầu trong tài liệu được xây dựng dựa trên hai sơ đồ Use Case BrewLite, bao gồm sơ đồ Use Case tổng quát và sơ đồ Use Case đặt hàng, thanh toán.

Nội dung tập trung vào các chức năng xem thực đơn, xem chi tiết sản phẩm, tùy chỉnh đồ uống, quản lý giỏ hàng, đăng ký, đăng nhập, quản lý điểm thưởng, voucher, đặt hàng, thanh toán qua VNPay và quản lý đơn hàng.

### 1.2.1.2. Phạm vi hệ thống

BrewLite là hệ thống hỗ trợ khách hàng đặt đồ uống trực tuyến. Hệ thống cung cấp các chức năng chính:

- Đăng ký, đăng nhập và đăng xuất tài khoản.
- Xem thực đơn và danh sách đồ uống.
- Xem chi tiết sản phẩm.
- Tùy chỉnh đồ uống theo size, topping, lượng đường và lượng đá.
- Thêm sản phẩm vào giỏ hàng.
- Xem và quản lý giỏ hàng.
- Xem điểm thưởng hiện có.
- Đổi điểm thưởng lấy voucher.
- Áp dụng voucher vào đơn hàng.
- Đặt hàng và tạo đơn hàng.
- Thanh toán trực tuyến qua VNPay Gateway.
- Tiếp nhận và xử lý thông báo IPN từ VNPay.
- Xem xác nhận đơn hàng.
- Xem lịch sử đơn hàng.
- Theo dõi tiến trình đơn hàng.
- Hủy đơn hàng theo điều kiện nghiệp vụ.

Hệ thống phân biệt ba trạng thái người dùng:

**Khách vãng lai (Guest):**

Người dùng chưa đăng nhập. Có thể xem thực đơn, xem chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng, đăng ký tài khoản và đăng nhập.

**Khách hàng (General Customer):**

Đại diện cho người dùng sử dụng các chức năng chung của hệ thống như xem thực đơn, xem chi tiết sản phẩm và quản lý giỏ hàng.

**Khách hàng đã đăng nhập (Logged-in Customer):**

Người dùng đã xác thực thành công. Có thể sử dụng các chức năng chung và các chức năng yêu cầu đăng nhập như xem điểm thưởng, đổi điểm lấy voucher, áp dụng voucher, đặt hàng, thanh toán, xem lịch sử, theo dõi tiến trình và hủy đơn hàng.

VNPay Gateway là tác nhân bên ngoài tham gia vào quy trình thanh toán và gửi thông báo IPN đến hệ thống BrewLite.

### 1.2.1.3. Đối tượng sử dụng tài liệu

- **PM:** Xác nhận phạm vi, mức độ ưu tiên và các yêu cầu nghiệp vụ.
- **BA:** Phân tích, đặc tả và quản lý yêu cầu.
- **Frontend Developer:** Phát triển giao diện và tương tác phía khách hàng.
- **Backend Developer:** Phát triển API, xử lý nghiệp vụ, dữ liệu và tích hợp VNPay.
- **QA/Tester:** Xây dựng và thực hiện các trường hợp kiểm thử dựa trên yêu cầu.

## 1.2.2. Yêu cầu chức năng (Functional Requirements)

Yêu cầu chức năng mô tả các hoạt động mà hệ thống BrewLite cần cung cấp để đáp ứng nhu cầu của khách hàng theo hai sơ đồ Use Case.

### 1.2.2.1. Danh sách yêu cầu chức năng

| ID    | Tên yêu cầu                  | Mô tả yêu cầu                                                                                                   | Mức độ ưu tiên |
| ----- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------- |
| FR-01 | Đăng ký tài khoản            | Hệ thống cho phép khách vãng lai tạo tài khoản mới bằng cách cung cấp các thông tin cần thiết.                  | Must           |
| FR-02 | Đăng nhập                    | Hệ thống cho phép khách vãng lai đăng nhập để chuyển sang trạng thái khách hàng đã đăng nhập.                   | Must           |
| FR-03 | Đăng xuất                    | Hệ thống cho phép khách hàng đã đăng nhập đăng xuất khỏi tài khoản.                                             | Must           |
| FR-04 | Xem thực đơn                 | Hệ thống hiển thị thực đơn và danh sách đồ uống đang được cung cấp.                                             | Must           |
| FR-05 | Xem chi tiết sản phẩm        | Hệ thống hiển thị thông tin chi tiết, giá bán và các tùy chọn của sản phẩm.                                     | Must           |
| FR-06 | Thêm sản phẩm vào giỏ hàng   | Hệ thống cho phép khách hàng thêm sản phẩm đã lựa chọn vào giỏ hàng.                                            | Must           |
| FR-07 | Tùy chỉnh đồ uống            | Hệ thống cho phép lựa chọn size, topping, lượng đường và lượng đá cho sản phẩm.                                 | Must           |
| FR-08 | Xem và quản lý giỏ hàng      | Hệ thống cho phép khách hàng xem các sản phẩm đã thêm và quản lý thông tin giỏ hàng.                            | Must           |
| FR-09 | Xem điểm thưởng              | Hệ thống cho phép khách hàng đã đăng nhập xem số điểm thưởng hiện có.                                           | Must           |
| FR-10 | Đổi điểm thưởng lấy voucher  | Hệ thống cho phép khách hàng sử dụng điểm thưởng để đổi lấy voucher theo quy định.                              | Must           |
| FR-11 | Áp dụng voucher              | Hệ thống cho phép khách hàng áp dụng voucher hợp lệ trong quá trình đặt hàng và thanh toán.                     | Must           |
| FR-12 | Đặt hàng                     | Hệ thống cho phép khách hàng xác nhận thông tin và tạo đơn hàng sau khi kiểm tra dữ liệu hợp lệ.                | Must           |
| FR-13 | Thanh toán qua VNPay         | Hệ thống tích hợp VNPay Gateway để khách hàng thực hiện thanh toán trực tuyến và nhận kết quả giao dịch.        | Must           |
| FR-14 | Xem xác nhận đơn hàng        | Hệ thống hiển thị thông tin xác nhận và mã đơn hàng sau khi thanh toán thành công.                              | Must           |
| FR-15 | Xem lịch sử đơn hàng         | Hệ thống cho phép khách hàng đã đăng nhập xem danh sách các đơn hàng đã đặt.                                    | Must           |
| FR-16 | Theo dõi tiến trình đơn hàng | Hệ thống cho phép khách hàng theo dõi trạng thái xử lý của đơn hàng.                                            | Must           |
| FR-17 | Hủy đơn hàng                 | Hệ thống cho phép khách hàng thực hiện hủy đơn hàng khi đáp ứng điều kiện nghiệp vụ.                            | Must           |
| FR-18 | Tiếp nhận và xử lý IPN       | Hệ thống tiếp nhận thông báo IPN từ VNPay Gateway, xác thực thông tin giao dịch và cập nhật kết quả thanh toán. | Must           |

### 1.2.2.2. Mô tả chi tiết các yêu cầu chức năng

**FR-01 – Đăng ký tài khoản**

Hệ thống cho phép khách vãng lai tạo tài khoản mới. Thông tin đăng ký phải được kiểm tra tính hợp lệ trước khi lưu vào cơ sở dữ liệu.

**FR-02 – Đăng nhập**

Hệ thống cho phép khách vãng lai nhập thông tin tài khoản để xác thực. Khi đăng nhập thành công, người dùng được chuyển sang trạng thái khách hàng đã đăng nhập.

**FR-03 – Đăng xuất**

Hệ thống cho phép khách hàng đã đăng nhập kết thúc phiên sử dụng và chuyển về trạng thái chưa đăng nhập.

**FR-04 – Xem thực đơn**

Hệ thống hiển thị danh sách đồ uống, tên sản phẩm và các thông tin cơ bản để khách hàng lựa chọn. Chức năng được cung cấp cho khách vãng lai và khách hàng đã đăng nhập.

**FR-05 – Xem chi tiết sản phẩm**

Hệ thống hiển thị thông tin chi tiết của sản phẩm được lựa chọn, bao gồm tên, hình ảnh, giá bán và các tùy chọn đi kèm nếu có.

**FR-06 – Thêm sản phẩm vào giỏ hàng**

Hệ thống cho phép khách hàng lựa chọn sản phẩm và thêm vào giỏ hàng. Thông tin sản phẩm và tùy chỉnh cần được lưu chính xác.

**FR-07 – Tùy chỉnh đồ uống**

Hệ thống cho phép khách hàng lựa chọn các tùy chỉnh gồm kích thước, topping, lượng đường và lượng đá trước khi hoàn tất thao tác thêm sản phẩm vào giỏ hàng.

**FR-08 – Xem và quản lý giỏ hàng**

Hệ thống hiển thị danh sách sản phẩm đã thêm vào giỏ hàng, bao gồm thông tin sản phẩm, tùy chỉnh và số lượng. Khách hàng có thể kiểm tra và điều chỉnh giỏ hàng theo chức năng được hỗ trợ.

**FR-09 – Xem điểm thưởng**

Hệ thống cho phép khách hàng đã đăng nhập xem số điểm thưởng hiện có trong tài khoản.

**FR-10 – Đổi điểm thưởng lấy voucher**

Hệ thống cho phép khách hàng sử dụng điểm thưởng để đổi voucher. Trước khi thực hiện đổi, hệ thống phải kiểm tra số điểm hiện có và điều kiện đổi điểm.

**FR-11 – Áp dụng voucher**

Hệ thống cho phép khách hàng lựa chọn voucher để áp dụng vào đơn hàng. Hệ thống cần kiểm tra tính hợp lệ, điều kiện sử dụng và giá trị ưu đãi của voucher.

**FR-12 – Đặt hàng**

Hệ thống cho phép khách hàng đã đăng nhập xác nhận thông tin đặt hàng. Backend kiểm tra sản phẩm, tùy chỉnh, số lượng, giá bán, tồn kho và voucher nếu có trước khi tạo đơn hàng.

**FR-13 – Thanh toán qua VNPay**

Hệ thống tạo yêu cầu thanh toán và chuyển khách hàng đến VNPay Gateway. Sau khi khách hàng thực hiện giao dịch, hệ thống tiếp nhận kết quả và kiểm tra tính hợp lệ của giao dịch.

**FR-14 – Xem xác nhận đơn hàng**

Hệ thống hiển thị thông tin xác nhận và mã đơn hàng khi kết quả thanh toán được xác nhận thành công.

**FR-15 – Xem lịch sử đơn hàng**

Hệ thống cho phép khách hàng đã đăng nhập xem danh sách các đơn hàng đã đặt thuộc tài khoản của mình.

**FR-16 – Theo dõi tiến trình đơn hàng**

Hệ thống hiển thị trạng thái hiện tại của đơn hàng để khách hàng theo dõi quá trình xử lý.

**FR-17 – Hủy đơn hàng**

Hệ thống cho phép khách hàng gửi yêu cầu hủy đơn hàng. Yêu cầu chỉ được chấp nhận khi đơn hàng đáp ứng điều kiện hủy theo quy định nghiệp vụ.

**FR-18 – Tiếp nhận và xử lý IPN**

Hệ thống tiếp nhận thông báo IPN từ VNPay Gateway. Backend kiểm tra chữ ký và các thông tin giao dịch, xác định tính hợp lệ, tránh xử lý trùng lặp và cập nhật trạng thái thanh toán tương ứng.

### 1.2.2.3. Tiêu chí chấp nhận (Acceptance Criteria)

Các tiêu chí chấp nhận được mô tả theo cấu trúc Given – When – Then:

- **Given:** Điều kiện ban đầu.
- **When:** Hành động được thực hiện.
- **Then:** Kết quả hệ thống cần đạt được.

**FR-01 – Đăng ký tài khoản**

- Given: Khách vãng lai chưa có tài khoản.
- When: Khách hàng nhập đầy đủ thông tin hợp lệ và gửi yêu cầu đăng ký.
- Then: Hệ thống tạo tài khoản mới và thông báo kết quả.
- Given: Thông tin định danh đã được sử dụng.
- When: Khách hàng gửi yêu cầu đăng ký.
- Then: Hệ thống thông báo thông tin đã tồn tại và không tạo tài khoản trùng lặp.

**FR-02 – Đăng nhập**

- Given: Khách hàng đã có tài khoản hợp lệ.
- When: Khách hàng nhập đúng thông tin đăng nhập.
- Then: Hệ thống xác thực và chuyển người dùng sang trạng thái đã đăng nhập.
- Given: Thông tin đăng nhập không hợp lệ.
- When: Khách hàng gửi yêu cầu đăng nhập.
- Then: Hệ thống từ chối đăng nhập và hiển thị thông báo phù hợp.

**FR-03 – Đăng xuất**

- Given: Khách hàng đang đăng nhập.
- When: Khách hàng chọn chức năng Đăng xuất.
- Then: Hệ thống kết thúc phiên đăng nhập và chuyển người dùng về trạng thái chưa đăng nhập.

**FR-04 – Xem thực đơn**

- Given: Khách vãng lai hoặc khách hàng đã đăng nhập truy cập hệ thống.
- When: Người dùng chọn chức năng xem thực đơn.
- Then: Hệ thống hiển thị danh sách đồ uống đang được cung cấp.
- Given: Danh sách sản phẩm trống.
- When: Người dùng truy cập thực đơn.
- Then: Hệ thống hiển thị trạng thái danh sách trống phù hợp.

**FR-05 – Xem chi tiết sản phẩm**

- Given: Người dùng đang xem thực đơn.
- When: Người dùng chọn một sản phẩm.
- Then: Hệ thống hiển thị thông tin chi tiết và các tùy chọn của sản phẩm.

**FR-06 – Thêm sản phẩm vào giỏ hàng**

- Given: Khách hàng đã chọn một sản phẩm hợp lệ.
- When: Khách hàng thực hiện thêm sản phẩm vào giỏ hàng.
- Then: Hệ thống lưu sản phẩm vào giỏ hàng và cập nhật thông tin tương ứng.

**FR-07 – Tùy chỉnh đồ uống**

- Given: Khách hàng đang lựa chọn một sản phẩm.
- When: Khách hàng chọn size, topping, lượng đường và lượng đá.
- Then: Hệ thống ghi nhận các tùy chọn của sản phẩm.
- Given: Khách hàng chưa hoàn thành các lựa chọn bắt buộc.
- When: Khách hàng xác nhận tùy chỉnh.
- Then: Hệ thống yêu cầu bổ sung thông tin còn thiếu.

**FR-08 – Xem và quản lý giỏ hàng**

- Given: Khách hàng đã thêm sản phẩm vào giỏ hàng.
- When: Khách hàng chọn xem giỏ hàng.
- Then: Hệ thống hiển thị danh sách sản phẩm và thông tin tùy chỉnh tương ứng.
- Given: Giỏ hàng có sản phẩm.
- When: Khách hàng thay đổi số lượng hoặc thực hiện thao tác quản lý được hỗ trợ.
- Then: Hệ thống cập nhật thông tin giỏ hàng và tổng tiền tương ứng.

**FR-09 – Xem điểm thưởng**

- Given: Khách hàng đã đăng nhập.
- When: Khách hàng chọn chức năng xem điểm thưởng.
- Then: Hệ thống hiển thị số điểm thưởng hiện có.

**FR-10 – Đổi điểm thưởng lấy voucher**

- Given: Khách hàng đã đăng nhập và có số điểm đáp ứng điều kiện đổi.
- When: Khách hàng chọn đổi điểm lấy voucher.
- Then: Hệ thống kiểm tra điều kiện, trừ điểm theo quy định và cấp voucher hợp lệ.
- Given: Khách hàng không đủ điểm.
- When: Khách hàng gửi yêu cầu đổi điểm.
- Then: Hệ thống từ chối giao dịch và thông báo phù hợp.

**FR-11 – Áp dụng voucher**

- Given: Khách hàng đã đăng nhập và có voucher hợp lệ.
- When: Khách hàng chọn áp dụng voucher vào đơn hàng.
- Then: Hệ thống kiểm tra điều kiện và tính toán giá trị ưu đãi.
- Given: Voucher hết hạn hoặc không đáp ứng điều kiện.
- When: Khách hàng áp dụng voucher.
- Then: Hệ thống từ chối áp dụng và thông báo lý do.

**FR-12 – Đặt hàng**

- Given: Khách hàng đã đăng nhập và có giỏ hàng hợp lệ.
- When: Khách hàng xác nhận đặt hàng.
- Then: Hệ thống kiểm tra thông tin sản phẩm, số lượng, giá bán, tồn kho và tạo đơn hàng nếu dữ liệu hợp lệ.
- Given: Khách hàng chưa đăng nhập.
- When: Khách hàng gửi yêu cầu đặt hàng.
- Then: Hệ thống yêu cầu đăng nhập trước khi tiếp tục.
- Given: Giỏ hàng trống hoặc sản phẩm không hợp lệ.
- When: Khách hàng gửi yêu cầu đặt hàng.
- Then: Hệ thống từ chối tạo đơn hàng và hiển thị thông báo phù hợp.

**FR-13 – Thanh toán qua VNPay**

- Given: Khách hàng có đơn hàng đang chờ thanh toán.
- When: Khách hàng chọn thanh toán qua VNPay.
- Then: Hệ thống tạo yêu cầu thanh toán hợp lệ và chuyển khách hàng đến VNPay Gateway.
- Given: Giao dịch thanh toán thất bại hoặc bị hủy.
- When: VNPay trả kết quả về hệ thống.
- Then: Hệ thống không ghi nhận thanh toán thành công.

**FR-14 – Xem xác nhận đơn hàng**

- Given: Đơn hàng đã được thanh toán thành công và kết quả được xác thực.
- When: Khách hàng truy cập thông tin xác nhận.
- Then: Hệ thống hiển thị mã đơn hàng và thông tin xác nhận tương ứng.

**FR-15 – Xem lịch sử đơn hàng**

- Given: Khách hàng đã đăng nhập và có đơn hàng trước đó.
- When: Khách hàng truy cập lịch sử đơn hàng.
- Then: Hệ thống hiển thị danh sách đơn hàng thuộc tài khoản của khách hàng.

**FR-16 – Theo dõi tiến trình đơn hàng**

- Given: Khách hàng đã đăng nhập và có đơn hàng.
- When: Khách hàng chọn theo dõi tiến trình đơn hàng.
- Then: Hệ thống hiển thị trạng thái xử lý hiện tại của đơn hàng.

**FR-17 – Hủy đơn hàng**

- Given: Khách hàng đã đăng nhập và có đơn hàng đáp ứng điều kiện hủy.
- When: Khách hàng chọn hủy đơn hàng.
- Then: Hệ thống xử lý yêu cầu hủy và cập nhật trạng thái đơn hàng.
- Given: Đơn hàng không đáp ứng điều kiện hủy.
- When: Khách hàng gửi yêu cầu hủy.
- Then: Hệ thống từ chối yêu cầu và thông báo lý do phù hợp.

**FR-18 – Tiếp nhận và xử lý IPN**

- Given: VNPay Gateway gửi thông báo IPN đến hệ thống.
- When: Backend tiếp nhận thông báo.
- Then: Hệ thống xác thực chữ ký, kiểm tra thông tin giao dịch và cập nhật trạng thái thanh toán nếu dữ liệu hợp lệ.
- Given: Thông báo IPN không hợp lệ hoặc đã được xử lý trước đó.
- When: Hệ thống tiếp nhận thông báo.
- Then: Hệ thống không cập nhật sai trạng thái giao dịch và xử lý theo cơ chế chống trùng.

## 1.2.3. Yêu cầu phi chức năng (Non-Functional Requirements)

| ID     | Nhóm yêu cầu          | Mô tả yêu cầu                                                                                            | Mức độ ưu tiên |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------- | -------------- |
| NFR-01 | Hiệu năng             | Các trang và chức năng chính cần phản hồi trong thời gian phù hợp, tránh để người dùng phải chờ quá lâu. | Must           |
| NFR-02 | Bảo mật               | Hệ thống phải xác thực người dùng trước khi cho phép truy cập các chức năng yêu cầu đăng nhập.           | Must           |
| NFR-03 | Bảo mật dữ liệu       | Mật khẩu người dùng phải được lưu trữ dưới dạng đã băm, không lưu mật khẩu dạng văn bản thuần.           | Must           |
| NFR-04 | Tính toàn vẹn dữ liệu | Thông tin đơn hàng, chi tiết đơn hàng, điểm thưởng, voucher và thanh toán phải được lưu trữ nhất quán.   | Must           |
| NFR-05 | Khả năng sử dụng      | Giao diện cần rõ ràng, dễ hiểu và hỗ trợ khách hàng hoàn thành quy trình mua hàng.                       | Must           |
| NFR-06 | Khả năng tương thích  | Giao diện cần hoạt động trên các trình duyệt phổ biến và kích thước màn hình thông dụng.                 | Should         |
| NFR-07 | Khả năng bảo trì      | Source code cần được tổ chức theo module, dễ đọc và thuận tiện cho việc sửa đổi, mở rộng.                | Should         |
| NFR-08 | Độ tin cậy            | Hệ thống cần xử lý lỗi hợp lý, cung cấp thông báo phù hợp và hạn chế mất dữ liệu khi xảy ra lỗi.         | Must           |
| NFR-09 | Bảo mật thanh toán    | Thông tin trả về từ VNPay cần được xác thực trước khi cập nhật trạng thái thanh toán.                    | Must           |
| NFR-10 | Chống xử lý trùng     | Hệ thống cần hạn chế việc xử lý lặp thông báo IPN hoặc yêu cầu thanh toán gây sai lệch dữ liệu.          | Must           |

Các yêu cầu trên là mục tiêu chất lượng đề xuất cho MVP. Những chỉ số định lượng như thời gian phản hồi, số lượng người dùng đồng thời và tỷ lệ khả dụng cần được nhóm thống nhất trước khi nghiệm thu.

## 1.2.4. Danh sách Use Case tổng quát

Danh sách Use Case mô tả các chức năng chính mà tác nhân có thể thực hiện khi tương tác với hệ thống BrewLite.

### 1.2.4.1. Các tác nhân trong hệ thống

| Tác nhân                                     | Mô tả                                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Khách vãng lai (Guest)                       | Người dùng chưa đăng nhập, có thể xem thực đơn, xem chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng, đăng ký và đăng nhập. |
| Khách hàng (General Customer)                | Tác nhân tổng quát đại diện cho người dùng sử dụng các chức năng chung của BrewLite.                                     |
| Khách hàng đã đăng nhập (Logged-in Customer) | Người dùng đã xác thực thành công, được sử dụng các chức năng yêu cầu đăng nhập.                                         |
| VNPay Gateway                                | Hệ thống bên ngoài tiếp nhận yêu cầu thanh toán và gửi kết quả giao dịch/IPN về BrewLite.                                |

Trong sơ đồ Use Case, Khách vãng lai và Khách hàng đã đăng nhập được thể hiện là các tác nhân chuyên biệt kế thừa từ tác nhân Khách hàng (General Customer).

### 1.2.4.2. Danh sách Use Case tổng quát

| ID    | Tên Use Case                 | Tác nhân chính                         | Mô tả                                                           |
| ----- | ---------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| UC-01 | Đăng ký                      | Khách vãng lai                         | Tạo tài khoản mới để sử dụng hệ thống.                          |
| UC-02 | Đăng nhập                    | Khách vãng lai                         | Xác thực tài khoản để truy cập các chức năng yêu cầu đăng nhập. |
| UC-03 | Đăng xuất                    | Khách hàng đã đăng nhập                | Kết thúc phiên sử dụng tài khoản.                               |
| UC-04 | Xem thực đơn                 | Khách hàng                             | Xem danh sách đồ uống đang được cung cấp.                       |
| UC-05 | Xem chi tiết sản phẩm        | Khách hàng                             | Xem thông tin chi tiết và các tùy chọn của sản phẩm.            |
| UC-06 | Thêm sản phẩm vào giỏ hàng   | Khách hàng                             | Thêm sản phẩm đã lựa chọn vào giỏ hàng.                         |
| UC-07 | Tùy chỉnh đồ uống            | Khách hàng                             | Chọn size, topping, lượng đường và lượng đá.                    |
| UC-08 | Xem và quản lý giỏ hàng      | Khách hàng                             | Xem và quản lý các sản phẩm đã thêm vào giỏ hàng.               |
| UC-09 | Xem điểm thưởng              | Khách hàng đã đăng nhập                | Xem số điểm thưởng hiện có.                                     |
| UC-10 | Đổi điểm thưởng lấy voucher  | Khách hàng đã đăng nhập                | Sử dụng điểm thưởng để đổi voucher.                             |
| UC-11 | Áp dụng voucher              | Khách hàng đã đăng nhập                | Áp dụng voucher hợp lệ vào đơn hàng.                            |
| UC-12 | Đặt hàng                     | Khách hàng đã đăng nhập                | Xác nhận thông tin và tạo đơn hàng.                             |
| UC-13 | Thanh toán qua VNPay         | Khách hàng đã đăng nhập, VNPay Gateway | Thực hiện thanh toán trực tuyến qua VNPay.                      |
| UC-14 | Xem xác nhận đơn hàng        | Khách hàng đã đăng nhập                | Xem thông tin xác nhận sau khi thanh toán thành công.           |
| UC-15 | Xem lịch sử đơn hàng         | Khách hàng đã đăng nhập                | Xem danh sách đơn hàng đã đặt.                                  |
| UC-16 | Theo dõi tiến trình đơn hàng | Khách hàng đã đăng nhập                | Theo dõi trạng thái xử lý đơn hàng.                             |
| UC-17 | Hủy đơn hàng                 | Khách hàng đã đăng nhập                | Gửi yêu cầu hủy đơn hàng theo điều kiện cho phép.               |
| UC-18 | Tiếp nhận và xử lý IPN       | VNPay Gateway, hệ thống BrewLite       | Tiếp nhận, xác thực và xử lý thông báo thanh toán từ VNPay.     |

### 1.2.4.3. Quan hệ giữa các Use Case

Các quan hệ giữa Use Case được xác định theo hai sơ đồ đã xây dựng:

1. **UC-06 – Thêm sản phẩm vào giỏ hàng** có quan hệ `<<include>>` với UC-07 – Tùy chỉnh đồ uống. Việc tùy chỉnh sản phẩm là một bước được thực hiện trong quá trình thêm sản phẩm vào giỏ hàng theo sơ đồ.

2. **UC-13 – Thanh toán qua VNPay** có quan hệ `<<include>>` với UC-14 – Xem xác nhận đơn hàng. Sau khi thanh toán thành công, hệ thống thực hiện bước xác nhận đơn hàng.

3. **UC-11 – Áp dụng voucher** có quan hệ `<<extend>>` với UC-13 – Thanh toán qua VNPay. Đây là chức năng mở rộng, được thực hiện khi khách hàng có nhu cầu sử dụng voucher.

4. **UC-10 – Đổi điểm thưởng lấy voucher** có quan hệ `<<extend>>` với UC-09 – Xem điểm thưởng theo sơ đồ tổng quát. Khách hàng có thể thực hiện đổi điểm khi sử dụng chức năng điểm thưởng.

5. **UC-16 – Theo dõi tiến trình đơn hàng** có quan hệ `<<extend>>` với UC-15 – Xem lịch sử đơn hàng.

6. **UC-17 – Hủy đơn hàng** có quan hệ `<<extend>>` với UC-15 – Xem lịch sử đơn hàng.

7. **UC-18 – Tiếp nhận và xử lý IPN** là chức năng tương tác giữa VNPay Gateway và hệ thống BrewLite trong quá trình xử lý thanh toán.

### 1.2.4.4. Quy tắc phân quyền tác nhân

- Khách vãng lai có thể đăng ký, đăng nhập, xem thực đơn, xem chi tiết sản phẩm và thêm sản phẩm vào giỏ hàng.
- Khách hàng (General Customer) là tác nhân tổng quát cho các chức năng xem thực đơn, xem chi tiết sản phẩm và quản lý giỏ hàng.
- Khách hàng đã đăng nhập được sử dụng các chức năng chung và các chức năng yêu cầu xác thực như xem điểm thưởng, đổi điểm lấy voucher, áp dụng voucher, đặt hàng, thanh toán, xem lịch sử, theo dõi và hủy đơn hàng.
- VNPay Gateway tham gia vào quy trình thanh toán và gửi thông báo IPN đến hệ thống.

## 1.2.5. Ma trận liên kết yêu cầu chức năng và Use Case

| Yêu cầu chức năng                    | Use Case liên quan                   |
| ------------------------------------ | ------------------------------------ |
| FR-01 – Đăng ký tài khoản            | UC-01 – Đăng ký                      |
| FR-02 – Đăng nhập                    | UC-02 – Đăng nhập                    |
| FR-03 – Đăng xuất                    | UC-03 – Đăng xuất                    |
| FR-04 – Xem thực đơn                 | UC-04 – Xem thực đơn                 |
| FR-05 – Xem chi tiết sản phẩm        | UC-05 – Xem chi tiết sản phẩm        |
| FR-06 – Thêm sản phẩm vào giỏ hàng   | UC-06 – Thêm sản phẩm vào giỏ hàng   |
| FR-07 – Tùy chỉnh đồ uống            | UC-07 – Tùy chỉnh đồ uống            |
| FR-08 – Xem và quản lý giỏ hàng      | UC-08 – Xem và quản lý giỏ hàng      |
| FR-09 – Xem điểm thưởng              | UC-09 – Xem điểm thưởng              |
| FR-10 – Đổi điểm thưởng lấy voucher  | UC-10 – Đổi điểm thưởng lấy voucher  |
| FR-11 – Áp dụng voucher              | UC-11 – Áp dụng voucher              |
| FR-12 – Đặt hàng                     | UC-12 – Đặt hàng                     |
| FR-13 – Thanh toán qua VNPay         | UC-13 – Thanh toán qua VNPay         |
| FR-14 – Xem xác nhận đơn hàng        | UC-14 – Xem xác nhận đơn hàng        |
| FR-15 – Xem lịch sử đơn hàng         | UC-15 – Xem lịch sử đơn hàng         |
| FR-16 – Theo dõi tiến trình đơn hàng | UC-16 – Theo dõi tiến trình đơn hàng |
| FR-17 – Hủy đơn hàng                 | UC-17 – Hủy đơn hàng                 |
| FR-18 – Tiếp nhận và xử lý IPN       | UC-18 – Tiếp nhận và xử lý IPN       |

### Lưu ý về truy vết yêu cầu

- Tất cả các Use Case trong bảng đều được xây dựng dựa trên hai sơ đồ Use Case đã cung cấp.
- Các chức năng điểm thưởng, voucher, thanh toán VNPay và IPN cần được mô tả thống nhất giữa SRS và tài liệu đặc tả chi tiết.
- Quan hệ `<<include>>` và `<<extend>>` cần được giữ thống nhất giữa sơ đồ và tài liệu.
- Ma trận này thể hiện mối liên hệ giữa yêu cầu chức năng và Use Case, không mô tả thứ tự thực hiện các bước trong quy trình nghiệp vụ.
- Các quy tắc nghiệp vụ chưa được xác nhận cần được ghi nhận trong phần Open Issues của tài liệu đặc tả chi tiết.
