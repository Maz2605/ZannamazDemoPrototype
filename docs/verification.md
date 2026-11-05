# Kết quả kiểm chứng — 2026-11-06

## Chuẩn bị commit và deploy Netlify

- Repository mới trên branch `main`; giữ source, tests, templates, docs và giấy phép thư viện QR.
- Netlify chạy catalog validator và `tools/build-site.mjs`, publish `dist/`, dùng Node.js 22. Script đóng gói chạy được trên Node.js 20+ và không cần dependencies.
- `dist/` chỉ chứa runtime website, giấy phép QR và trang chuyển hướng Spirit Grove cũ; bỏ tools, tests, tài liệu thiết kế và launcher local khỏi bản deploy.
- Xóa script copy cố định sang ổ F đã không còn cần. Giữ `test-results/` trên máy theo lựa chọn của người dùng; cả `test-results/` và `dist/` bị loại khỏi Git.
- Kiểm chứng của các tính năng gameplay phía dưới là lịch sử; chưa deploy lên Netlify hoặc kiểm tra cảm ứng trên thiết bị thật trong lần chuẩn bị này.

## Trục một chiều, khóa ấn và tutorial màn đầu

- Thêm trục một chiều ở màn 4,5,7,8,9,10; khóa ấn theo vị trí con vật ở màn 6,8,9,10. Cặp bánh răng kiểm tra điều kiện cả hai thành viên trên trạng thái trước lượt xoay. Nước bị cấm không tính lượt và không preview theo chiều cấm.
- Khóa có dấu tương ứng trên trục và bệ kích hoạt; con vật rời bệ thì đóng lại. Undo phục hồi board và trạng thái khóa. Nhãn và bàn xoay nằm dưới lớp con vật.
- Tutorial màn 1: chọn trục vàng → vuốt phải; có minh họa tay, Bỏ qua, hỗ trợ bàn phím; Restart/vào lại màn khởi động tutorial. Nước sai không làm hỏng bàn tutorial.
- `node --test tests`: 26/26 PASS. `node tools/validate-catalog.mjs` và kiểm tra cú pháp engine/game/art PASS.
- `node tools/solve-spirit-grove.mjs`: 10/10 lời giải và par hợp lệ với BFS xuôi bằng engine production. Python validator độc lập cũng PASS 10/10; chạy bằng Python bundled vì alias `python` trên máy không hoạt động.
- Par hiện tại: 1,4,3,5,6,8,7,9,10,15. Màn 6/9/10 tăng từ 7/9/11 lên 8/10/15; không suy ra độ khó cảm nhận chỉ từ các số này.
- Browser Chrome headless: 13 nhóm regression PASS, gồm wrong-input/skip/restart/win tutorial, chiều cấm/được phép, ấn mở/đóng và Undo. Native mouse hai chiều, vuốt đầu con vật và iframe 65% PASS, không có page error. Đã xem ảnh tutorial/one-way/rune ở viewport 390px.
- Chưa playtest độ khó với người chơi, chưa thử cảm ứng trên thiết bị thật hoặc Safari/iOS.

## Sửa chiều vuốt bị ngược

- Đảo dấu chiều input ở cả preview và lúc chốt: vuốt trái → vòng +1, vuốt phải → vòng -1, để các con ở phía trước di chuyển cùng hướng tay. Đồng bộ phím trái/phải, biểu tượng hướng và gợi ý. Giữ nguyên độ nhạy 24px, dead zone 12px và hệ số preview 170px.
- 21/21 Node tests PASS, thêm regression kiểm tra trực tiếp tọa độ con vật phía trước khi preview và khi chốt cho cả hai hướng; test đã thất bại ở code cũ trước khi sửa.
- 10 nhóm browser regression và native mouse cả hai hướng ở 390px/iframe 65% PASS. Chưa thử cảm ứng trên thiết bị thật.

## Sửa bàn xoay che con vật và giảm độ nhạy thêm

