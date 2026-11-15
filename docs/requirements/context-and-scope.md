# 1. Bối cảnh và phạm vi dự án (Context and Scope)

## 1.1. Tổng quan dự án

BrewLite là hệ thống hỗ trợ khách hàng mua đồ uống trực tuyến, cho phép người dùng xem thực đơn, xem chi tiết sản phẩm, lựa chọn các tùy chọn cho đồ uống, quản lý giỏ hàng, đặt hàng, thanh toán và theo dõi trạng thái đơn hàng.

Bên cạnh quy trình mua hàng cơ bản, BrewLite còn hỗ trợ chương trình khách hàng thân thiết thông qua chức năng xem điểm thưởng, đổi điểm lấy voucher và áp dụng voucher khi thanh toán. Hệ thống hướng đến việc tạo ra trải nghiệm mua đồ uống trực tuyến thuận tiện, giúp khách hàng dễ dàng lựa chọn sản phẩm và hoàn tất đơn hàng.

Dự án phân biệt ba trạng thái người dùng chính gồm Khách vãng lai (Guest), Khách hàng (General Customer) và Khách hàng đã đăng nhập (Logged-in Customer). Khách vãng lai có thể xem thực đơn, xem chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng và đăng ký hoặc đăng nhập. Khách hàng đã đăng nhập được sử dụng thêm các chức năng liên quan đến điểm thưởng, voucher, đặt hàng, thanh toán và quản lý đơn hàng.

Về công nghệ, source code BrewLite hiện sử dụng Next.js cho giao diện người dùng, NestJS cho backend và PostgreSQL kết hợp Prisma để quản lý dữ liệu. Thanh toán trực tuyến được tích hợp thông qua VNPay Sandbox/VNPay Gateway. Hệ thống tiếp nhận kết quả thanh toán và xử lý thông tin IPN (Instant Payment Notification) để cập nhật trạng thái giao dịch và đơn hàng.

## 1.2. Luồng nghiệp vụ chính

Luồng nghiệp vụ chính của hệ thống BrewLite được xác định như sau:

1. **Truy cập và xem thực đơn:** Khách hàng truy cập hệ thống để xem thực đơn, danh sách đồ uống và các sản phẩm đang được cung cấp. Chức năng này hỗ trợ cả khách vãng lai và khách hàng đã đăng nhập.

2. **Xem chi tiết sản phẩm:** Khách hàng lựa chọn một sản phẩm để xem thông tin chi tiết, giá bán và các tùy chọn đi kèm.

3. **Tùy chỉnh đồ uống:** Khách hàng lựa chọn kích thước (size), topping, lượng đường và lượng đá theo nhu cầu trước khi thêm sản phẩm vào giỏ hàng.

4. **Quản lý giỏ hàng:** Khách hàng thêm sản phẩm vào giỏ hàng, xem giỏ hàng và kiểm tra các sản phẩm đã lựa chọn.

5. **Đăng ký và đăng nhập:** Khách vãng lai có thể đăng ký tài khoản mới hoặc đăng nhập vào hệ thống. Sau khi đăng nhập, người dùng được chuyển sang trạng thái khách hàng đã đăng nhập.

6. **Xem và sử dụng điểm thưởng:** Khách hàng đã đăng nhập có thể xem điểm thưởng hiện có và sử dụng điểm để đổi lấy voucher theo quy định của hệ thống.

7. **Áp dụng voucher:** Trong quá trình đặt hàng và thanh toán, khách hàng có thể lựa chọn áp dụng voucher hợp lệ để được hưởng ưu đãi theo điều kiện chương trình.

8. **Đặt hàng:** Khách hàng xác nhận thông tin giỏ hàng và gửi yêu cầu đặt hàng. Hệ thống kiểm tra sản phẩm, tùy chọn, số lượng, giá bán và các điều kiện liên quan trước khi tạo đơn hàng.

