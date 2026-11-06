/**
 * Paint Match - Levels Configuration
 * Chứa danh sách màn chơi, mẫu tranh pixel (8x8), số lượt đi, và chướng ngại vật tương ứng.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PaintMatch = root.PaintMatch || {};
    root.PaintMatch.Levels = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Cấu hình 10 màn chơi:
   * - n: Tên màn / bức tranh
   * - a: Mẫu pixel 8x8 (chuỗi ký tự, dấu '.' là trong suốt/trống)
   * - m: Số lượt đi tối đa
   * - stones: Vị trí các ô đá [chỉ số 0..35]
   * - cages: Vị trí các ô bị lồng xích nhốt
   * - ink: Chu kỳ loang mực (cứ N lượt lại sinh 1 ô mực)
   * - lock: Tọa độ ô tranh bị khóa [[hàng, cột], ...]
   * - dbl: Tọa độ ô tranh sơn 2 lớp [[hàng, cột], ...]
   * - hid: Số ô ẩn trên bàn cờ (cần ghép kế bên để mở)
   * - info: Hướng dẫn hoặc mẹo hiển thị ở màn này
   */
  const RAW_LEVELS = [
    {
      n: 'Trái tim',
      icon: '💖',
      a: [
        '........',
        '.PP..PP.',
        'PWPPPPPP',
        'PPPPPPPP',
        '.PPPPPP.',
        '..PPPP..',
        '...PP...',
        '........'
      ],
      m: 20,
      info: [
        'Hoán đổi 2 ô kề nhau để ghép 3 ô cùng màu.',
        'Màu ghép được sẽ bắn những giọt sơn tô vào bức tranh phía trên!'
      ]
    },
    {
      n: 'Nấm đỏ',
      icon: '🍄',
      a: [
        '..RRRR..',
        '.RWRRWR.',
        'RRRRRRRR',
        'RRWRRRWR',
        '..WWWW..',
        '..WNNW..',
        '..WWWW..',
        '.GGGGGG.'
      ],
      m: 22,
      info: [
        'Ghép 4 ô: Tạo 🖌️ Cọ sơn, quét sạch cả hàng ngang.',
        'Ghép 5 ô: Tạo 🪣 Xô sơn thần kỳ, xóa sạch mọi ô cùng màu!'
      ]
    },
    {
      n: 'Mèo cam',
      icon: '🐱',
      a: [
        'O......O',
        'OO....OO',
        'OOOOOOOO',
        'OKOOOOKO',
        'OOWPPWOO',
        'OPOOOOPO',
        '.OOOOOO.',
        '..OOOO..'
      ],
      m: 26,
      stones: [13, 22],
      info: [
        '🪨 Ô đá cứng cáp: Ghép các giọt màu kề sát cạnh đá để làm vỡ.'
      ]
    },
    {
      n: 'Thỏ trắng',
      icon: '🐰',
      a: [
        '.WP..PW.',
        '.WP..PW.',
        '.WWWWWW.',
        'WWKWWKWW',
        'WWWPPWWW',
        'WPWWWWPW',
        '.WWWWWW.',
        '..WWWW..'
      ],
      m: 28,
      cages: [8, 21, 28],
      info: [
        '⛓️ Ô bị nhốt: Không thể di chuyển hay hoán đổi chỗ.',
        'Ghép sát cạnh ô bị nhốt để phá khóa giải cứu!'
      ]
    },
    {
      n: 'Ếch xanh',
      icon: '🐸',
      a: [
        '.GG..GG.',
        'GWGGGGWG',
        'GKGGGGKG',
        'GGGGGGGG',
        'GGPGGPGG',
        'GGGKKGGG',
        '.GGGGGG.',
        '..GG.GG.'
      ],
      m: 28,
      lock: [[4, 2], [4, 5]],
      info: [
        '🔒 Ô tranh bị khóa: Hãy tô màu các ô kề bên để giải phóng khóa.',
        'Mẹo: Chạm trực tiếp vào ô tranh để ưu tiên bắn màu vào vị trí đó!'
      ]
    },
    {
      n: 'Vịt vàng',
      icon: '🦆',
      a: [
        '..YYY...',
        '.YYKYY..',
        '.YYYYOO.',
        '.YYYYY..',
        'YYYYYYY.',
        'YYWWWYY.',
        '.YWWWY..',
        '..YYY...'
      ],
      m: 30,
      dbl: [[1, 3], [5, 2], [5, 3], [5, 4]],
      info: [
        '🎨 Ô tranh sơn 2 lớp (x2): Cần bắn trúng 2 lần cùng màu mới hoàn thành!'
      ]
    },
    {
      n: 'Hoa hồng',
      icon: '🌹',
      a: [
        '..PPPP..',
        '.PPYYPP.',
        'PPYYYYPP',
        'PPYYYYPP',
        '.PPYYPP.',
        '..PGGP..',
        '.GGGGGG.',
        '...GG...'
      ],
      m: 30,
      ink: 5,
      info: [
        '🖤 Mực đen quái vật: Cứ mỗi 5 lượt lại loang thêm 1 giọt mực!',
        'Hãy ghép cạnh ô mực để dọn sạch nó trước khi lan rộng.'
      ]
    },
    {
      n: 'Gấu trúc',
      icon: '🐼',
      a: [
        'KK....KK',
        'KKWWWWKK',
        '.WWWWWW.',
        'WKKWWKKW',
        'WKKWWKKW',
        'WPWKKWPW',
        '.WWKKWW.',
        '..WWWW..'
      ],
      m: 32,
      hid: 5,
      stones: [14, 21],
      cages: [7, 28],
      info: [
        '❓ Ô ẩn bí mật: Hiện nguyên hình khi ghép sát bên cạnh.',
        'Thử thách kết hợp cả 🪨 Đá và ⛓️ Lồng nhốt!'
      ]
    },
    {
      n: 'Tên lửa',
      icon: '🚀',
      a: [
        '...RR...',
        '..RWWR..',
        '..WBBW..',
        '..WBBW..',
        '.RWWWWR.',
        'RR.WW.RR',
        '...YY...',
        '...OO...'
      ],
      m: 34,
      stones: [8, 27],
      ink: 6,
      lock: [[2, 2], [2, 5]],
      dbl: [[2, 3], [2, 4]],
      info: [
        'Thử thách tốc độ cao: Khóa ô, sơn 2 lớp, quái vật mực và đá cản đường!'
      ]
    },
    {
      n: 'Bánh cupcake',
      icon: '🧁',
      a: [
        '...RR...',
        '..PPPP..',
        '.PPYPPP.',
        'PPPPPYPP',
        '.WWWWWW.',
        '.NWNWNW.',
        '..NWNW..',
        '..NNNN..'
      ],
      m: 40,
      stones: [12, 23],
      cages: [9, 26],
      hid: 4,
      ink: 6,
      lock: [[1, 3], [2, 4]],
      dbl: [[0, 3], [0, 4]],
      info: [
        'Đại tiệc tiệm bánh: Tổng hợp mọi chướng ngại vật đỉnh cao!'
      ]
    }
  ];

  // Tiền xử lý các màu xuất hiện trên bàn cờ cho mỗi màn chơi
  const DEFAULT_EXTRA_COLORS = ['B', 'V', 'G', 'Y', 'O', 'P'];
  const LEVELS = RAW_LEVELS.map(level => {
    const clone = { ...level };
    // Lấy tập hợp màu thực tế có trong bức tranh
    const pictureColors = [...new Set(clone.a.join('').replace(/\./g, ''))];
    clone.cols = [...pictureColors];

    // Đảm bảo có ít nhất 4 màu trên bàn cờ để trò chơi thú vị và có thể tạo match
    for (const color of DEFAULT_EXTRA_COLORS) {
      if (clone.cols.length >= 4) break;
      if (!clone.cols.includes(color)) clone.cols.push(color);
    }
    return clone;
  });

  return {
    LEVELS,
    get: index => LEVELS[index] || LEVELS[0],
    count: () => LEVELS.length
  };
});

