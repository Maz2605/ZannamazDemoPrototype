/**
 * SPIRIT GROVE — LEVEL DATA (15 Levels · 8 Blockers)
 *
 * rows/cols: grid dimensions (2x3, 3x3, 3x4)
 * start: row-major animal IDs, one char per pedestal; target = column index.
 * 8 Blockers:
 *   1. blocked: indices of disabled 2x2 rotation wheels, row-major. (🔒 Phong ấn vĩnh viễn)
 *   2. oneWay: [[wheel, allowedDirection]] (↻/↺ Trục một chiều)
 *   3. seals: [[wheel, triggerCell, animal]] (①–⑥ Ấn cổ ngữ đơn)
 *   4. link [-1]: [wheelA, wheelB, -1] (⚙️ Bánh răng ngược chiều)
 *   5. link [1]: [wheelA, wheelB, 1] (🪞 Bánh răng song sinh cùng chiều)
 *   6. traps: [[cell, forbiddenAnimal]] (🥀 Bẫy gai cấm loài)
 *   7. frost: [[wheel, heatCell, 0]] (❄️ Ấn băng giá cần Cáo sưởi ấm)
 *   8. dualSeals: [[wheel, cellA, animalA, cellB, animalB]] (☯️ Ấn linh thú kép)
 *
 * solution: one verified move sequence from start to target, [wheelIndex, direction].
 * par: tested shortest solution length (BFS-verified; see tools/solve-spirit-grove.mjs).
 *
 * Animal IDs: 0 Fox, 1 Rabbit, 2 Panda, 3 Owl.
 * All state changes are deterministic; see engine.js for the exact rules.
 */
