/**
 * Paint Match - Constants & Configuration
 * Định nghĩa bảng màu, công thức pha màu (Color Alchemy), băng chuyền động và layout.
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

  const BOARD_SIZE = 6;
  const PIX_SIZE = 8;

  // Bảng màu nước nghệ thuật
  const COLORS = {
    P: '#ff5c98', // Hồng thạch (Pink)
    R: '#ff3d57', // Đỏ dâu (Red)
    O: '#ff8522', // Cam đào (Orange)
    Y: '#ffc814', // Vàng chuối (Yellow)
    G: '#38cf70', // Xanh bơ (Green)
    B: '#319cf0', // Xanh mây (Blue)
    V: '#9154f8', // Tím hoa oải hương (Violet)
    K: '#432f57', // Tím than / mực đậm (Ink/Dark)
    W: '#ffffff', // Trắng sữa (White)
    N: '#9e673f'  // Nâu bánh quy (Brown)
  };

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

  /**
   * BẢNG CÔNG THỨC PHA MÀU THỰC THỤ (COLOR ALCHEMY RECIPES)
   * Cho phép người chơi nối chuyển từ màu này sang màu khác để tạo màu thứ cấp!
   */
  const COLOR_MIX_RECIPES = {
    'R+Y': 'O', // Đỏ + Vàng = Cam đào
    'Y+R': 'O',
    'B+Y': 'G', // Xanh dương + Vàng = Xanh lá
    'Y+B': 'G',
    'R+B': 'V', // Đỏ + Xanh dương = Tím oải hương
    'B+R': 'V',
    'R+W': 'P', // Đỏ + Trắng = Hồng thạch
    'W+R': 'P',
    'O+K': 'N', // Cam + Mực than = Nâu bánh quy
    'K+O': 'N',
    'R+G': 'N', // Đỏ + Xanh lá = Nâu bánh quy
    'G+R': 'N'
  };

  function getMixResult(colorA, colorB) {
    if (!colorA || !colorB || colorA === colorB) return null;
    return COLOR_MIX_RECIPES[`${colorA}+${colorB}`] || null;
  }

  const BLOCKER = {
    NONE: 0,
    STONE: 1, // 🪨 Đá tảng
    INK: 2    // 🖤 Quái vật mực loang
  };

  // Tọa độ và kích thước khung vẽ Canvas logic (360 x 640 - Tỉ lệ 9:16 chuẩn di động)
  const LAYOUT = {
    VIRTUAL_WIDTH: 360,
    VIRTUAL_HEIGHT: 640,
    
    // Khung tranh giá vẽ khổng lồ (272px x 272px)
    PIX_X: 44,
    PIX_Y: 14,
    PIX_CELL_SIZE: 34,
    
    // Thanh theo dõi mục tiêu màu sắc
    GOALS_Y: 298,
    GOALS_HEIGHT: 34,

    // Bàn cờ Line Connect 4 hướng phía dưới (6x6)
    BOARD_X: 48,
    BOARD_Y: 348,
    CELL_SIZE: 44
  };

  return {
    BOARD_SIZE,
    PIX_SIZE,
    COLORS,
    COLOR_NAMES,
    COLOR_MIX_RECIPES,
    getMixResult,
    BLOCKER,
    LAYOUT
  };
});
