# Prototype Arcade

Thư viện demo game bằng HTML/CSS/JavaScript thuần. Mỗi game là một module tự chạy, có code, assets và metadata riêng. Trang thư viện chỉ đọc danh mục và mở một iframe khi bạn bấm chơi.

## Chạy local

Yêu cầu Node.js 20 trở lên, không cần `npm install`.

```powershell
node tools/serve.mjs
```

Mở **http://localhost:8080**. Trên Windows có thể nhấp đúp `RUN_LIBRARY.cmd`. Ctrl+C để dừng server. Nếu cổng đang dùng:

```powershell
$env:PORT = '8082'
node tools/serve.mjs
```

Thư viện tải JSON qua HTTP: không mở bằng `file://`. Spirit Grove vẫn có thể mở trực tiếp bằng `games/spirit-grove/index.html` hoặc `games/spirit-grove/RUN_DEMO.cmd`.

## Thêm game trong 5 bước

1. Copy `templates/game-module/` thành `games/my-game/`.
2. Thay trang mẫu bằng bản export web của game; giữ mọi code/assets/dependencies trong module.
3. Điền `games/my-game/game.json`, đổi `id` duy nhất, thumbnail và luật chơi.
4. Thêm đường dẫn metadata vào `catalog.json`:

```json
{
  "games": [
    "./games/spirit-grove/game.json",
    "./games/my-game/game.json"
  ]
}
```

5. Kiểm tra và mở lại thư viện:

```powershell
node tools/validate-catalog.mjs
```

Không sửa `assets/library.js` khi thêm game. Để ẩn hoặc xóa một game khỏi thư viện, bỏ dòng tương ứng khỏi catalog; thư mục có thể được giữ lại để mở độc lập. Thứ tự trong catalog là thứ tự thẻ hiển thị.

## Hợp đồng metadata

Xem ví dụ đầy đủ ở `templates/game-module/game.json`.

| Trường | Quy định |
| --- | --- |
| id | Duy nhất; chữ thường, số và dấu gạch nối, ví dụ `spirit-grove` |
| title, category, version, description | Chuỗi không rỗng; version dùng chuỗi như `"0.1"` |
| entry | Trang chạy độc lập, ví dụ `./index.html` |
| thumbnail | Đường dẫn ảnh PNG/WebP/JPG/SVG |
| orientation | `portrait`, `landscape` hoặc `responsive` |
| levelCount | Số nguyên dương, tùy chọn; bỏ nếu game không chia màn |
| rules, controls | Mảng chuỗi, ít nhất một dòng |
| notes | Mảng chuỗi; có thể là `[]` |

`entry` và `thumbnail` được giải tương đối với vị trí game.json, phải nằm trong chính module, không dùng URL ngoài, query hoặc fragment. Các file được game tự nạp cũng dùng đường dẫn tương đối, ví dụ `./src/game.js`, không dùng `/src/game.js`.

Metadata lỗi không làm mất các game hợp lệ khác; thư viện hiển thị thông báo, chi tiết có trong browser console. Validator chỉ rõ file lỗi và trả exit code 1. Thumbnail lỗi khi chạy có hình thay thế. Nếu demo tải lâu, có nút chạy lại và mở tab riêng.

## Ranh giới giữa các module

- Mỗi module tự chạy từ index.html, không import code từ thư viện hoặc game khác.
- Thư viện không gọi gameplay API, không đọc/ghi state và không có engine chung.
- Xem luật không tải game. Chỉ một iframe hoạt động; đóng/chạy lại/chuyển demo sẽ hủy document cũ. Đóng demo không mặc định lưu tiến trình.
- Demo nằm giữa màn hình với bộ chọn iPhone 15, iPhone 15 Pro Max, iPhone SE (3rd gen), Samsung Galaxy S24 Ultra và Google Pixel 8. Toàn bộ thân máy, màn hình, góc bo, camera và nút được scale đồng nhất, không kéo giãn riêng chiều rộng/cao. Mặc định là iPhone 15 Pro Max.
- Thay khung giữ nguyên iframe và phiên game, chỉ đổi kích thước viewport. Các preset ở `assets/devices.mjs`, phần vẽ khung ở `assets/devices.css`; thêm preset không sửa module gameplay. Đây là mô phỏng khung và viewport, không giả lập iOS/Android hoặc Safari.
- Luật chơi khi đang demo mở bằng nút Luật chơi dưới khung; panel luật không làm lệch vị trí điện thoại. Đóng/chạy lại/ngắt resize observer đều do shell quản lý, độc lập với module game.
- CSS và biến global nằm trong document riêng. Các module do bạn quản lý vẫn cùng origin, không phải sandbox bảo mật cho code không tin cậy.
- Không truy cập `window.parent`/`window.top` để điều khiển shell. Không đăng ký service worker vượt khỏi thư mục game.
- Nếu lưu localStorage, IndexedDB hoặc cache, dùng tiền tố ID riêng: `spirit-grove:progress`, `my-game:settings`.
- Nếu dùng framework, đưa **bản export tĩnh** vào module và cấu hình asset base tương đối. Game cần backend nằm ngoài phạm vi V1.

## Deploy

### Chia sẻ QR cho từng game

Mỗi thẻ có nút **Chơi trên điện thoại · QR**. QR mở trực tiếp entry của game trên trình duyệt điện thoại, không qua khung giả lập của thư viện. Có nút sao chép link và tải QR dạng SVG.