9. **Thanh toán qua VNPay:** Sau khi đặt hàng, khách hàng được chuyển đến VNPay Gateway để thực hiện thanh toán. VNPay trả kết quả giao dịch về hệ thống BrewLite.

10. **Tiếp nhận và xử lý IPN:** Hệ thống tiếp nhận thông báo IPN từ VNPay Gateway, kiểm tra tính hợp lệ của dữ liệu giao dịch và cập nhật kết quả thanh toán tương ứng.

11. **Xem xác nhận đơn hàng:** Sau khi hệ thống xác nhận giao dịch hợp lệ và thanh toán thành công, khách hàng có thể xem thông tin xác nhận đơn hàng.

12. **Quản lý đơn hàng:** Khách hàng đã đăng nhập có thể xem lịch sử đơn hàng, theo dõi tiến trình xử lý và thực hiện hủy đơn hàng khi đáp ứng điều kiện nghiệp vụ.

## 1.3. Vấn đề nghiệp vụ cần giải quyết

Quy trình mua đồ uống trực tuyến cần đảm bảo khách hàng có thể thực hiện các thao tác từ xem thực đơn đến đặt hàng, thanh toán và theo dõi đơn hàng một cách thuận tiện.

Các vấn đề cần được hệ thống hỗ trợ giải quyết gồm:

- Khách hàng cần xem được thực đơn, thông tin chi tiết và các tùy chọn của sản phẩm trước khi quyết định mua.
- Việc tùy chỉnh kích thước, topping, lượng đường và lượng đá cần được lưu chính xác theo từng sản phẩm trong giỏ hàng.
- Thông tin giỏ hàng cần được quản lý nhất quán, bao gồm sản phẩm, tùy chọn và số lượng.
- Khách hàng cần có khả năng xem điểm thưởng và đổi điểm lấy voucher.
- Voucher cần được kiểm tra điều kiện và tính hợp lệ trước khi áp dụng vào đơn hàng.
- Giá sản phẩm, số lượng và tổng tiền cần được kiểm tra ở phía backend khi xử lý đặt hàng.
- Quy trình thanh toán cần xử lý được các trường hợp thành công, thất bại hoặc bị hủy.
- Hệ thống cần tiếp nhận và xác thực thông báo IPN từ VNPay Gateway để hạn chế sai lệch trạng thái thanh toán.
- Khách hàng cần xem được xác nhận đơn hàng sau khi thanh toán thành công.
- Khách hàng cần xem lịch sử, theo dõi tiến trình và thực hiện hủy đơn hàng theo điều kiện cho phép.
- Hệ thống cần quản lý điểm thưởng và voucher chính xác, tránh việc sử dụng điểm hoặc voucher không hợp lệ.

## 1.4. Mục tiêu của dự án

- Xây dựng hệ thống mua đồ uống trực tuyến với quy trình từ xem thực đơn, tùy chỉnh sản phẩm, quản lý giỏ hàng đến đặt hàng và thanh toán.
- Hỗ trợ các trạng thái người dùng khác nhau gồm khách vãng lai, khách hàng và khách hàng đã đăng nhập.
- Triển khai chức năng điểm thưởng, đổi điểm lấy voucher và áp dụng voucher vào đơn hàng.
- Tích hợp thanh toán trực tuyến thông qua VNPay Sandbox/VNPay Gateway.
- Tiếp nhận và xử lý IPN để cập nhật kết quả giao dịch và trạng thái thanh toán.
- Hỗ trợ khách hàng xem xác nhận đơn hàng, lịch sử đơn hàng, theo dõi tiến trình và hủy đơn hàng theo quy định.
- Đảm bảo dữ liệu sản phẩm, giỏ hàng, đơn hàng, điểm thưởng, voucher và thanh toán được xử lý nhất quán.
- Xây dựng hệ thống có cấu trúc rõ ràng, thuận tiện cho kiểm thử, bảo trì và mở rộng.
- Hoàn thiện sản phẩm MVP theo yêu cầu Assignment 2 và sơ đồ Use Case đã thống nhất.

