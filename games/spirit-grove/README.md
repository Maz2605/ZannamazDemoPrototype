# Spirit Grove — Animal Diorama Puzzle (10-level Web Prototype)

**Phiên bản:** 0.1 · **Nền tảng:** Web / Mobile Portrait 9:16 · **Ngôn ngữ:** HTML + CSS + JavaScript thuần.

Dự án đóng gói phiên bản mới nhất của demo **Spirit Grove**, thay cho Totem Tails ghép tầng/tráo mảnh. Đây là **prototype 2.5D bằng SVG**, không phải mô hình WebGL/Unity 3D thật; mục tiêu là xác minh *core loop*.

## Chạy game

1. Module nằm tại `games/spirit-grove/` trong repository.
2. Nhấp đúp `index.html` hoặc `RUN_DEMO.cmd` trong module để chạy riêng bằng Chrome/Edge.
3. Để chạy qua thư viện: từ thư mục gốc repository chạy `node tools/serve.mjs`, sau đó mở `http://localhost:8080`.
4. Nhấn level **1–10** để test độc lập, không cần hoàn thành màn trước.

Không cần npm, bundler, tải asset, tài khoản hay internet.

## Luật chơi

- Mỗi màn có bàn từ **2×3** tới **3×4** bệ đá, mỗi cột là đích của một loài động vật: Cáo, Thỏ, Gấu trúc, Cú mèo.
- Mỗi **vòng phép** bao phủ 4 vị trí theo hình vuông 2×2.
- Chạm trục ở ngã tư để chọn cụm, rồi **vuốt trái / phải ở bất kỳ đâu trên bàn**, hoặc giữ trục và vuốt luôn. Vuốt theo hướng muốn kéo các con ở phía trước: trái → xoay thuận, phải → xoay ngược. Thả tay chốt **¼ vòng**, tính **1 lượt**; chạm đơn thuần, rung tay hoặc hủy không tính lượt.
- Không thể chọn/đẩy/đổi từng con vật một cách độc lập.
- **Win:** toàn bộ động vật trở về đúng bệ (cột).
- **Blocker:** vòng bị phong ấn (không xoay được); cặp vòng bánh răng liên kết (một vòng xoay sẽ khiến vòng còn lại xoay ngược chiều).
- **Trục một chiều:** từ màn 4; chỉ nhận vuốt theo nhãn `←` / `→`. Vuốt sai không tính lượt.
- **Khóa ấn:** từ màn 6; đưa đúng loài lên bệ mang cùng dấu với trục để mở. Con vật rời bệ thì trục khóa lại; với bánh răng, khóa một trục chặn cả cặp. Undo phục hồi cả trạng thái khóa.
- **Tutorial màn 1:** chọn trục sáng → vuốt phải để hoàn thành lượt đầu; có minh họa, nút Bỏ qua và hỗ trợ bàn phím. Restart hoặc vào lại màn 1 sẽ hiện lại hướng dẫn.

**Điều khiển:** chạm trục ở ngã tư chọn cụm rồi vuốt trái / phải trên bàn, `Undo`, `Restart`, `Gợi ý`, chọn nhanh level. Trên desktop: `Tab` chọn trục, `←` / `→` để xoay, `Ctrl/Cmd+Z` để Undo, `Alt+R` để Restart, `Escape` hủy kéo.

## Cấu trúc source

```
DemoPrototypeGame/
├── index.html             # Cấu trúc UI
├── src/
│   ├── styles.css         # Responsive UI, màu sắc, animation
│   ├── levels.js          # 10 level / blocked wheels / linked wheels / lời giải
│   ├── engine.js          # Core rule, rotate 2x2, win condition, level validator
│   ├── art.js             # Tạo scene 2.5D SVG, động vật, đế, vòng phép
│   ├── gesture.js         # Góc kéo trên mặt phẳng nghiêng, ngưỡng chốt thao tác
│   └── game.js            # Input, UI, Undo/Restart/Hint, animation
├── tools/
│   └── validate_levels.py # Kiểm chứng lời giải + số bước ngắn nhất bằng BFS
└── docs/
    ├── GAME_DESIGN.md     # Tóm tắt loop, USP, rủi ro, hướng scale 100 level
    └── LEVEL_AUTHORING.md # Cách tạo/sửa thêm level
```

## Cách chỉnh sửa nhanh

| Muốn sửa | File |
|---|---|
| Thêm/mở rộng 100 level | `src/levels.js` |
| Luật xoay, blocker, mục tiêu thắng | `src/engine.js` |
| Tượng động vật, art diorama, platform | `src/art.js` |
| Theme, font, responsive, nút bấm | `src/styles.css` |
| Animation, điều khiển, gợi ý, Undo | `src/game.js` |

Sau khi sửa `levels.js`, chạy `python tools/validate_levels.py` để kiểm tra tất cả màn còn giải được; trình duyệt cũng kiểm tra dữ liệu khi mở trang.

Từ thư mục gốc thư viện có thể chạy `node tools/solve-spirit-grove.mjs` để đối chiếu lời giải và số lượt tối ưu của cả 10 màn bằng engine thực tế. Solver tìm xuôi vì trục một chiều/khóa ấn có thể chặn thao tác đảo ngược.

## Những gì demo chưa có

- Chưa có model 3D thật, camera quay hay WebGL (art hiện tại là SVG 2.5D).
- Chưa có hệ thống level generator/editor đồ họa, lưu tiến trình server, quảng cáo, IAP, analytics hay VFX production.
- Hint hiển thị nước đi kế tiếp trên đường giải mẫu; nếu đi lệch, gợi ý quay lại/Undo, chưa có solver tức thời cho mọi trạng thái.
- Đây là **10 màn hand-authored có lời giải**; 100 màn là mục tiêu thiết kế, **chưa có bộ 100 level production**.

## License

Source demo được tạo riêng cho dự án này. Có thể sửa đổi, tích hợp vào prototype nội bộ, port sang Unity/Cocos hoặc dùng làm cơ sở nghiên cứu game loop. Các emoji phụ thuộc font của hệ điều hành.
