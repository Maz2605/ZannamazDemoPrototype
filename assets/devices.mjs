/** Front-frame presets. Body proportions use published manufacturer dimensions.
 * Screen sizes are logical portrait canvases, not an OS/browser emulator.
 */
export const DEVICES = [
  { id: 'iphone-15', name: 'iPhone 15', finish: 'BLACK · ALUMINUM', skin: 'iphone', widthMM: 71.6, heightMM: 147.6, screenWidth: 393, screenHeight: 852, bezel: 15, radius: 58, screenRadius: 46, statusHeight: 59, homeHeight: 34 },
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', finish: 'NATURAL TITANIUM', skin: 'iphone titanium', widthMM: 76.7, heightMM: 159.9, screenWidth: 430, screenHeight: 932, bezel: 15, radius: 60, screenRadius: 48, statusHeight: 59, homeHeight: 34 },
  { id: 'iphone-se', name: 'iPhone SE (3rd gen)', finish: 'MIDNIGHT · HOME BUTTON', skin: 'classic', widthMM: 67.3, heightMM: 138.4, screenWidth: 375, screenHeight: 667, bezel: 30, radius: 52, screenRadius: 2, statusHeight: 20, homeHeight: 0 },
  { id: 'galaxy-s24-ultra', name: 'Samsung Galaxy S24 Ultra', finish: 'TITANIUM GRAY', skin: 'android galaxy', widthMM: 79, heightMM: 162.3, screenWidth: 412, screenHeight: 3120 / 1440 * 412, bezel: 15, radius: 14, screenRadius: 8, statusHeight: 32, homeHeight: 24 },
  { id: 'pixel-8', name: 'Google Pixel 8', finish: 'OBSIDIAN', skin: 'android pixel', widthMM: 70.8, heightMM: 150.5, screenWidth: 412, screenHeight: 2400 / 1080 * 412, bezel: 15, radius: 60, screenRadius: 46, statusHeight: 32, homeHeight: 24 }
];

export function deviceGeometry(device) {
  const width = device.screenWidth + device.bezel * 2;
  const height = width * device.heightMM / device.widthMM;
  return { width, height, screenLeft: device.bezel, screenTop: (height - device.screenHeight) / 2 };
}
