# Thiết kế thư viện web game

Ngày: 2026-11-06. Trạng thái: đã triển khai theo kế hoạch module độc lập được người dùng duyệt.

## Mục tiêu và quyết định đã chốt

Người dùng cần một website trưng bày nhiều game, có thumbnail đủ lớn, lưới thẻ đều nhau, luật chơi ngắn và demo chạy trực tiếp. Đã chọn HTML/CSS/JavaScript tĩnh để dễ thêm game và triển khai trên Vercel, Netlify hoặc GitHub Pages.

Không cần backend, tài khoản, cơ sở dữ liệu hay npm cho phiên bản này. Website được chuẩn bị để người dùng tự deploy lên dịch vụ đã chọn; chưa yêu cầu xuất bản lên tài khoản hosting trong phiên này.

## Phân tích project hiện tại

Đã đọc README.md, docs/GAME_DESIGN.md, index.html và source Spirit Grove. Source được chuyển từ SpiritGrove_DemoPrototypeGame_Source vào games/spirit-grove; URL index.html cũ được giữ bằng trang chuyển hướng.

Game hiện có là Spirit Grove: prototype puzzle SVG 2.5D, không phải Unity/WebGL. index.html:65-68 nạp lần lượt levels.js, engine.js, art.js, game.js. Không có dependency bên ngoài hoặc bước biên dịch.

Luồng hoạt động:

1. levels.js khai báo 10 màn, trạng thái đầu, vòng khóa, vòng liên kết và lời giải mẫu.
2. game.js:32-35 kiểm tra dữ liệu màn; game.js:213 khởi động màn đầu bằng load(0).
3. Click mũi tên đi qua game.js:185-187 tới turn(), gọi Engine.spin().
4. engine.js:15-36 xoay bốn vị trí, xử lý vòng liên kết và trả trạng thái mới cùng ánh xạ animation.
5. game.js lưu lịch sử, cập nhật trạng thái, render qua art.js rồi kiểm tra thắng.
6. engine.js:7 yêu cầu mọi con vật có ID tương ứng với cột đang đứng.

Ownership và lifetime:

| Thành phần | Sở hữu | Khởi tạo / kết thúc |
| --- | --- | --- |
| levels.js | Dữ liệu màn | Nạp cùng trang; kết thúc cùng document |
| engine.js | Hàm luật chơi thuần | Không giữ DOM, timer hay listener |
| art.js | Hàm tạo SVG | Controller gọi khi render |
| game.js | State, history, completed, timer, listener | Nạp cùng document; listener tồn tại suốt document |
| Trang thư viện đề xuất | Danh mục, tìm kiếm, bộ lọc và hộp demo | Tạo iframe khi chơi; loại bỏ iframe khi đóng |

Giới hạn hiện có: completed chỉ là Set trong RAM, chưa lưu tiến trình sau reload. Hint chỉ theo lời giải mẫu; trạng thái đi lệch được hướng dẫn Undo. GAME_DESIGN.md mô tả hướng phát triển 3D và 100+ màn; implementation hiện tại vẫn là SVG và 10 màn. Đây là phạm vi prototype, không phải tính năng đã có.

Kiểm chứng đã chạy: dùng Node VM nạp chính levels.js và engine.js, gọi Engine.verify() cho toàn bộ 10 màn; tất cả đạt. Chưa chạy BFS xác minh par, chưa chạy browser/PlayMode; không suy ra kết quả đó từ kiểm tra lời giải mẫu.

## Các hướng đã cân nhắc

1. Website tĩnh: ít thành phần, không cần build, phù hợp demo hiện có. Đây là hướng người dùng đã chọn.
2. React/Vite: phù hợp nếu sau này có nhiều màn hình hoặc state phức tạp, nhưng thêm dependency và bước build chưa cần thiết.

## Giao diện đề xuất

- Tên tạm: Prototype Arcade. Nội dung chính bằng tiếng Việt, tên game giữ nguyên.
- Phong cách: nền tối xanh mực, chữ sáng, điểm nhấn xanh lá, hợp hình diorama của Spirit Grove. Dùng system font, không phụ thuộc font/CDN.
- Header gọn với tên thư viện và liên kết tới danh sách game.
- Phần giới thiệu ngắn, số lượng game thật và nút khám phá thư viện.
- Thanh tìm kiếm theo tên/mô tả và lọc thể loại từ dữ liệu danh mục.
- Grid dùng cột đều nhau, khoảng cách 24px; thẻ khoảng 300–380px trên desktop. Tablet hai cột nếu đủ chỗ; mobile một cột. Khi chỉ có một game, thẻ giữ kích thước hợp lý.
- Thumbnail tỷ lệ 16:10, lấy ảnh preview hiện có; hiển thị tên, thể loại, số màn và mô tả 1–2 câu.
- Hai hành động rõ ràng: Chơi demo và Luật chơi.
- Không tạo các game giả để lấp grid. Thêm game mới tự sinh thẻ mới.
- Có trạng thái không tìm thấy kết quả và nút xóa bộ lọc.

## Demo và tài liệu mỗi game