window.SpiritGrove = window.SpiritGrove || {};
window.SpiritGrove.LEVELS = [
  {
    id: 1, title: 'Đánh thức vòng phép', subtitle: 'Chỉ cần một lần xoay.',
    rows: 2, cols: 3, start: '011022', par: 1, theme: 'dawn',
    icon: '🌀', rule: 'Xoay nhóm 4',
    description: 'Chạm trục ở ngã tư, rồi vuốt trái / phải ở bất kỳ đâu trên bàn. Cũng có thể giữ trục và vuốt luôn. Chạm chọn không mất lượt.',
    solution: [[1,-1]]
  },
  {
    id: 2, title: 'Hai vòng giao nhau', subtitle: 'Thứ tự xoay bắt đầu quan trọng.',
    rows: 2, cols: 3, start: '200121', par: 4, theme: 'dawn',
    icon: '✨', rule: 'Các vòng giao nhau',
    description: 'Một lần xoay ảnh hưởng tới các vị trí thuộc vòng bên cạnh. Hãy thử kết hợp hai vòng.',
    solution: [[1,-1],[0,1],[0,1],[1,-1]]
  },
  {
    id: 3, title: 'Khu rừng mở rộng', subtitle: 'Bốn vòng phép, chín bệ.',
    rows: 3, cols: 3, start: '021021021', par: 3, theme: 'forest',
    icon: '🌳', rule: 'Bốn vùng tác động',
    description: 'Các vị trí ở trung tâm có thể thuộc nhiều vòng phép. Tính thứ tự xoay trước khi kéo.',
    solution: [[1,1],[3,-1],[1,1]]
  },
  {
    id: 4, title: 'Lối xoay một chiều', subtitle: 'Một trục không cho quay ngược.',
    rows: 3, cols: 3, start: '100221021', par: 5, theme: 'forest', oneWay: [[1,1]],
    icon: '↻', rule: 'Trục một chiều',
    description: 'Trục có nhãn ← chỉ nhận vuốt trái. Muốn đi ngược, hãy phối hợp các vòng lân cận.',
    solution: [[0,-1],[1,1],[3,-1],[1,1],[0,-1]]
  },
  {
    id: 5, title: 'Phong ấn đá cổ', subtitle: 'Một đường xoay đã bị khóa.',
    rows: 3, cols: 3, start: '202100121', par: 6, theme: 'snow', blocked: [1], oneWay: [[0,-1]],
    icon: '🔒', rule: 'Vòng phép bị phong ấn',
    description: 'Vòng xám bị khóa, trục có nhãn → chỉ nhận vuốt phải. Dùng những vòng còn lại để mở đường.',
    solution: [[0,-1],[3,1],[3,1],[2,1],[3,1],[0,-1]]
  },
  {
    id: 6, title: 'Ấn Thỏ thức giấc', subtitle: 'Đưa đúng linh thú lên bệ kích hoạt.',
    rows: 3, cols: 3, start: '002121102', par: 8, theme: 'night', blocked: [0,3], seals: [[1,7,1]],
    icon: '🐰', rule: 'Khóa ấn theo linh thú',
    description: 'Đưa Thỏ lên bệ đánh dấu ② để mở trục ②. Thỏ rời bệ thì ấn đóng lại. Hai vòng xám vẫn bị khóa.',
    solution: [[2,-1],[1,1],[2,1],[1,-1],[1,-1],[2,-1],[1,1],[2,-1]]
  },
  {
    id: 7, title: 'Đền thờ bốn linh thú', subtitle: 'Cú mèo xuất hiện, sáu vòng phép.',
    rows: 3, cols: 4, start: '103012321032', par: 7, theme: 'sunset', oneWay: [[2,1],[3,-1]],
    icon: '🦉', rule: 'Mở rộng lên bốn loài',
    description: 'Bốn loài, sáu trục. Hai trục một chiều có nhãn ← và →; kết hợp chúng để đưa từng loài về đúng cột.',
    solution: [[0,-1],[5,-1],[2,1],[5,-1],[1,1],[3,-1],[3,-1]]
  },
  {
    id: 8, title: 'Đường xoay bị cắt', subtitle: 'Phong ấn ở vùng trung tâm.',
    rows: 3, cols: 4, start: '200323121310', par: 9, theme: 'snow', blocked: [2], oneWay: [[5,1]], seals: [[4,1,1]],
    icon: '🚧', rule: 'Mạng phép bị cắt',
    description: 'Ấn ⑤ chỉ mở khi Thỏ ở bệ ⑤. Trục ⑥ chỉ nhận vuốt trái; vòng ③ bị khóa. Giữ bệ kích hoạt trước khi xoay.',
    solution: [[1,-1],[3,-1],[5,1],[1,-1],[0,1],[5,1],[1,1],[3,-1],[4,-1]]
  },
  {
    id: 9, title: 'Bánh răng Mặt Trăng', subtitle: 'Hai vòng phép bắt đầu tác động lẫn nhau.',
    rows: 3, cols: 4, start: '231320103012', par: 10, theme: 'night', blocked: [2], link: [0,5,-1], oneWay: [[3,-1]], seals: [[0,6,2]],
    icon: '⚙️', rule: 'Bánh răng quay ngược',
    description: 'Đưa Gấu trúc lên bệ ① để mở cả cặp bánh răng ①–⑥. Trục ④ chỉ nhận vuốt phải. Gấu rời bệ thì cả cặp đóng lại.',
    solution: [[1,-1],[3,-1],[3,-1],[4,-1],[4,-1],[3,-1],[0,1],[4,-1],[0,1],[1,-1]]
  },
  {
    id: 10, title: 'Trái tim khu rừng', subtitle: 'Kết hợp cả phong ấn lẫn bánh răng.',
    rows: 3, cols: 4, start: '323123020011', par: 15, theme: 'sunset', blocked: [1,3], link: [0,5,-1], oneWay: [[2,1],[4,-1]], seals: [[0,6,2]],
    icon: '🏆', rule: 'Thử thách tổng hợp',
    description: 'Gấu trúc giữ ấn ① cho cặp bánh răng; hai trục một chiều và hai vòng phong ấn thu hẹp mọi đường đi. Mỗi lần rời bệ, khóa sẽ đóng lại.',
    solution: [[2,1],[0,1],[4,-1],[0,1],[4,-1],[0,1],[2,1],[4,-1],[0,1],[2,1],[4,-1],[2,1],[4,-1],[0,1],[4,-1]]
  },
  {
    id: 11, title: 'Gương thần song sinh', subtitle: 'Hai trục xoay cùng chiều đồng điệu.',
    rows: 3, cols: 4, start: '012102331023', par: 7, theme: 'dawn',
    link: [0, 5, 1], oneWay: [[2, 1]], blocked: [4],
    icon: '🪞', rule: 'Bánh răng song sinh',
    description: 'Xoay trục ① làm trục ⑥ xoay cùng chiều. Trục ③ chỉ nhận vuốt trái; vòng ⑤ bị phong ấn.',
    solution: [[0,-1],[2,1],[2,1],[1,1],[3,-1],[0,-1],[0,-1]]
  },
  {
    id: 12, title: 'Bẫy gai rừng thẳm', subtitle: 'Cáo không thể đặt chân vào bụi gai.',
    rows: 3, cols: 3, start: '020110212', par: 7, theme: 'forest',
    traps: [[4, 0]], oneWay: [[0, -1]],
    icon: '🥀', rule: 'Bẫy gai cấm loài',
    description: 'Bệ số ⑤ ở trung tâm có bẫy gai cấm Cáo 🦊. Bất kỳ thao tác nào đưa Cáo vào bệ này đều bị chặn!',
    solution: [[1,-1],[2,-1],[0,-1],[2,-1],[1,-1],[0,-1],[1,-1]]
  },
  {
    id: 13, title: 'Hơi ấm giải băng', subtitle: 'Lửa ấm của Cáo làm tan khối băng cổ.',
    rows: 3, cols: 4, start: '102321120033', par: 7, theme: 'snow',
    frost: [[3, 2, 0]], oneWay: [[5, -1]], blocked: [1],
    icon: '❄️', rule: 'Phong ấn băng giá',
    description: 'Trục ④ bị đóng băng cứng. Đưa Cáo 🦊 lên bệ ③ để hơi ấm làm tan băng. Trục ⑥ chỉ nhận vuốt phải.',
    solution: [[0,-1],[4,-1],[0,-1],[4,1],[5,-1],[4,1],[0,1]]
  },
  {
    id: 14, title: 'Đại trận âm dương', subtitle: 'Cần hai linh thú đồng thời giữ ấn.',
    rows: 3, cols: 4, start: '032212330101', par: 7, theme: 'night',
    dualSeals: [[1, 4, 1, 6, 2]], oneWay: [[4, 1]], blocked: [3],
    icon: '☯️', rule: 'Khóa ấn linh thú kép',
    description: 'Ấn kép ☯ trên trục ② chỉ mở khi bệ ⑤ có Thỏ 🐰 VÀ bệ ⑦ có Gấu trúc 🐼. Rời một trong hai bệ sẽ khóa lại ngay.',
    solution: [[2,-1],[1,1],[5,1],[2,1],[1,-1],[4,1],[0,-1]]
  },
  {
    id: 15, title: 'Đại đền linh thiêng', subtitle: 'Thử thách tối thượng 15 level.',
    rows: 3, cols: 4, start: '110130220233', par: 10, theme: 'sunset',
    link: [0, 5, 1], frost: [[4, 1, 0]], traps: [[7, 2]], oneWay: [[2, 1], [3, -1]],
    icon: '🏛️', rule: 'Hội tụ tám ấn pháp',
    description: 'Cặp bánh răng song sinh ①–⑥, trục ⑤ băng giá cần Cáo sưởi bệ ②, bệ ⑧ cấm Gấu trúc 🐼, cùng các trục một chiều. Khôi phục toàn bộ đền thờ!',
    solution: [[0,-1],[4,-1],[4,-1],[0,-1],[1,-1],[4,1],[2,1],[4,1],[0,-1],[1,1]]
  }
];
