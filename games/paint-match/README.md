# Paint Match 🎨

Trò chơi giải đố **Nghệ nhân Pha màu (Color Alchemy)** kết hợp giá vẽ tranh Pixel Art khổng lồ và bộ sưu tập Bảo tàng Tranh cá nhân.

---

## 🌟 Những Điểm Đột Phá Mới Nhất

### 1. 🧪 Cơ chế Pha màu thực thụ (Color Alchemy)
- **Nối dải chuyển màu**: Người chơi có thể vuốt dải từ màu gốc này sang màu gốc khác kề bên để pha chế ra màu thứ cấp tương ứng:
  - 🔴 **Đỏ (`R`) + 🟡 Vàng (`Y`) = 🟠 Cam đào (`O`)**
  - 🔵 **Xanh dương (`B`) + 🟡 Vàng (`Y`) = 🟢 Xanh bơ (`G`)**
  - 🔴 **Đỏ (`R`) + 🔵 Xanh dương (`B`) = 🟣 Tím oải hương (`V`)**
  - 🔴 **Đỏ (`R`) + ⚪ Trắng (`W`) = 🌸 Hồng thạch (`P`)**
- **Hiệu ứng thị giác ma thuật**: Đường nối tự động chuyển màu Gradient mượt mà, kèm âm thanh pha màu huyền ảo (Magic Alchemy Chime) và giọt sơn pha phát sáng hào quang hai màu bay lên tranh!

### 2. 🏛️ Bộ sưu tập Bảo tàng Tranh & Hệ thống 3 Sao (Gallery Museum)
- Tích hợp phòng triển lãm **Bảo tàng Tranh cá nhân** (bấm nút `🏛️` trên header).
- Mỗi màn chơi khi hoàn thành được đánh giá **1 đến 3 Sao (⭐⭐⭐)** dựa trên số lượt đi còn dư và lưu vĩnh viễn vào `localStorage`.
- Khung tranh mạ vàng lấp lánh cho các tác phẩm đã vẽ, cho phép xem lại thành tích hoặc vẽ lại bất cứ lúc nào.

### 3. 🔄 Trục lăn băng chuyền động (Conveyor Belts)
- Ở các màn chơi nâng cao (màn 4, 7, 9, 10), xuất hiện các hàng hoặc cột có **mũi tên băng chuyền dạ quang**.
- Sau mỗi lượt đi, toàn bộ các giọt trên hàng/cột này sẽ **tự động trượt 1 bước** (wrap-around), đòi hỏi người chơi phải có khả năng dự đoán vị trí kẹo sắp tới.

### 4. 🖼️ Giá vẽ tranh khổng lồ (272px x 272px)
- Tranh pixel chiếm trọn 76% chiều rộng canvas, mỗi ô pixel 32px nổi khối 3D thạch bóng láng.
- Thanh **Color Goals Tracker** hiển thị chi tiết số lượng giọt màu tranh còn thiếu hoặc tích xanh `✓`.

---

## 🚀 Kiểm thử & Trải nghiệm Trực tiếp

- Chạy test tự động:
  ```bash
  node tools/validate-catalog.mjs
  node --test
  ```
- Chạy trực tiếp demo: Mở [`games/paint-match/RUN_DEMO.cmd`](file:///d:/Zanamaz/ZannamazDemoPrototype/games/paint-match/RUN_DEMO.cmd) hoặc chạy [`games/paint-match/index.html`](file:///d:/Zanamaz/ZannamazDemoPrototype/games/paint-match/index.html).