Theo bổ sung mới nhất của người dùng, demo có bộ chọn iPhone 15, iPhone 15 Pro Max (mặc định), iPhone SE (3rd gen), Galaxy S24 Ultra và Pixel 8. Mỗi preset có tỷ lệ thân/màn hình riêng, góc bo và camera phù hợp. Khung có kích thước logical cố định và chỉ áp dụng một scale chung cho toàn bộ máy, luôn ở giữa viewport. Iframe dùng viewport của preset; đổi máy chỉ đổi kích thước iframe, giữ nguyên document và trạng thái game. Preset ở assets/devices.mjs; style ở assets/devices.css. Đây là mô phỏng khung, không giả lập hệ điều hành. Nút Luật chơi dưới máy mở panel nổi mà không dịch chuyển máy; mở luật từ thẻ vẫn không tải iframe.

Chỉ gán src iframe sau thao tác chơi. Có nút đóng, chơi lại và mở game trong tab riêng. Đóng bằng nút hoặc Escape khi focus ở trang thư viện; Escape bên trong iframe cần được chuyển tới shell cho game cùng origin nếu triển khai. Hộp thoại quản lý focus, khôi phục focus về nút đã mở và khóa cuộn nền. Đóng demo sẽ loại bỏ iframe để dừng document và tài nguyên của game; lượt chơi hiện tại sẽ mất và điều này được ghi cạnh nút đóng.

Luật Spirit Grove:

1. Đưa các linh thú về đúng cột theo biểu tượng trên bệ.
2. Bấm mũi tên để xoay bốn vị trí trong vùng 2×2; mỗi lần tính một lượt.
3. Vòng bị phong ấn không xoay được; vòng liên kết khiến vòng còn lại xoay ngược.
4. Dùng Undo, Restart hoặc Gợi ý khi cần. Có thể chọn trực tiếp cả 10 màn.

Ghi rõ đây là bản prototype 10 màn; hint theo lời giải mẫu và tiến trình chưa được lưu sau khi đóng demo. Không tuyên bố có 3D, lưu cloud hoặc 100 màn.

## Tổ chức module đã triển khai

Mỗi module nằm trong games/<id>/, tự chạy bằng index.html và tự sở hữu toàn bộ code/assets/state. Thư viện chỉ đọc metadata, không import gameplay hoặc gọi Debug API.

```text
F:/DemoPrototypeGame/
  index.html
  assets/library.css
  assets/library.js
  assets/catalog.mjs                   # Hợp đồng metadata, không chứa gameplay
  catalog.json                        # Chỉ danh sách đường dẫn metadata
  games/spirit-grove/                  # Source duy nhất của game
    game.json                         # Luật, giới thiệu, entry, thumbnail
    index.html
    src/
  templates/game-module/              # Module mẫu tự chạy
  tools/validate-catalog.mjs
  tools/serve.mjs
  tests/
  SpiritGrove_DemoPrototypeGame_Source/index.html  # Chuyển hướng URL cũ
  docs/game-library-design.md
  README.md                           # chạy local, thêm game, deploy
  vercel.json
  netlify.toml
  .nojekyll
```

catalog.json chứa mảng games với đường dẫn ./games/<id>/game.json. Mỗi metadata khai báo id, title, category, version, description, thumbnail, entry, orientation, rules, controls, notes và levelCount tùy chọn. entry/thumbnail tính từ game.json và nằm trong module. Dùng HTTP server để tải JSON; không hỗ trợ thư viện qua file://. Thêm game bằng cách chép module mẫu và thêm một dòng đăng ký; không sửa logic shell. Asset/demo URL đều tương đối để chạy dưới repository subpath. Dữ liệu văn bản render bằng textContent.

Iframe tách document, CSS và global của game; chỉ một iframe hoạt động. Đây là module tin cậy cùng origin, không phải security sandbox. Game phải tự đặt namespace storage theo id và không điều khiển parent/top. Xem README và templates/game-module/README.md để thêm game.

## Deploy và kiểm thử dự kiến

Publish thư mục gốc website, không cần build. Vercel dùng Other/static, Netlify dùng publish directory '.', GitHub Pages publish từ root và có .nojekyll. README chỉ rõ root cần chọn để không deploy nhầm thư mục game riêng.

Kiểm thử cần thực hiện sau triển khai: kiểm cú pháp JS; URL thumbnail/script/demo tồn tại; lưới desktop và mobile; tìm kiếm/bộ lọc/reset; mở và đóng demo; iframe được giải phóng; focus/keyboard; chọn màn, xoay, Undo, Restart và lời giải thắng; thử phục vụ cả dưới root và dưới subpath giống GitHub Pages.

## Quyết định triển khai

Người dùng đã duyệt kế hoạch và yêu cầu triển khai. Bố cục grid + hộp demo có luật chơi, phong cách tối xanh mực và danh mục module JSON thay thế đề xuất games.js ban đầu. Không publish tự động. Kiểm chứng cụ thể được ghi trong docs/verification.md sau browser QA.

Rà soát độc lập: thiết kế khả thi, không có quyết định kỹ thuật còn thiếu cần hỏi thêm. Khi triển khai cần crop thumbnail để bàn chơi rõ, cho iframe cuộn đủ toàn bộ game portrait, xử lý lỗi truy cập iframe khi mở bằng file:// và đặt rõ output directory của Vercel.
