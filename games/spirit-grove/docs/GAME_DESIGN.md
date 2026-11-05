# GAME DESIGN — Spirit Grove

## Core pitch

Mỗi level là **một đảo 3D nhỏ / diorama động vật**. Các linh thú đứng trên bệ đá theo trật tự sai. Người chơi **xoay các vùng 2×2** để điều khiển 4 con cùng lúc; các vùng giao nhau nên người chơi phải lập kế hoạch thay vì di chuyển từng con.

## Gameplay loop (dự kiến 15–90 giây/level)

1. Quan sát vị trí hiện tại và biểu tượng đích trên bệ.
2. Chạm trục ở ngã tư (2×2) → vuốt trái/phải trên bàn → thả để chốt ¼ vòng; tuân theo nhãn một chiều và trạng thái ấn.
3. Quan sát thay đổi của 4 vị trí, kết hợp vòng lân cận.
4. Hoàn thiện mọi cột → diorama hồi sinh, thưởng hình ảnh/collection.

## USP cần xác thực

- **One-drag affects four:** mọi thao tác ảnh hưởng 4 con, không có thao tác sửa sai một con độc lập.
- **Overlapping rules:** các vòng phép giao nhau; suy nghĩ theo trình tự thao tác.
- **Visual payoff:** mỗi màn có thể thay theme, hình đảo, trang trí, động vật và trạng thái sau khi thắng.
- **Content dual-layer:** blocker thay đổi *logic*, asset/theme thay đổi *độ mới thị giác*.

## Hệ thống cơ chế

| Nhóm | Trong demo | Ý tưởng mở rộng cần playtest |
|---|---|---|
| Rotate region | 2×2 clockwise/counterclockwise | Xoay 90° chỉ một chiều, giới hạn số lần |
| Sealed wheel | Level 5,6,8,9,10 | Bị khóa theo điều kiện, mở bằng kích hoạt vật thể |
| Gear linked | Level 9,10 | Cùng/ngược chiều, chuỗi 3 vòng (phải kiểm tra xung đột) |
| One-way wheel | Level 4,5,7,8,9,10; chỉ nhận hướng vuốt ghi trên nhãn | Chuyển hướng theo điều kiện |
| Rune lock | Level 6,8,9,10; chỉ mở khi đúng loài ở bệ kích hoạt | Nhiều điều kiện kết hợp sau playtest |
| Environmental | Chưa có | Đèn, gió, ngày/đêm tác động đến khả dụng của vòng |
| Animal behaviors | Chưa có | Loài ngủ, hoảng sợ, dịch chuyển theo chu kỳ — tránh tăng quá nhiều state |
| Diorama content | 5 bảng màu | Forest, Arctic, Ocean, Sakura, Night, Ruins... |

## Định hướng đến 100+ level

- **01–15:** rõ luật xoay + vòng giao nhau; chỉ một mechanic tại một thời điểm.
- **16–30:** tăng từ 2×3 sang 3×3, chơi với vị trí trung tâm.
- **31–45:** vòng bị khóa; cách dùng vòng thay thế.
- **46–60:** luân phiên layout 3×4, thêm vùng liên kết cùng chiều.
- **61–75:** liên kết ngược chiều + hàng rào có điều kiện, tránh tác động thiếu dự đoán.
- **76–90:** blocker mới + biến thể win condition (đúng nhóm, đúng pattern) nếu QA xác thực.
- **91–100+:** phối hợp 2–3 mechanic, không chỉ tăng lượt tối ưu.

**Không nên** copy các level ngẫu nhiên khác trạng thái nhưng cùng lời giải bản chất. Hãy kiểm tra *shortest path*, số lượng hướng đi, dễ đọc hình, mất bao nhiêu lượt người chơi mới hiểu blocker, và tính không trùng nhau giữa các màn.

## Test MVP

Màn 1 có tutorial chơi thật hai bước: chọn trục sáng, vuốt phải để thắng; chặn nước sai trong tutorial, có Bỏ qua và chạy lại khi Restart. Không che động vật. Màn cuối phối hợp hai trục một chiều, hai vòng khóa cố định, khóa ấn và cặp bánh răng; lời giải ngắn nhất đã đối chiếu tăng lên 15 lượt.

- Level 1 giải được trong 10 giây mà không cần tutorial dài.
- Khả năng dự đoán chính xác hướng xoay sau một lượt.
- Đo completion, restart, undo, hint và số lượt trên mỗi màn.
- So sánh các level 4 / 8 / 9 / 10 để xem blocker có tạo chiến thuật thật hay chỉ khiến người chơi mò mẫm.

## Hạn chế / rủi ro

Core loop hiện vẫn là permutation puzzle. Nếu playtest vẫn thấy trừu tượng, hãy chuyển thao tác sang môi trường 3D có quan hệ nhân quả cụ thể (xoay cầu, dòng nước, sinh vật tự di chuyển), giữ logic deterministic. Art đẹp chỉ bổ trợ; nó không tự giải quyết vấn đề retention.
