# Spirit Grove — Animal Diorama Puzzle (15-level Web Prototype · 8 Blockers)

**Phiên bản:** 0.2 · **Nền tảng:** Web / Mobile Portrait 9:16 · **Ngôn ngữ:** HTML + CSS + JavaScript thuần.

Dự án đóng gói phiên bản nâng cấp của demo **Spirit Grove**. Đây là **prototype 2.5D bằng SVG** với hệ thống âm thanh Web Audio API tổng hợp, góc camera tối ưu hóa góc nhìn ngã tư và 8 cơ chế Blocker giải đố.

## Chạy game

1. Module nằm tại `games/spirit-grove/` trong repository.
2. Nhấp đúp `index.html` hoặc `RUN_DEMO.cmd` trong module để chạy riêng bằng Chrome/Edge.
3. Để chạy qua thư viện: từ thư mục gốc repository chạy `node tools/serve.mjs`, sau đó mở `http://localhost:8080`.
4. Nhấn level **1–15** để test độc lập, không cần hoàn thành màn trước.

Không cần npm, bundler, tải asset ngoài, tài khoản hay internet.

## 8 Hệ thống Blocker

1. **Phong ấn đá cổ (`blocked`):** 🔒 Vòng xoay cố định bị khóa cứng hoàn toàn.
2. **Trục một chiều (`oneWay`):** ↻/↺ Chỉ cho phép xoay theo hướng nhãn `←` hoặc `→`.
3. **Ấn cổ ngữ đơn (`seals`):** ①–⑥ Trục chỉ mở khi có đúng linh thú đứng trên bệ mang cùng ký hiệu.
4. **Bánh răng ngược chiều (`link` multiplier = -1):** ⚙️ Hai trục liên kết xoay ngược chiều nhau.
5. **Bánh răng song sinh (`link` multiplier = 1):** 🪞 Hai trục xoay cùng chiều đồng điệu.
6. **Bẫy gai cấm loài (`traps`):** 🥀 Bệ đá có bẫy gai cấm một loài thú cụ thể bước vào.
7. **Ấn băng giá (`frost`):** ❄️ Trục bị đông cứng trong khối băng, chỉ tan khi Cáo 🦊 sưởi ấm bệ kề bên.
8. **Khóa ấn linh thú kép (`dualSeals`):** ☯️ Trục chỉ mở khi đồng thời cả 2 loài linh thú đứng ở 2 bệ kích hoạt ☯₁ và ☯₂.

## Âm thanh & Góc Camera

- **Hệ thống Audio Procedural:** Tổng hợp âm thanh bằng Web Audio API thuần (không cần file mp3/wav ngoài), gồm tiếng chọn trục, trượt xoay, va chạm blocker, giải ấn ma thuật, hoàn thành màn và nhạc nền Ambient Zen rừng ngũ cung. Có nút bật/tắt 🔊/🔇 lưu trạng thái.
- **Tối ưu góc camera & điểm chạm ngã tư:** Góc nhìn camera nghiêng (isometric pitch) được căn chỉnh trực quan hơn, mở rộng kích thước vòng chạm ngã tư (`rx=56, ry=40`) và bổ sung thuật toán tự động bắt điểm (Smart Snapping) giúp người chơi chạm chọn bất kỳ ngã tư nào một cách chính xác tuyệt đối mà không bị linh thú che khuất.

## Cấu trúc source

```
DemoPrototypeGame/
├── index.html             # Cấu trúc UI
├── src/
│   ├── styles.css         # Responsive UI, góc cam, màu sắc, animation
│   ├── audio.js           # Web Audio API procedural synthesizer & BGM
│   ├── levels.js          # 15 level / 8 hệ thống blockers / lời giải
│   ├── engine.js          # Core rule, 8 blockers, win condition, validator
│   ├── art.js             # Tạo scene 2.5D SVG, linh thú, bệ đá, huy hiệu 8 blocker
│   ├── gesture.js         # Góc kéo trên mặt phẳng nghiêng, ngưỡng chốt thao tác
│   └── game.js            # Input, smart hub snapping, audio, UI, Undo/Hint
├── tools/
│   └── solve-spirit-grove.mjs # Kiểm chứng BFS tìm lời giải tối ưu cả 15 màn
```
