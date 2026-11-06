/**
 * Paint Match - Levels Configuration
 * Chứa danh sách 10 màn chơi, mẫu tranh pixel (8x8), số lượt đi, băng chuyền và chướng ngại vật.
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
      m: 18,
      info: [
        '🎨 Nối giọt cùng màu theo 4 hướng (ngang/dọc, tối thiểu 3 giọt).',
        '🧪 Pha màu: Nối dải Đỏ (R) sang Trắng (W) để tạo Hồng (P)!'
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
      m: 20,
      info: [
        '🧪 Công thức pha màu: Xanh dương (B) + Vàng (Y) = Xanh lá (G)!',
        '⚡ Tạo vòng khép kín (Square Loop) để kích hoạt Siêu Bão Màu!'
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
      m: 22,
      stones: [13, 22],
      info: [
        '🧪 Công thức pha màu: Đỏ (R) + Vàng (Y) = Cam đào (O)!',
        '🪨 Ô đá tảng: Nối dải màu sát cạnh đá để làm vỡ.'
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
      m: 24,
      cages: [8, 21, 28],
      conveyors: [{ row: 3, dir: 1 }], // Hàng 3 trượt sang phải 1 bước sau mỗi lượt
      info: [
        '🔄 Băng chuyền động: Hàng có mũi tên sẽ tự dịch chuyển sau mỗi lượt đi!',
        '⛓️ Ô bị nhốt: Nối dải màu kề bên để bẻ khóa cứu kẹo ra ngoài.'
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
      m: 25,
      lock: [[4, 2], [4, 5]],
      info: [
        '🔒 Ô tranh bị khóa: Hãy tô màu các ô kề bên để mở khóa.',
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
      m: 26,
      dbl: [[1, 3], [5, 2], [5, 3], [5, 4]],
      info: [
        '🎨 Ô tranh sơn 2 lớp (x2): Cần bắn trúng 2 lần cùng màu mới hoàn thành!',
        '🧪 Pha màu Cam (O): Nối dải Đỏ (R) + Vàng (Y).'
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
      m: 26,
      ink: 5,
      conveyors: [{ col: 2, dir: 1 }], // Cột 2 trượt xuống sau mỗi lượt
      info: [
        '🖤 Quái vật mực loang: Cứ 5 lượt lại sinh thêm một giọt mực đen.',
        '🔄 Băng chuyền cột: Các giọt trên cột 3 sẽ tự trôi xuống dưới!'
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
      m: 28,
      hid: 5,
      stones: [14, 21],
      cages: [7, 28],
      info: [
        '❓ Ô ẩn bí mật: Hiện màu khi nối dải kề bên.',
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
      m: 30,
      stones: [8, 27],
      ink: 6,
      lock: [[2, 2], [2, 5]],
      dbl: [[2, 3], [2, 4]],
      conveyors: [
        { row: 1, dir: 1 },
        { row: 4, dir: -1 }
      ],
      info: [
        '🔄 Băng chuyền kép đối xứng! Khóa ô, sơn 2 lớp, mực và đá cản đường.'
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
      m: 32,
      stones: [12, 23],
      cages: [9, 26],
      hid: 4,
      ink: 6,
      lock: [[1, 3], [2, 4]],
      dbl: [[0, 3], [0, 4]],
      conveyors: [{ row: 2, dir: 1 }],
      info: [
        'Đại tiệc tiệm bánh: Tổng hợp mọi công thức pha màu và chướng ngại vật!'
      ]
    }
  ];

  const DEFAULT_EXTRA_COLORS = ['B', 'V', 'G', 'Y', 'O', 'P'];
  const LEVELS = RAW_LEVELS.map(level => {
    const clone = { ...level };
    const pictureColors = [...new Set(clone.a.join('').replace(/\./g, ''))];
    clone.cols = [...pictureColors];

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
