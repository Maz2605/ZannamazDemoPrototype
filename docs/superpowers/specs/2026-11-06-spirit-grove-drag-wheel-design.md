# Spirit Grove — kéo mâm xoay

## Mục tiêu và phạm vi

Thay hai nút ↶/↷ bằng một trục xoay nằm giữa 4 linh thú, giúp thao tác trực tiếp và dễ hiểu hơn trên điện thoại. Project hiện là HTML/CSS/JavaScript với SVG 2.5D. Giữ engine, 10 màn, lời giải, số lượt, Undo, Restart, Hint, phong ấn và bánh răng liên kết.

## Các phương án đã cân nhắc

- **Kéo quanh trục:** hướng chuyển động của tay quyết định chiều xoay; thể hiện rõ quan hệ giữa trục và 4 con, cần xử lý góc kéo và preview. Người dùng đã chọn phương án này.
- **Vuốt ngang trên trục:** dễ nhận thao tác, nhưng chiều vuốt không diễn tả trực tiếp đường xoay của các con. Không chọn.

## Thiết kế đề xuất để duyệt

- Trục có tay nắm và vòng viền dạng mâm xoay; khi chọn, làm nổi cụm 4 con và vòng chuyển động của nó. Không dùng hai nửa nút bấm như hiện tại.
- Kéo theo chiều kim đồng hồ hoặc ngược chiều: 4 con di chuyển theo tay quanh trục, giữ hình con vật đứng thẳng. Thả tay chốt một góc 90°, tính đúng 1 lượt.
- Lựa chọn triển khai của agent: ngưỡng chốt 30° và tối thiểu 12 CSS px; preview giới hạn ±90°. Kéo chưa đủ ngưỡng, chạm đơn thuần, mất pointer hoặc hủy thao tác đều trả về vị trí ban đầu và không tính lượt.
- Dùng tọa độ SVG chuyển từ vị trí pointer để hỗ trợ bàn chơi thu phóng trong khung điện thoại. Hỗ trợ cảm ứng và kéo chuột trái; chỉ một pointer điều khiển mỗi lần.
- Vòng khóa không nhận thao tác xoay. Hai vòng liên kết preview/chốt ngược chiều nhau. Khi đang chốt animation thì không nhận lượt mới. Chuyển màn, Restart hoặc Undo trong lúc kéo phải dọn preview trước.
- Giữ thao tác bàn phím như một cách truy cập: focus trục và dùng mũi tên trái/phải. Cập nhật hướng dẫn trong game, metadata thư viện và README cho thao tác kéo.

## Kiểm chứng dự kiến

Kiểm tra tính góc qua mốc ±180°, hai chiều xoay, ngưỡng chốt, thao tác bị hủy và pointer phụ; kiểm tra engine vẫn giải được cả 10 màn. Nếu có trình duyệt điều khiển được, kiểm tra kéo trên màn nhỏ và trong iframe, phong ấn, cặp bánh răng, Undo và Restart. Báo rõ kiểm tra nào chưa thực hiện; không thêm package.

## Trạng thái

Sửa chiều theo phản hồi mới nhất: vuốt trái → Engine +1 (thuận chiều), vuốt phải → Engine -1 (ngược chiều); các con ở phía trước đi cùng hướng tay. Preview, chốt, bàn phím và hướng dẫn dùng cùng quy ước. Các thông số độ nhạy 24px/12px/170px được giữ nguyên.

Điều chỉnh hiện hành theo ảnh phản hồi: hình bàn xoay luôn nằm dưới con vật, vùng nhận chạm trên cùng chỉ là hình trong suốt. Ngưỡng chốt 24 CSS px ngang, dead zone 12px, preview 90°/170px sau dead zone. Các giá trị này thay ngưỡng 14px/8px/110px của lần trước; giữ trục đúng tâm ngã tư và cơ chế chọn rồi vuốt ngang.

Yêu cầu mới nhất thay thao tác vòng bằng vuốt ngang thống nhất để dễ sử dụng: chạm trục chọn cụm rồi vuốt trái/phải ở bất kỳ đâu trên bàn, hoặc vuốt trực tiếp từ trục. Trục nằm đúng tâm ngã tư, không nâng. Dead zone 8 CSS px; ngưỡng chốt 14 CSS px ngang, độ lệch ngang ít nhất 1.2 lần độ lệch dọc; preview 90°/110px sau dead zone; chốt 140ms không quán tính. Đây là thiết kế hiện hành, thay các phương án/ngưỡng lịch sử dưới đây.

Tinh chỉnh theo yêu cầu tiếp theo: preview góc giảm còn 60%, vùng bỏ rung tay 5 CSS px, ngưỡng chốt 16 CSS px và góc tay 20° cho thao tác vòng. Chạm giữa chọn cụm rồi vuốt đầu một con; vuốt ngắn trực tiếp từ giữa dùng hướng kéo thẳng. Con vật thuộc nhiều vòng ưu tiên cụm được chọn. Các ngưỡng 30°/12px ở phần đề xuất ban đầu được thay bằng các giá trị này.

Người dùng duyệt và yêu cầu triển khai bằng “làm đi”. Đã triển khai trong module web hiện có; tay nắm được nâng 32 đơn vị SVG trên một trục ngắn để tránh che mặt con vật phía trước. Các con vẫn quay quanh tâm mặt phẳng bàn chơi.