Khi bấm Chơi demo, QR tự hiện bên trái; luật chơi, điểm nổi bật và điều khiển luôn hiện bên phải. Khung máy vẫn ở giữa màn hình. Trên màn hình hẹp, các panel xếp dưới máy để cuộn xem. Mỗi module có thể khai báo `features` là mảng các điểm nổi bật ngắn trong game.json; trường này là tùy chọn. Đóng/chuyển demo sẽ giải phóng QR của phiên trước.

Link được lấy động từ URL metadata/entry trên website đang mở: không ghi cứng hostname, domain hay tên repository. Deploy lên Netlify, Vercel, GitHub Pages (kể cả `/repository-name/`) hoặc domain riêng rồi mở site đó để tạo QR đúng địa chỉ. Module mới được đăng ký trong catalog sẽ tự có nút QR.

Nếu đang xem `localhost` hoặc `127.0.0.1`, QR cũng chứa địa chỉ local và điện thoại khác không truy cập được; giao diện có thông báo. Sau deploy, người quét chỉ cần Internet và site truy cập công khai, không cần cùng Wi-Fi hoặc cài app. Site có mật khẩu/access control vẫn yêu cầu quyền truy cập như khi mở link thường.

QR là ảnh chứa URL tại thời điểm tạo. Nếu đổi domain hoặc đường dẫn game, tạo/tải QR mới; QR đã in trước đó chỉ tiếp tục dùng được nếu giữ URL cũ hoặc cấu hình redirect. Không có dịch vụ redirect hay backend trong V1. Sinh QR bằng thư viện MIT được lưu trong assets/vendor, không gửi link tới dịch vụ tạo QR bên ngoài.

Tạo bản website để upload (Node.js 20+, không cần `npm install`):

```powershell
node tools/validate-catalog.mjs
node tools/build-site.mjs
```

Upload thư mục **`dist/`** vừa tạo. Thư mục này chứa thư viện, catalog, assets, game và liên kết Spirit Grove cũ; không chứa tests, công cụ phát triển hoặc tài liệu thiết kế. `dist/` được tạo lại mỗi lần build và không commit vào Git. Source, tests, templates và docs vẫn giữ trong repository để phát triển tiếp.

### Vercel

Import Git repository chứa website. Chọn Root Directory là thư mục gốc website; Framework Preset **Other**; Build Command để trống (bật override nếu cần); Output Directory **`.`**. File vercel.json đặt framework null và output directory rõ ràng. Không dùng SPA rewrite về index.html vì game có trang riêng.

Tài liệu: https://vercel.com/docs/builds/configure-a-build

### Netlify

Import repository, chọn branch **`main`**. Base Directory để trống (root repository); Build Command là **`node tools/validate-catalog.mjs && node tools/build-site.mjs`**, Publish Directory là **`dist`**. `netlify.toml` đã khai báo các giá trị này và Node.js 22. Không cần cài dependencies hoặc SPA redirect. Catalog lỗi sẽ dừng deploy.

Nếu deploy thủ công, chạy hai lệnh phía trên rồi kéo thả **`dist/`**, không kéo thư mục source gốc.

Tài liệu: https://docs.netlify.com/deploy/create-deploys/

### GitHub Pages

Đưa nội dung website vào root repository. Vào **Settings → Pages → Deploy from a branch**, chọn branch chứa website và **/(root)**. File .nojekyll đã có để phục vụ static files. URL thường là `https://<user>.github.io/<repository>/`; mọi đường dẫn của thư viện/module dùng tương đối để hỗ trợ tiền tố repository.

Nếu đặt website sâu trong một monorepo, cần workflow Pages upload đúng thư mục website; cách đơn giản nhất cho V1 là repository riêng với website ở root.

Tài liệu: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Kiểm chứng

```powershell
node tools/validate-catalog.mjs
node --test tests
```

Tests bao gồm metadata/path/ID/file lỗi, metadata tải một phần, tìm kiếm tiếng Việt, URL dưới repository và engine của toàn bộ 10 màn Spirit Grove. Chúng không thay thế browser QA hoặc chứng minh số bước tối ưu của từng màn.

Server local còn phục vụ `http://localhost:8080/repository-name/` để kiểm tra đường dẫn kiểu GitHub Pages. Kiểm tra UI ở 360/768/1440px, mở luật rồi chơi, Undo/Restart/Hint, Escape trong iframe, đóng và mở lại phiên mới, tìm kiếm/bộ lọc.

## Spirit Grove

Prototype puzzle SVG 2.5D gồm 10 màn. Xoay vùng 2×2 để đưa các loài về đúng cột; có tutorial màn đầu, phong ấn, trục một chiều, khóa ấn theo linh thú và bánh răng ngược chiều. Chưa có lưu tiến trình hoặc solver gợi ý cho mọi trạng thái.

Game, docs thiết kế và level authoring ở `games/spirit-grove/`. URL cũ `SpiritGrove_DemoPrototypeGame_Source/index.html` chuyển đến entry mới. Không có bản game thứ hai bị nhân đôi.

## Nguồn thông số khung điện thoại

Tỷ lệ thân máy lấy từ chiều rộng/cao công bố bởi hãng. Tỷ lệ màn hình dựa trên độ phân giải; viewport logical là preset phục vụ demo. Chi tiết vật liệu, góc bo và camera được minh họa bằng CSS/SVG.

- iPhone 15: https://support.apple.com/en-us/111831
- iPhone 15 Pro Max: https://support.apple.com/en-nz/111828
- iPhone SE (3rd gen): https://support.apple.com/en-om/111866
- Galaxy S24 Ultra: https://www.samsung.com/ca/business/smartphones/galaxy-s/galaxy-s24-ultra-titanium-black-1tb-sm-s928wzknxac/
- Pixel 8: https://support.google.com/pixelphone/answer/7158570?hl=vi