## 1.5. Các bên liên quan (Stakeholders)

Các bên liên quan của dự án BrewLite bao gồm những cá nhân hoặc nhóm có nhu cầu sử dụng, quản lý, phát triển hoặc đánh giá hệ thống.

### 1.5.1. Danh sách stakeholder

| Stakeholder                                  | Vai trò                                             | Mong đợi và mối quan tâm                                                                          | Mức độ ảnh hưởng |
| -------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------- |
| Khách vãng lai (Guest)                       | Người truy cập hệ thống chưa đăng nhập              | Xem thực đơn, xem chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng, đăng ký và đăng nhập             | Cao              |
| Khách hàng (General Customer)                | Người sử dụng các chức năng chung của hệ thống      | Xem thực đơn, xem sản phẩm và quản lý giỏ hàng                                                    | Cao              |
| Khách hàng đã đăng nhập (Logged-in Customer) | Người dùng đã xác thực tài khoản                    | Đặt hàng, thanh toán, xem điểm thưởng, đổi điểm lấy voucher, áp dụng voucher và theo dõi đơn hàng | Cao              |
| Nhân viên quầy (Counter Staff)               | Tiếp nhận và xử lý đơn hàng tại cửa hàng            | Nhận thông tin đơn hàng chính xác, biết các tùy chọn đồ uống và trạng thái đơn hàng               | Cao              |
| Quản lý cửa hàng (Store Manager)             | Theo dõi hoạt động kinh doanh                       | Theo dõi sản phẩm, giá bán, tồn kho, đơn hàng và chương trình khách hàng thân thiết               | Cao              |
| Nhóm phát triển (Development Team)           | Phân tích, thiết kế, lập trình và kiểm thử hệ thống | Yêu cầu rõ ràng, thiết kế nhất quán, source code dễ bảo trì và tích hợp VNPay chính xác           | Cao              |
| PM/BA (Project Manager/Business Analyst)     | Điều phối và phân tích yêu cầu dự án                | Kiểm soát phạm vi, tiến độ, yêu cầu và chất lượng bàn giao                                        | Cao              |
| Giảng viên/người nghiệm thu                  | Đánh giá kết quả Assignment 2                       | Sản phẩm và tài liệu đáp ứng yêu cầu đề bài, có minh chứng kiểm thử                               | Cao              |
| VNPay Gateway                                | Hệ thống bên thứ ba xử lý giao dịch thanh toán      | Tiếp nhận yêu cầu thanh toán, xử lý giao dịch và gửi kết quả thanh toán/IPN chính xác             | Cao              |

### 1.5.2. Phân nhóm stakeholder

Các stakeholder được chia thành ba nhóm chính:

- **Nhóm người sử dụng:** Khách vãng lai, khách hàng và khách hàng đã đăng nhập. Đây là những đối tượng trực tiếp tương tác với hệ thống BrewLite.
- **Nhóm vận hành nghiệp vụ:** Nhân viên quầy và quản lý cửa hàng. Đây là các đối tượng liên quan đến hoạt động tiếp nhận, xử lý và quản lý đơn hàng tại cửa hàng.
- **Nhóm thực hiện và hỗ trợ dự án:** PM/BA, nhóm phát triển, giảng viên/người nghiệm thu và VNPay Gateway. Các bên này tham gia phân tích, phát triển, đánh giá hoặc hỗ trợ xử lý thanh toán.

### 1.5.3. Cách thức làm việc với stakeholder

