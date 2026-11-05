# LEVEL AUTHORING

Level nằm trong `src/levels.js`. Mỗi entry có dạng:

```js
{
  id: 11,
  title: 'Tên level', subtitle: 'Một câu giới thiệu',
  rows: 3, cols: 4,
  start: '012301230123',    // 12 vị trí, row-major. Chuỗi này đã thắng (chỉ ví dụ).
  par: 0,                  // số lượt tối ưu đã được kiểm chứng
  theme: 'forest',         // dawn | forest | snow | night | sunset
  blocked: [1,3],         // tùy chọn: vòng bị khóa, 0-based
  link: [0,5,-1],         // tùy chọn: hai vòng liên kết ngược chiều
  oneWay: [[2,1]],        // tùy chọn: vòng 2 chỉ xoay direction=1 (vuốt trái)
  seals: [[0,6,2]],       // tùy chọn: vòng 0 mở khi bệ 6 có Gấu trúc (ID 2)
  icon: '🌿', rule: 'Tên mechanic', description: 'Hướng dẫn ngắn.',
  solution: []             // dãy [wheelIndex, direction], direction = 1 hoặc -1
}
```

## Đánh chỉ số bệ và vòng phép

**Bệ (3×4):**

```
  0   1   2   3
  4   5   6   7
  8   9  10  11
```

**Vòng xoay 2×2 (3×4):**

```
    0   1   2     // phủ hàng 0–1
    3   4   5     // phủ hàng 1–2
```

**Vòng xoay 2×2 (3×3):**

```
    0   1
    2   3
```

Một vòng `w` xác định bốn bệ theo thứ tự clockwise: `top-left → top-right → bottom-right → bottom-left`.

- `direction = 1`: đi sang vị trí kế tiếp theo chiều kim đồng hồ.
- `direction = -1`: đi sang vị trí kế tiếp theo chiều ngược.
- `blocked` là danh sách chỉ số vòng **0-based**.
- `link: [0,5,-1]`: thao tác trên vòng 0 hoặc 5 làm vòng còn lại quay ngược. Hai vùng liên kết **phải không giao ô** ở bản demo.
- `oneWay`: mỗi vòng chỉ khai báo một chiều. `1` tương ứng vuốt trái, `-1` vuốt phải. Cặp liên kết kiểm tra cả chiều bắt buộc của trục còn lại.
- `seals`: `[wheel, triggerCell, animal]`, chỉ mở khi `state[triggerCell] === animal`. Kiểm tra trên trạng thái trước lượt xoay; có thể đóng lại sau lượt. Một vòng có tối đa một ấn; không gắn ấn lên vòng đã nằm trong `blocked`.
- Bệ kích hoạt và trục dùng cùng dấu ①–⑥. Khóa một thành viên bánh răng chặn cả cặp.

## Cách tạo level mới chắc chắn giải được

1. Tạo trạng thái thắng với mỗi cột mang đúng loài: `012301230123` cho 3×4.
2. Chọn 5–12 thao tác xoay hợp lệ để **scramble từ trạng thái thắng**.
3. Trạng thái sau xáo trộn = `start`.
4. Đảo ngược thứ tự các thao tác đã dùng, đồng thời đổi dấu `direction` để tạo `solution`.
5. Chạy `python tools/validate_levels.py` để kiểm chứng có lời giải và số bước tối ưu.
6. Playtest độ khó trực quan. Màn có 9 lần scramble không đồng nghĩa tối ưu 9 lần.

Với `oneWay` hoặc `seals`, không giả định đảo ngược scramble vẫn hợp lệ. Dùng tìm kiếm xuôi từ start, kiểm tra mỗi move bằng `Engine.moveError`/`Engine.spin`. Từ root thư viện chạy `node tools/solve-spirit-grove.mjs`; từ module chạy `python tools/validate_levels.py`. Hai validator đều tìm xuôi và so sánh `par` với khoảng cách ngắn nhất. Hint đi lệch lời giải mẫu phải khuyên Undo, không tự đề nghị nước đảo ngược có thể bị cấm.

**Quan trọng:** Trong bản này `target` được suy ra từ số cột; sửa target win pattern yêu cầu sửa `Engine.isWin` cùng cách hiển thị biểu tượng đích trong `art.js`.

## Content art độc lập với logic

Các thuộc tính như `theme`, `title`, `subtitle` ảnh hưởng trình bày mà không thay đổi luật. Nếu muốn level là một mô hình 3D thật, thay renderer SVG bằng renderer WebGL/Unity/Cocos nhưng giữ API `Engine.spin(level, state, wheel, direction)`.
