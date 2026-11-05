/** Sharing belongs to the library; game modules need no sharing integration. */
const $ = id => document.getElementById(id);
const modal = $('share-dialog');
let opener = null, downloadURL = null, request = 0;
let demoQRURL = null, demoRequest = 0;

function clearDownload() {
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = null;
  $('download-qr').removeAttribute('href');
  $('download-qr').hidden = true;
}

function networkMessage(url) {
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.startsWith('127.') || host === '[::1]' || host === '0.0.0.0') {
    return 'Link local chỉ dùng trên máy này. Deploy để quét trên điện thoại.';
  }
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith('.local')) {
    return 'Link LAN: cần cùng mạng và server cho phép truy cập.';
  }
  return '';
}

function qrSVG(qr) {
  const quiet = 4, count = qr.getModuleCount();
  const size = count + quiet * 2;
  let path = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="white"/><path d="${path}" fill="black"/></svg>`;
}

async function createQRURL(url) {
  const { default: qrcode } = await import('./vendor/qrcode.mjs');
  const qr = qrcode(0, 'M');
  qr.addData(url.href, 'Byte');
  qr.make();
  return URL.createObjectURL(new Blob([qrSVG(qr)], { type: 'image/svg+xml' }));
}

export function clearDemoShare() {
  demoRequest++;
  if (demoQRURL) URL.revokeObjectURL(demoQRURL);
  demoQRURL = null;
  $('demo-qr-image').removeAttribute('src');
  $('demo-qr-image').hidden = true;
  $('demo-qr-panel').hidden = true;
}

export async function showDemoShare(game) {
  clearDemoShare();
  const token = demoRequest;
  const url = new URL(game.entryURL, document.baseURI);
  $('demo-qr-panel').hidden = false;
  $('demo-qr-status').textContent = 'Đang tạo mã QR…';
  $('demo-copy-link').textContent = 'Sao chép link';
  $('demo-share-link').value = url.href;
  const warning = networkMessage(url);
  $('demo-qr-warning').textContent = warning;
  $('demo-qr-warning').hidden = !warning;
  try {
    const result = await createQRURL(url);
    if (token !== demoRequest) { URL.revokeObjectURL(result); return; }
    demoQRURL = result;
    $('demo-qr-image').src = result;
    $('demo-qr-image').alt = `QR chơi ${game.title} trên điện thoại`;
    $('demo-qr-image').hidden = false;
    $('demo-qr-status').textContent = 'Mở camera, quét mã để chơi.';
  } catch {
    if (token === demoRequest) $('demo-qr-status').textContent = 'Chưa tạo được QR. Bạn vẫn có thể sao chép link bên dưới.';
  }
}

export async function openShare(game, trigger) {
  const token = ++request;
  opener = trigger;
  clearDownload();
  $('qr-image').hidden = true;
  $('qr-status').textContent = 'Đang tạo mã QR…';
  $('copy-link').textContent = 'Sao chép link';
  $('share-title').textContent = `Chơi ${game.title} trên điện thoại`;
  // entryURL was resolved against fetched game.json on this deployment.
  // Its current origin AND repository/subfolder prefix travel into the QR.
  const url = new URL(game.entryURL, document.baseURI);
  $('share-link').value = url.href;
  $('share-direct').href = url.href;
  const warning = networkMessage(url);
  $('share-warning').textContent = warning;
  $('share-warning').hidden = !warning;
  if (!modal.open) modal.showModal();
  document.body.classList.add('modal-open');
  $('close-share').focus();
  try {
    const result = await createQRURL(url);
    if (token !== request || !modal.open) { URL.revokeObjectURL(result); return; }
    downloadURL = result;
    $('qr-image').src = downloadURL;
    $('qr-image').alt = `QR mở trực tiếp game ${game.title}`;
    $('qr-image').hidden = false;
    $('download-qr').href = downloadURL;
    $('download-qr').download = `${game.id}-qr.svg`;
    $('download-qr').hidden = false;
    $('qr-status').textContent = 'Mở camera điện thoại, quét mã và chạm vào link để chơi.';
  } catch {
    if (token !== request || !modal.open) return;
    $('qr-status').textContent = 'Chưa tạo được QR. Bạn vẫn có thể sao chép link để chia sẻ.';
  }
}

$('close-share').addEventListener('click', () => modal.close());
modal.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); modal.close(); }
});
modal.addEventListener('cancel', event => { event.preventDefault(); modal.close(); });
modal.addEventListener('close', () => {
  request++;
  $('qr-image').removeAttribute('src');
  clearDownload();
  if (!$('game-dialog').open) document.body.classList.remove('modal-open');
  if (opener?.isConnected) opener.focus();
});
$('copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('share-link').value);
    $('copy-link').textContent = 'Đã sao chép ✓';
  } catch {
    $('share-link').focus();
    $('share-link').select();
    $('qr-status').textContent = 'Link đã được chọn. Nhấn Ctrl/Cmd+C hoặc chạm giữ để sao chép.';
  }
});
$('demo-copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('demo-share-link').value);
    $('demo-copy-link').textContent = 'Đã sao chép ✓';
  } catch {
    $('demo-share-link').focus();
    $('demo-share-link').select();
    $('demo-qr-status').textContent = 'Link đã được chọn. Nhấn Ctrl/Cmd+C hoặc chạm giữ để sao chép.';
  }
});
