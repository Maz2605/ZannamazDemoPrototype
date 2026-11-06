import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const PAL = ['#ff4d6d', '#ff9f1c', '#ffd60a', '#4cd964', '#4cc9f0', '#9b5de5', '#f15bb5'];

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

const context = vm.createContext({ window: { SliceCut: { LV, PAL } } });
vm.runInContext(await readFile(new URL('../games/slice-cut/src/engine.js', import.meta.url), 'utf8'), context);
const Engine = context.window.SliceCut.Engine;

let allPass = true;
for (let i = 0; i < LV.length; i++) {
  const G = Engine.build(i, LV, PAL);
  let hitObstacle = false;
  for (const sol of G.solution) {
    const p = { x: sol[0], y: sol[1] };
    const a = sol[2] * Math.PI / 180;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const hit = Engine.checkCut(G, p, d, 0);
    if (hit) {
      console.error(`ERROR Level ${i + 1} solution hit ${hit} at line [${sol.join(', ')}]`);
      hitObstacle = true;
      allPass = false;
    }
    Engine.cut(G, p, d);
  }
  const isSolved = Engine.solved(G);
  if (!isSolved || hitObstacle) {
    console.error(`FAIL Level ${i + 1} (${LV[i].title}): solved=${isSolved}`);
    allPass = false;
  } else {
    console.log(`PASS Level ${i + 1} (${LV[i].title}): pieces=${G.pieces.length}, dots=${G.dots.length}`);
  }
}

if (!allPass) process.exit(1);
console.log('ALL 20 LEVELS PASS 100% PERFECTLY!');