- Toàn bộ hình bàn xoay được vẽ dưới lớp con vật, giữ đúng tâm ngã tư. Phần nhận chạm phía trên chỉ là ellipse hoàn toàn trong suốt, nên trục vẫn chọn được mà không che mặt/đầu.
- Ngưỡng chốt tăng từ 14 lên 24 CSS px; bỏ qua rung tay 12px; hệ số preview giảm từ 90°/110px xuống 90°/170px sau dead zone. Vuốt ngang trái/phải và giữ cụm đã chọn vẫn như cũ.
- 20/20 Node tests PASS, gồm regression lớp vẽ của mọi vòng trên cả 10 màn. Browser 10 nhóm regression, native mouse hai chiều, chọn trục rồi vuốt đầu con, iframe 65% đều PASS. Đã xem ảnh mới ở 390px xác nhận không che mặt con vật. Chưa thử cảm ứng trên thiết bị thật.
- Các thông số và kết quả phía dưới là lịch sử trước lần sửa này.

## Đơn giản hóa thao tác và đưa trục về ngã tư

- Trục ở đúng trung bình vị trí 4 bệ, không còn nâng lệch 32 đơn vị SVG. Đổi sang mặt trục nhỏ, vùng nhận chạm rộng hơn mặt vẽ.
- Một cách nhận vuốt duy nhất: phải → thuận chiều, trái → ngược chiều. Chạm chọn trục rồi vuốt ở bất kỳ đâu trên bàn, kể cả vùng trống hoặc con vật ngoài cụm; không tự đổi cụm. Giữ trục và vuốt luôn vẫn được.
- Bỏ qua rung tay 8 CSS px; chốt từ 14 CSS px ngang, yêu cầu hướng ngang rõ hơn hướng dọc (1.2 lần). Preview tối đa 90°, 18px tay chỉ preview khoảng 8°. Chốt 140ms, không có quán tính. Hướng dẫn và cụm đang chọn hiển thị ngay dưới bàn.
- Node: 19/19 PASS, bao gồm tâm trục chính xác ở mọi màn, hướng vuốt thống nhất từ mọi điểm, rung tay, vuốt dọc, đảo chiều và đích xoay.
- Browser: 10 nhóm regression PASS; native mouse hai chiều ở 390px, chọn trục rồi vuốt đầu con vật, iframe 65% PASS. Đã xem ảnh UI mobile. Chưa thử trên điện thoại cảm ứng thật.
- Các mục phía dưới là lịch sử tinh chỉnh trước đó.

## Tinh chỉnh độ nhạy và vuốt đầu con vật

- Giảm độ khuếch đại góc preview còn 60%; bỏ qua rung tay trong 5 CSS px. Chốt yêu cầu ít nhất 16 CSS px, với vuốt vòng cần góc tay 20°. Vuốt từ giữa trục dùng hướng kéo thẳng, không cần vẽ đường tròn.
- Chạm giữa trục chọn và đánh dấu cụm 4 con, sau đó vuốt trên đầu một con. Con vật thuộc nhiều vòng ưu tiên cụm đã chọn; không chọn thì dùng vòng khả dụng đầu tiên chứa con đó. Không thay luật xoay hay dữ liệu lời giải.
- Browser: chín nhóm regression PASS; kéo chuột thực PASS cả hai chiều ở 390px, chọn giữa rồi vuốt đầu con thuộc hai vòng, và iframe thu nhỏ 65%. Không có page error. Chưa kiểm tra cảm ứng trên thiết bị thật.
- Các số ngưỡng và số bài kiểm tra ở mục mâm xoay ban đầu bên dưới là lịch sử của lần triển khai trước khi tinh chỉnh này.

## Cập nhật mâm xoay kéo quanh trục — yêu cầu mới đã được duyệt

- Đã đổi hai nút xoay thành trục/mâm xoay kéo trực tiếp, preview theo tay và chốt 90° khi thả đủ 30° + 12 CSS px. Không đổi engine hoặc lời giải màn.
- `node --test tests`: 17/17 PASS, gồm bốn bài mới về ngưỡng kéo, góc qua ±180°, dead zone và đích quay trên mặt phẳng nghiêng của toàn bộ 10 màn.
- Browser Chrome headless: bảy nhóm regression PASS cho tap/kéo ngắn/hủy/mất capture, preview 4 con, Undo, pointer phụ, vòng khóa, preview 8 con liên kết ngược chiều, Restart/chuyển màn, bàn phím và thắng màn đầu.
- Kéo chuột thực/native pointer capture: PASS hai chiều ở viewport 390px; PASS trong iframe thu nhỏ 65%. Không có JavaScript page error trong lượt chạy.
- Đã xem ảnh idle và đang kéo, sửa lớp vẽ và nâng tay nắm để giữ mặt các con vật rõ ràng. Ảnh QA ở `test-results/drag-wheel/`, không thuộc catalog production.
- Chạy browser QA tùy chọn: `node tools/prepare-drag-wheel-qa.mjs`, sau đó `node --preserve-symlinks tools/check-drag-wheel-browser.cjs` với `NODE_PATH` trỏ tới runtime Playwright có sẵn. Không cài package hoặc dùng profile trình duyệt cá nhân.
- Chưa thử cảm ứng trên thiết bị thật hoặc Safari/iOS. Các ghi chú dừng test bên dưới thuộc thay đổi khung điện thoại ở phiên trước.

