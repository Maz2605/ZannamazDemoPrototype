/**
 * Paint Match - Constants & Configuration
 * Định nghĩa bảng màu, kích thước bàn cờ, loại ô đặc biệt và chướng ngại vật.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PaintMatch = root.PaintMatch || {};
    root.PaintMatch.Constants = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Kích thước bàn cờ Match-3 (6x6) và Tranh Pixel (8x8)
  const BOARD_SIZE = 6;
  const PIX_SIZE = 8;

  // Bảng mã màu các giọt sơn
  const COLORS = {
    P: '#ff8fb3', // Hồng thạch (Pink)
    R: '#ff5d6c', // Đỏ dâu (Red)
    O: '#ffa94d', // Cam đào (Orange)
    Y: '#ffd93d', // Vàng chuối (Yellow)
    G: '#6bd68b', // Xanh bơ (Green)
    B: '#5ab8ff', // Xanh mây (Blue)
    V: '#b388ff', // Tím hoa oải hương (Violet)
    K: '#5b4a6e', // Tím than / mực đậm (Ink/Dark)
    W: '#ffffff', // Trắng sữa (White)
    N: '#b98560'  // Nâu bánh quy (Brown)
  };

  // Tên thân thiện cho từng màu
  const COLOR_NAMES = {
    P: 'Hồng thạch',
    R: 'Đỏ dâu',
    O: 'Cam đào',
    Y: 'Vàng chuối',
    G: 'Xanh bơ',
    B: 'Xanh trời',
    V: 'Tím oải hương',
    K: 'Mực than',
    W: 'Trắng sữa',
    N: 'Nâu quy'
  };

  // Loại ô kỹ năng đặc biệt khi ghép 4 hoặc 5
  const SPECIAL = {
    NONE: '',
    BRUSH: 'b',  // Cọ vẽ (quét sạch cả hàng)
    BUCKET: 'k'  // Xô sơn (xóa sạch tất cả ô cùng màu)
  };

  // Loại chướng ngại vật trên bàn Match-3
  const BLOCKER = {
    NONE: 0,
    STONE: 1, // 🪨 Đá rắn chắc (vỡ khi ghép kề bên)
    INK: 2    // 🖤 Quái vật mực (loang dần theo số lượt)
  };

  // Tọa độ và kích thước khung vẽ trên Canvas logic (340x540)
  const LAYOUT = {
    VIRTUAL_WIDTH: 340,
    VIRTUAL_HEIGHT: 540,
    BOARD_X: 20,
    BOARD_Y: 222,
    CELL_SIZE: 50,
    PIX_X: 82,
    PIX_Y: 20,
    PIX_CELL_SIZE: 22
  };

  return {
    BOARD_SIZE,
    PIX_SIZE,
    COLORS,
    COLOR_NAMES,
    SPECIAL,
    BLOCKER,
    LAYOUT
  };
});

