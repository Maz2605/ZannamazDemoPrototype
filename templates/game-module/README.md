# Module game mẫu

Copy thư mục này thành `games/my-game/`, đổi `id` duy nhất trong game.json, cập nhật metadata và thêm `./games/my-game/game.json` vào catalog.json.

Thay index.html, src và thumbnail bằng bản export của game. Mọi dependencies/assets phải ở trong module; không import code từ thư viện hoặc game khác. Dùng đường dẫn tương đối, không dùng `/assets/...`.

Module không cần API khởi động/dừng: index.html là entry, iframe là lifetime của phiên chơi. Không truy cập window.parent/top hoặc đăng ký service worker ra ngoài thư mục module. Nếu dùng localStorage/IndexedDB/cache, đặt tên theo `my-game:`. Tránh target _top cho liên kết.

orientation nhận portrait, landscape hoặc responsive. levelCount là tùy chọn; bỏ nếu game không chia màn. rules và controls phải có ít nhất một dòng; notes có thể là []. thumbnail hỗ trợ PNG, WebP, JPG hoặc SVG. entry và thumbnail phải nằm trong thư mục module.

Chạy HTTP server từ thư mục gốc rồi truy cập trực tiếp module để kiểm tra độc lập trước khi đăng ký. Chạy `node tools/validate-catalog.mjs` từ root để kiểm tra sau khi đăng ký.