- Thu thập và làm rõ nhu cầu của khách hàng thông qua các luồng xem thực đơn, tùy chỉnh đồ uống, quản lý giỏ hàng và đặt hàng.
- Xác nhận quy tắc nghiệp vụ liên quan đến điểm thưởng, đổi điểm lấy voucher và điều kiện áp dụng voucher.
- Trao đổi với PM và các thành viên phát triển để xác định phạm vi MVP.
- Đối chiếu sơ đồ Use Case, SRS, API và database schema với source code hiện tại.
- Xác nhận các quy tắc xử lý đơn hàng, thanh toán, IPN và điều kiện hủy đơn.
- Sử dụng tiêu chí nghiệm thu Assignment 2 để kiểm tra kết quả bàn giao.

**Lưu ý:** Nhân viên quầy và quản lý cửa hàng là các stakeholder nghiệp vụ. Không mặc nhiên xem đây là tác nhân trực tiếp của hai sơ đồ Use Case khách hàng nếu chưa có chức năng tương ứng được thể hiện trong hệ thống.

## 1.6. Phạm vi dự án (Project Scope)

Phần này xác định các chức năng được thực hiện trong dự án BrewLite, những chức năng nằm ngoài phạm vi, các giả định và những ràng buộc cần tuân thủ.

### 1.6.1. Phạm vi thực hiện (In-scope)

Trong phạm vi MVP, hệ thống tập trung vào các chức năng được thể hiện trong hai sơ đồ Use Case tổng quát và Use Case đặt hàng, thanh toán.

**Các chức năng chính:**

1. **Đăng ký tài khoản:** Cho phép khách vãng lai đăng ký tài khoản để sử dụng hệ thống.
2. **Đăng nhập:** Cho phép khách vãng lai đăng nhập và chuyển sang trạng thái khách hàng đã đăng nhập.
3. **Đăng xuất:** Cho phép khách hàng đã đăng nhập đăng xuất khỏi hệ thống.
4. **Xem thực đơn:** Hiển thị danh sách đồ uống và các sản phẩm đang được cung cấp.
5. **Xem chi tiết sản phẩm:** Hiển thị thông tin, giá bán và các tùy chọn của sản phẩm.
6. **Thêm sản phẩm vào giỏ hàng:** Cho phép khách hàng lựa chọn sản phẩm và thêm vào giỏ hàng.
7. **Tùy chỉnh đồ uống:** Cho phép lựa chọn size, topping, lượng đường và lượng đá. Chức năng này được sử dụng trong quá trình thêm sản phẩm vào giỏ hàng.
8. **Xem và quản lý giỏ hàng:** Cho phép khách hàng xem các sản phẩm đã thêm và quản lý thông tin giỏ hàng.
9. **Xem điểm thưởng:** Cho phép khách hàng đã đăng nhập xem số điểm thưởng hiện có.
10. **Đổi điểm thưởng lấy voucher:** Cho phép khách hàng sử dụng điểm thưởng để đổi lấy voucher theo quy định.
11. **Áp dụng voucher:** Cho phép khách hàng sử dụng voucher hợp lệ trong quá trình đặt hàng và thanh toán.
12. **Đặt hàng:** Cho phép khách hàng xác nhận thông tin và tạo đơn hàng.
13. **Thanh toán qua VNPay:** Tích hợp VNPay Sandbox/VNPay Gateway để thực hiện thanh toán trực tuyến.
14. **Xem xác nhận đơn hàng:** Hiển thị thông tin xác nhận và mã đơn hàng sau khi thanh toán thành công.
15. **Tiếp nhận và xử lý IPN:** Tiếp nhận thông báo từ VNPay Gateway, kiểm tra tính hợp lệ và cập nhật trạng thái giao dịch.
16. **Xem lịch sử đơn hàng:** Hiển thị danh sách các đơn hàng khách hàng đã đặt.
17. **Theo dõi tiến trình đơn hàng:** Cho phép khách hàng theo dõi trạng thái xử lý của đơn hàng.
18. **Hủy đơn hàng:** Cho phép khách hàng thực hiện hủy đơn hàng theo điều kiện nghiệp vụ được hệ thống quy định.

### 1.6.2. Ngoài phạm vi thực hiện (Out-of-scope)

