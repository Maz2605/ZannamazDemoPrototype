# Paint Match 🎨

Trò chơi giải đố Match-3 kết hợp vẽ tranh Pixel Art: Người chơi hoán đổi các bạn giọt sơn đáng yêu để ghép chuỗi màu, bắn những giọt sơn lên khung tranh và hoàn thiện bức tranh nghệ thuật.

---

## 📁 Cấu trúc Module Tách Rời (Architecture)

Toàn bộ trò chơi được chia nhỏ thành các module độc lập theo nguyên tắc tách biệt mối quan tâm (Separation of Concerns), giúp việc bảo trì, cải tiến và mở rộng cực kỳ dễ dàng:

```
games/paint-match/
├── game.json              # Khai báo metadata cho Prototype Arcade
├── index.html             # Khung DOM, layout giao diện và modal
├── thumbnail.svg          # Ảnh đại diện vector sắc nét
├── RUN_DEMO.cmd           # Chạy nhanh demo trên trình duyệt mặc định
├── README.md              # Tài liệu kiến trúc và hướng dẫn mở rộng
└── src/
    ├── constants.js       # Bảng màu (COLORS), kích thước (6x6, 8x8), loại blocker, layout
    ├── levels.js          # Dữ liệu 10 màn chơi, ma trận tranh pixel, luật chướng ngại vật
    ├── engine.js          # Logic thuần: tìm chuỗi match, hoán đổi, nổ cọ/xô, trọng lực, loang mực, thắng/thua
    ├── renderer.js        # Đồ họa Canvas: vẽ giọt sơn biểu cảm, hạt bay parabol, tia sáng, khung tranh
    ├── audio.js           # Bộ tổng hợp âm thanh Web Audio API (không phụ thuộc file âm thanh ngoài)
    ├── game.js            # Điều khiển chính: bắt sự kiện touch/mouse, quản lý HUD, modal và animation loop
    └── styles.css         # Phong cách màu pastel, dark mode, responsive và chuẩn giao diện thiết bị
```

---

## 🧩 Chi tiết các thành phần

### 1. `constants.js`
- Bảng mã màu giọt sơn: Hồng thạch (`P`), Đỏ dâu (`R`), Cam đào (`O`), Vàng chuối (`Y`), Xanh bơ (`G`), Xanh trời (`B`), Tím (`V`), Mực than (`K`), Trắng sữa (`W`), Nâu (`N`).
- Phân loại kỹ năng đặc biệt: `SPECIAL.BRUSH` (ghép 4 ô - quét cả hàng), `SPECIAL.BUCKET` (ghép 5 ô - xóa toàn bộ ô cùng màu).
- Phân loại chướng ngại vật: `BLOCKER.STONE` (đá), `BLOCKER.INK` (quái vật mực loang).

### 2. `levels.js`
- Chứa 10 màn chơi pixel art 8x8 phong phú:
  1. **Trái tim**: Làm quen ghép 3 và tô màu.
  2. **Nấm đỏ**: Giới thiệu Cọ quét hàng (ghép 4) và Xô thần kỳ (ghép 5).
  3. **Mèo cam**: Giới thiệu Đá tảng (🪨) cần ghép sát cạnh để phá.
  4. **Thỏ trắng**: Giới thiệu Ô bị lồng xích nhốt (⛓️).
  5. **Ếch xanh**: Giới thiệu Ô tranh bị khóa (🔒) và cơ chế chạm tranh chọn trọng tâm.
  6. **Vịt vàng**: Giới thiệu Ô tranh sơn 2 lớp (x2).
  7. **Hoa hồng**: Giới thiệu Quái vật mực loang (🖤) sinh sôi định kỳ.
  8. **Gấu trúc**: Thử thách kết hợp Ô ẩn bí mật (❓), Đá và Lồng nhốt.
  9. **Tên lửa**: Tổng hợp độ khó cao: đá, mực, khóa và 2 lớp sơn.
  10. **Bánh cupcake**: Màn chơi đỉnh cao kết hợp toàn bộ chướng ngại vật.

### 3. `engine.js`
- Thuần JavaScript Logic (không phụ thuộc DOM hay Canvas), cho phép chạy kiểm thử độc lập (Unit Test) qua Node.js:
  - `createGame(levelIndex)`: Khởi tạo bàn cờ và tranh pixel.
  - `findRuns(grid)`: Tìm các chuỗi nối >= 3 ô.
  - `swap(G, a, b)`: Xử lý hoán đổi thường và hoán đổi xô sơn thần kỳ.
  - `resolveBoard(G)`: Giải quyết chuỗi nổ liên hoàn (cascades) và kích hoạt cọ vẽ.
  - `fixMoves(G)`: Tự động phát hiện deadlock và xáo lại bàn cờ thông minh.
  - `afterTurn(G)`: Tính số lượt đi, loang mực và đánh giá điều kiện thắng/thua.

### 4. `renderer.js`
- Vẽ Canvas 2D mượt mà với 60 FPS:
  - Vẽ từng giọt kẹo có mắt to tròn, đốm sáng phản chiếu, má hồng đáng yêu.
  - Hiệu ứng giọt sơn bay theo đường cong parabol mượt mà khi người chơi ghép thành công.
  - Vòng tròn nét đứt đánh dấu ô mục tiêu đang được người chơi ưu tiên bắn màu.
  - Hạt tia sáng lấp lánh (sparkles) bung tỏa khi màu chạm đích trên tranh.

### 5. `audio.js`
- Sử dụng Web Audio API để phát âm thanh sống động mà không cần tải bất kỳ file `.mp3` hay `.wav` bên ngoài.
- Tự động lưu trạng thái bật/tắt âm thanh vào `localStorage`.

---

## 🚀 Hướng Dẫn Thêm Màn Chơi Mới

Để thêm một màn chơi mới, chỉ cần thêm 1 đối tượng vào mảng `RAW_LEVELS` trong [src/levels.js](file:///d:/Zanamaz/ZannamazDemoPrototype/games/paint-match/src/levels.js):

```javascript
{
  n: 'Ngôi sao nhỏ',
  icon: '⭐',
  a: [
    '...YY...',
    '..YYYY..',
    'YYYYYYYY',
    '.YYYYYY.',
    '..YYYY..',
    '.YY..YY.',
    'YY....YY',
    '........'
  ],
  m: 25,
  stones: [14, 21],
  info: ['Thử thách bức tranh ngôi sao lấp lánh!']
}
```

Bảng chọn màn (`lvl-modal`), số lượng màn (`Levels.count()`), và game engine sẽ tự động thích ứng ngay lập tức!

