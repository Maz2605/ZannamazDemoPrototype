# Slice Cut — Tiệm Bánh Nhỏ 🍰

Trò chơi giải đố cắt bánh chia kẹo màu sắc ngọt ngào dành cho mọi lứa tuổi, đặc biệt thân thiện và lôi cuốn với trẻ em.

## Tính năng phiên bản v0.3
- **20 màn chơi đa dạng**: Bổ sung thêm 10 màn chơi mới, nâng tổng số màn lên 20 màn với độ thử thách tăng dần.
- **Loại bỏ cơ chế chuyển động thời gian thực**: Đã gỡ bỏ hoàn toàn thanh xoay (`rot`) và thanh trượt (`slide`) để người chơi tập trung trọn vẹn vào tư duy hình học và logic giải đố.
- **Blocker & Cơ chế mới**:
  - 🧊 **Tảng Băng Kem Đường (`ice`)**: Khối tinh thể băng kem siêu cứng mang biểu tượng `❄️`, lưỡi dao không thể cắt xuyên qua.
  - ⭐ **Kẹo Ngôi Sao Vạn Năng (`star`)**: Viên kẹo đặc biệt có thể đứng chung với bất kỳ màu kẹo nào mà vẫn hợp lệ.
  - 🔩 **Thanh Thép Rắn Chắc (`steel`)**: Cản trở nhát cắt, tạo vách ngăn chia cắt không gian.
  - 💣 **Bom Đen Hoạt Hình (`bomb`)**: Chém trúng sẽ kích nổ bùm `💥`.
  - 🧵 **Dây Nơ Ruy Băng (`rope`)**: Kết nối các bạn kẹo, không được cắt đứt dây.
- **Bảng chọn màn chơi 20 level**: Chọn nhanh bất kỳ màn nào trực tiếp từ menu điều hướng.
- **Hiệu ứng cắt nảy nhẹ mềm mại**: Khi cắt bánh, hai nửa bánh đàn hồi nảy nhẹ ~3.5px và lướt êm về vị trí cũ mà không bị co nhỏ hay biến dạng hình học.

## Cấu trúc module
- `game.json`: Khai báo metadata cho thư viện Prototype Arcade (20 màn chơi).
- `index.html`: Khung HTML độc lập của game.
- `src/styles.css`: Giao diện kẹo ngọt, responsive, modal chọn màn dạng lưới 20 ô.
- `src/levels.js`: Danh sách 20 màn chơi (`LV`) với các bài toán hình học cân bằng.
- `src/engine.js`: Thuật toán hình học cắt đa giác, kiểm tra va chạm vật cản, hỗ trợ logic Kẹo Sao vạn năng.
- `src/game.js`: Controller điều khiển trò chơi, âm thanh Web Audio và render canvas tốc độ cao.