Các chức năng sau không thuộc phạm vi MVP hiện tại, trừ khi PM và nhóm phát triển có quyết định bổ sung:

- Tích hợp đơn vị vận chuyển bên thứ ba.
- Theo dõi vị trí giao hàng theo thời gian thực.
- Quản lý nhiều chi nhánh cửa hàng.
- Tích hợp hệ thống kế toán hoặc quản lý doanh nghiệp bên ngoài.
- Xây dựng ứng dụng di động native riêng cho Android và iOS.
- Tích hợp các cổng thanh toán khác ngoài VNPay.
- Hệ thống thông báo đa kênh qua SMS, email hoặc ứng dụng nhắn tin.
- Quản lý kho hàng thông qua hệ thống kho bên thứ ba.
- Chương trình thành viên nâng cao ngoài chức năng điểm thưởng và đổi điểm lấy voucher được xác định trong Use Case.
- Các chức năng quản trị nâng cao chưa được thể hiện trong sơ đồ Use Case.

### 1.6.3. Các giả định (Assumptions)

- Người dùng có thiết bị và kết nối Internet để truy cập hệ thống và VNPay Gateway.
- Thông tin sản phẩm, danh mục, giá bán, tồn kho, điểm thưởng và voucher được cung cấp trong cơ sở dữ liệu.
- Khách vãng lai có thể xem thực đơn, xem chi tiết sản phẩm và sử dụng giỏ hàng mà không cần đăng nhập.
- Khách hàng phải đăng nhập trước khi thực hiện các chức năng yêu cầu xác thực như xem điểm thưởng, đổi điểm, đặt hàng và quản lý đơn hàng.
- Backend chịu trách nhiệm kiểm tra giá, số lượng, tính hợp lệ của voucher và điểm thưởng khi xử lý nghiệp vụ.
- Thanh toán sử dụng môi trường VNPay Sandbox phục vụ phát triển và kiểm thử.
- Kết quả thanh toán và thông báo IPN phải được kiểm tra trước khi cập nhật trạng thái giao dịch.
- Các quy tắc nghiệp vụ về tích điểm, đổi điểm, điều kiện voucher, thời điểm trừ kho và điều kiện hủy đơn cần được xác nhận với PM.
- Điều kiện hủy đơn phụ thuộc vào trạng thái xử lý hiện tại của đơn hàng.

### 1.6.4. Các ràng buộc (Constraints)

- **Frontend:** Next.js.
- **Backend:** NestJS.
- **Cơ sở dữ liệu:** PostgreSQL.
- **Quản lý dữ liệu:** Prisma.
- **Thanh toán:** VNPay Sandbox/VNPay Gateway.
- **Xử lý thanh toán:** Tiếp nhận và xác thực kết quả giao dịch, bao gồm thông báo IPN.
- **Phạm vi chức năng:** Ưu tiên các chức năng được thể hiện trong sơ đồ Use Case.
- **Thời gian:** Hoàn thành các hạng mục theo deadline do nhóm thống nhất.
- **Tính nhất quán:** Context & Scope, SRS, Use Case, API và source code cần phản ánh cùng một quy trình nghiệp vụ.

### 1.6.5. Nguyên tắc quản lý phạm vi

Các chức năng được xác định trong hai sơ đồ Use Case là cơ sở để xây dựng yêu cầu chức năng và tài liệu đặc tả chi tiết.

Mọi chức năng mới phát sinh ngoài phạm vi MVP cần được PM xem xét và thống nhất trước khi thực hiện.

Nhóm phát triển cần đảm bảo các chức năng về điểm thưởng, voucher, đặt hàng, thanh toán VNPay, xử lý IPN và quản lý đơn hàng được mô tả thống nhất trong tài liệu và triển khai đúng quy tắc nghiệp vụ.

## 1.7. Phân tích rủi ro ban đầu (Initial Risk Analysis)