## Đã chạy trước yêu cầu dừng kiểm thử

- `node tools/validate-catalog.mjs`: PASS, một module production Spirit Grove.
- `node --test tests`: 13/13 PASS. Bao gồm metadata/file/path lỗi, duplicate ID, tải một phần, tìm kiếm tiếng Việt, URL subpath, lời giải mẫu và đảo ngược thao tác cho cả 10 màn đã chuyển vị trí.
- Kiểm tra cú pháp library.js và serve.mjs: đạt ở phiên bản trước thay đổi khung điện thoại.
- Browser: luật chơi mở với 0 iframe; bấm chơi có đúng 1 iframe; Escape trong iframe loại bỏ iframe và trả focus về nút mở.
- Browser: giải màn đầu bằng thao tác xoay; chọn màn 2, xoay, Undo về 0 lượt, Hint hiển thị và Restart hoạt động.
- Browser: tìm kiếm không có kết quả, xóa bộ lọc bằng bàn phím và lọc thể loại.
- Browser fixture riêng: thêm module mẫu chỉ qua thư mục + catalog, chơi tương tác độc lập, đóng có 0 iframe; metadata lỗi không làm ẩn hai game hợp lệ. Fixture chỉ là output local, không nằm trong catalog production.
- Browser: thư viện và game nhúng tải đúng dưới /repository-name/; ảnh và iframe giữ tiền tố này.
- Browser: ghi nhận viewport CSS 360px không tràn ngang cả library và dialog. Phát hiện orbit trang trí tràn ở tablet và đã giới hạn bằng overflow:clip; chưa kiểm tra lại responsive sau sửa theo yêu cầu dừng test.
- Rà soát độc lập code shell/catalog/validator/server/config: không có lỗi nghiêm trọng cần xử lý. Các module cùng origin là code tin cậy, không có sandbox bảo mật.

## Thay đổi sau đó và giới hạn

Người dùng bổ sung yêu cầu khung iPhone 15 Pro Max ở giữa màn hình và yêu cầu không test thêm. Đã sửa markup, CSS, lifecycle ResizeObserver và panel luật; không chạy lại tests hoặc browser QA sau thay đổi này. Không tuyên bố bản khung điện thoại đã được kiểm thử.

Chưa deploy lên hosting thật, chưa kiểm tra Safari/iOS, chưa chạy BFS xác minh số lượt tối ưu. Không có Git repository nên không tạo worktree hoặc commit.

Bổ sung tiếp theo: tăng kích thước, sau đó chuẩn hóa hình dáng theo preset thiết bị và thêm bộ chọn năm khung điện thoại. Không chạy thêm kiểm thử hoặc browser QA, giữ yêu cầu dừng test của người dùng. Thông số thân/màn hình tham chiếu nguồn hãng trong README; chi tiết CSS là minh họa.

Bổ sung chia sẻ: nút QR mỗi game, link dựa trên domain/subpath hiện tại, sao chép link và tải SVG, cảnh báo loopback/LAN. QR generator 2.0.4 được vendored với giấy phép MIT. Không chạy thêm test hoặc quét QR trên thiết bị thật theo yêu cầu dừng kiểm thử.

Bổ sung hiển thị: QR tự hiện bên trái khi mở demo; trên màn hình hẹp chuyển xuống dưới máy. Panel dùng chung generator/link động với chức năng chia sẻ; hủy Blob URL và bỏ qua kết quả async cũ khi đóng hoặc đổi demo. Không chạy thêm kiểm thử theo yêu cầu hiện có.

Bổ sung bố cục ba vùng: QR dịch trái thêm; luật, features tùy chọn và điều khiển luôn hiện bên phải; điện thoại giữ giữa. Màn hình hẹp xếp dọc, nội dung Spirit Grove và QR đã rút gọn. Giữ nguyên hướng điều khiển vuốt trong metadata hiện tại của người dùng. Không chạy thêm kiểm thử.
