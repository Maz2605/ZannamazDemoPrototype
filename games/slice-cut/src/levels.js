/**
 * Slice Cut - 20 Levels Configuration and Game Constants
 */
(function (root) {
  'use strict';

  const W = 340;
  const H = 420;
  const DOT_R = 11;
  const BOMB_R = 15;

  const PAL = [
    '#ff4d6d', // Dâu tây hồng
    '#ff9f1c', // Cam ngọt
    '#ffd60a', // Chanh vàng
    '#4cd964', // Táo xanh
    '#4cc9f0', // Kẹo việt quất
    '#9b5de5', // Nho tím
    '#f15bb5'  // Bánh kem kẹo
  ];

  // s: hình dáng bánh ('r': bánh chữ nhật bo góc, 'c': bánh tròn, 'h': bánh lục giác)
  // L: đường cắt lời giải mẫu [x, y, góc]
  // c: số nhát cắt tối đa
  // ax: chỉ cho phép cắt thẳng ngang hoặc dọc (1: có)
  // tm: thời gian giới hạn tính bằng giây
  // bombs: tọa độ các quả bom [[x, y], ...]
  // walls: các thanh cản trở (thép: steel, dây buộc: rope)
  // ices: các khối băng kem không thể cắt qua [{ x, y, r }]
  // stars: số lượng kẹo ngôi sao vạn năng có thể đi cùng bất kỳ màu kẹo nào
  // info: hướng dẫn hiển thị cho màn chơi
  const LV = [
    {
      id: 1, title: 'Bánh Ngọt Đầu Tiên', icon: '🍰', s: 'r',
      L: [[170, 210, 90]], c: 3,
      info: ['✂️ Vuốt một đường cắt đôi chiếc bánh: mỗi phần chỉ giữ một màu kẹo nhé!']
    },
    {
      id: 2, title: 'Chia Bánh Bốn Góc', icon: '🎂', s: 'r',
      L: [[170, 210, 90], [170, 210, 0]], c: 4,
      info: ['📏 Đường cắt của bé sẽ kéo dài xuyên suốt toàn bộ chiếc bánh!']
    },
    {
      id: 3, title: 'Bánh Vòng Tròn Xoay', icon: '🍩', s: 'c',
      L: [[170, 210, 90], [100, 170, 20], [240, 250, -20]], c: 4,
      info: ['✨ Bé có thể cắt đường chéo tùy ý để tách các bạn kẹo ra!']
    },
    {
      id: 4, title: 'Cẩn Thận Bom Đen', icon: '💣', s: 'h',
      L: [[170, 210, 90], [170, 170, 25], [170, 250, -25]], c: 4,
      bombs: [[100, 215], [230, 320]],
      info: ['💣 Cẩn thận nha: chém trúng bom đen là bánh nổ bùm đó!']
    },
    {
      id: 5, title: 'Thanh Thép Rắn Chắc', icon: '🔩', s: 'r',
      L: [[170, 210, 90], [110, 130, 0], [230, 300, 0]], c: 4,
      walls: [{ k: 'steel', x: 90, y: 215, len: 80, a: 0 }],
      info: ['🔩 Thanh thép cứng ngắc: nhát cắt không thể xuyên qua được đâu!']
    },
    {
      id: 6, title: 'Dây Nơ Ruy Băng', icon: '🧵', s: 'r',
      L: [[120, 210, 90], [220, 210, 90], [170, 150, 0]], c: 4, ax: 1,
      walls: [
        { k: 'rope', x1: 150, y1: 260, x2: 190, y2: 330 },
        { k: 'rope', x1: 250, y1: 300, x2: 290, y2: 230 }
      ],
      info: ['🧵 Không làm đứt dây nơ buộc bánh nhé!', '↔️ Ở màn này chỉ cắt được đường thẳng ngang hoặc dọc thôi nha!']
    },
    {
      id: 7, title: 'Tảng Băng Mát Lạnh', icon: '🧊', s: 'c',
      L: [[170, 210, 90], [110, 260, 0], [230, 260, 0]], c: 4,
      ices: [{ x: 230, y: 150, r: 18 }],
      info: ['🧊 Chướng ngại vật mới: Tảng băng kem siêu cứng!', '❄️ Lưỡi dao chạm tảng băng sẽ bị dội ngược lại!']
    },
    {
      id: 8, title: 'Ngôi Sao Vạn Năng', icon: '⭐', s: 'r',
      L: [[120, 210, 90], [220, 210, 90], [170, 210, 0]], c: 4,
      bombs: [[270, 110], [70, 110]], stars: 1,
      info: ['⭐ Bạn mới: Kẹo Ngôi Sao Vạn Năng!', '✨ Kẹo ngôi sao có thể kết hợp với bất kỳ màu kẹo nào!']
    },
    {
      id: 9, title: 'Bom & Thép Thử Thách', icon: '💣', s: 'h',
      L: [[170, 210, 90], [170, 140, 0], [170, 280, 0]], c: 4, tm: 45,
      bombs: [[240, 210], [240, 100]],
      walls: [{ k: 'steel', x: 100, y: 210, len: 60, a: 90 }],
      info: ['⏱️ Đếm ngược 45 giây: Khéo léo né cả bom lẫn thép nhé!']
    },
    {
      id: 10, title: 'Đại Tiệc Băng Tuyết', icon: '👑', s: 'c',
      L: [[170, 210, 90], [100, 150, 20], [240, 290, 20], [170, 330, 0]], c: 5, tm: 60,
      bombs: [[250, 150]],
      walls: [
        { k: 'steel', x: 110, y: 300, len: 60, a: 0 },
        { k: 'rope', x1: 110, y1: 95, x2: 140, y2: 125 }
      ],
      ices: [{ x: 120, y: 220, r: 16 }],
      info: ['👑 Màn 10: Thử thách kết hợp Bom, Thép, Dây nơ và Tảng băng!', '⏱️ 60 giây chinh phục chiếc bánh kem hoàng gia!']
    },
    {
      id: 11, title: 'Song Băng Đối Xứng', icon: '🧊', s: 'r',
      L: [[170, 210, 90], [170, 210, 0]], c: 4,
      ices: [{ x: 100, y: 140, r: 18 }, { x: 240, y: 280, r: 18 }],
      info: ['🧊 Hai tảng băng nằm chéo nhau, hãy chia bánh thành 4 phần!']
    },
    {
      id: 12, title: 'Lục Giác Hoa Tuyết', icon: '❄️', s: 'h',
      L: [[170, 210, 30], [170, 210, -30], [170, 210, 90]], c: 4,
      bombs: [[250, 210], [90, 210]],
      info: ['❄️ Bánh lục giác chia 6 phần cánh hoa, né 2 quả bom ở 2 bên!']
    },
    {
      id: 13, title: 'Vườn Sao Kẹo Dẻo', icon: '⭐', s: 'r',
      L: [[120, 210, 90], [220, 210, 90], [170, 210, 0]], c: 4, stars: 2,
      walls: [{ k: 'steel', x: 170, y: 130, len: 70, a: 0 }],
      info: ['⭐ 2 viên Kẹo Sao Vạn Năng xuất hiện cùng thanh thép chắn!']
    },
    {
      id: 14, title: 'Cặp Trụ Thép Đôi', icon: '🔩', s: 'c',
      L: [[170, 210, 90], [170, 140, 0], [170, 280, 0]], c: 4,
      walls: [{ k: 'steel', x: 110, y: 210, len: 65, a: 90 }, { k: 'steel', x: 230, y: 210, len: 65, a: 90 }],
      info: ['🔩 Hai cột thép song song chia đôi bánh thành các khoang nhỏ!']
    },
    {
      id: 15, title: 'Tâm Bom Trọng Yếu', icon: '💣', s: 'r',
      L: [[110, 210, 90], [230, 210, 90], [170, 140, 0], [170, 280, 0]], c: 5, ax: 1,
      bombs: [[170, 210]],
      info: ['💣 Quả bom nằm ngay chính giữa bánh, chỉ được cắt ngang hoặc dọc!']
    },
    {
      id: 16, title: 'Pháo Đài Tam Hợp', icon: '🏰', s: 'h',
      L: [[170, 210, 90], [100, 180, 25], [240, 240, 25]], c: 4,
      walls: [
        { k: 'rope', x1: 90, y1: 290, x2: 140, y2: 330 },
        { k: 'steel', x: 240, y: 140, len: 55, a: -45 }
      ],
      ices: [{ x: 120, y: 115, r: 18 }],
      info: ['🏰 Thử thách kết hợp: Khối băng, Thanh thép và Dây nơ!']
    },
    {
      id: 17, title: 'Bánh Pizza Ngôi Sao', icon: '🍕', s: 'c',
      L: [[170, 210, 90], [170, 210, 0], [170, 210, 45], [170, 210, -45]], c: 5, stars: 2,
      bombs: [[244, 241], [96, 179]],
      info: ['🍕 Cắt bánh thành 8 miếng tam giác với sự trợ giúp của 2 kẹo sao!']
    },
    {
      id: 18, title: 'Thử Thách Băng Lãnh 50s', icon: '⏱️', s: 'r',
      L: [[120, 210, 90], [220, 210, 90], [170, 140, 0], [170, 280, 0]], c: 5, tm: 50,
      ices: [{ x: 170, y: 210, r: 18 }],
      bombs: [[70, 310], [270, 110]],
      info: ['⏱️ 50 giây đếm ngược: Tảng băng ở trung tâm và 2 quả bom góc!']
    },
    {
      id: 19, title: 'Mê Cung Bánh Kem 55s', icon: '🧩', s: 'h',
      L: [[170, 210, 90], [110, 150, 0], [230, 270, 0]], c: 4, tm: 55,
      walls: [
        { k: 'steel', x: 100, y: 210, len: 45, a: 90 },
        { k: 'rope', x1: 220, y1: 180, x2: 250, y2: 240 }
      ],
      bombs: [[240, 95], [100, 320]], stars: 1,
      info: ['⏱️ 55 giây: Mê cung lục giác phức tạp, hãy tận dụng kẹo sao vạn năng!']
    },
    {
      id: 20, title: 'Đỉnh Cao Tiệm Bánh', icon: '🏆', s: 'c',
      L: [[170, 210, 90], [170, 210, 0], [170, 125, 0], [170, 295, 0]], c: 5, tm: 65,
      walls: [
        { k: 'steel', x: 110, y: 250, len: 40, a: 90 },
        { k: 'rope', x1: 220, y1: 235, x2: 250, y2: 270 }
      ],
      bombs: [[235, 75], [100, 165]],
      ices: [{ x: 230, y: 165, r: 18 }], stars: 2,
      info: ['🏆 Màn cuối cùng: Đỉnh cao trí tuệ tiệm bánh với toàn bộ các cơ chế!', '⏱️ 65 giây giành cúp Vua Đầu Bếp Nhí!']
    }
  ];

  const SliceCut = root.SliceCut = root.SliceCut || {};
  SliceCut.W = W;
  SliceCut.H = H;
  SliceCut.DOT_R = DOT_R;
  SliceCut.BOMB_R = BOMB_R;
  SliceCut.PAL = PAL;
  SliceCut.LV = LV;
})(typeof window !== 'undefined' ? window : globalThis);