### 1.7.1. Danh sách rủi ro

| ID   | Rủi ro                                                   | Khả năng xảy ra | Mức độ ảnh hưởng | Biện pháp giảm thiểu                                                         |
| ---- | -------------------------------------------------------- | --------------- | ---------------- | ---------------------------------------------------------------------------- |
| R-01 | Chậm tiến độ do phân công và phối hợp chưa hiệu quả      | Trung bình      | Cao              | Phân công owner rõ ràng, theo dõi tiến độ và review định kỳ                  |
| R-02 | Thông tin giỏ hàng và tùy chỉnh sản phẩm không nhất quán | Trung bình      | Cao              | Kiểm tra dữ liệu sản phẩm, size, topping, đường và đá trước khi thêm vào giỏ |
| R-03 | Sai lệch điểm thưởng hoặc voucher khi đổi và áp dụng     | Trung bình      | Cao              | Kiểm tra số điểm, điều kiện đổi và tính hợp lệ của voucher ở backend         |
| R-04 | Thanh toán thất bại hoặc kết quả trả về không đồng bộ    | Trung bình      | Cao              | Kiểm thử các trường hợp thành công, thất bại, hủy và timeout                 |
| R-05 | IPN bị gửi lặp hoặc dữ liệu IPN không hợp lệ             | Trung bình      | Cao              | Xác thực chữ ký, kiểm tra mã giao dịch và chống xử lý trùng                  |
| R-06 | Tạo nhiều đơn hàng do gửi yêu cầu đặt hàng lặp           | Trung bình      | Cao              | Sử dụng cơ chế chống xử lý trùng và kiểm tra trạng thái giao dịch            |
| R-07 | Hủy đơn không đúng điều kiện nghiệp vụ                   | Trung bình      | Cao              | Xác định điều kiện hủy theo trạng thái đơn hàng và kiểm tra ở backend        |
| R-08 | Tài liệu không khớp với sơ đồ Use Case và source code    | Trung bình      | Trung bình       | Đối chiếu SRS, Use Case, API và database schema trước nghiệm thu             |
| R-09 | Lỗi cấu hình khi triển khai VNPay                        | Trung bình      | Cao              | Kiểm tra cấu hình môi trường, URL trả kết quả và IPN                         |
| R-10 | Thay đổi yêu cầu làm mở rộng phạm vi MVP                 | Trung bình      | Trung bình       | Yêu cầu PM phê duyệt trước khi bổ sung chức năng                             |

### 1.7.2. Các rủi ro cần ưu tiên xử lý

- **Giỏ hàng và tùy chỉnh:** Đảm bảo thông tin sản phẩm và các tùy chọn được lưu chính xác.
- **Điểm thưởng và voucher:** Xác định rõ điều kiện đổi điểm, số điểm cần thiết và điều kiện áp dụng voucher.
- **Thanh toán:** Xác định cách cập nhật trạng thái đơn hàng khi thanh toán thành công, thất bại hoặc bị hủy.
- **IPN:** Đảm bảo thông báo từ VNPay được xác thực và không bị xử lý nhiều lần.
- **Hủy đơn hàng:** Xác định trạng thái đơn hàng được phép hủy và quy tắc hoàn tiền hoặc hoàn kho nếu có.
- **Tính nhất quán dữ liệu:** Đảm bảo thông tin đơn hàng, thanh toán và điểm thưởng được cập nhật chính xác.

### 1.7.3. Theo dõi và kiểm soát rủi ro

Các rủi ro cần được cập nhật trong suốt quá trình phát triển. PM phối hợp với BA, FE, BE và QA để đánh giá mức độ ảnh hưởng, xác định người chịu trách nhiệm và theo dõi biện pháp xử lý.

Những quy tắc nghiệp vụ chưa được PM xác nhận cần được ghi nhận là vấn đề mở trong tài liệu Use Case, không tự xem là quyết định chính thức của dự án.
