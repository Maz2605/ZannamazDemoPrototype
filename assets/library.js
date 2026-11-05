import { loadCatalog, filterGames } from './catalog.mjs';
import { DEVICES, deviceGeometry } from './devices.mjs';
import { openShare, showDemoShare, clearDemoShare } from './share.js';

const $ = id => document.getElementById(id);
const dialog = $('game-dialog'), frameHost = $('frame-host');
let games = [], selected = null, returnFocus = null, detachKeyboard = null, loadTimer = null, frameResizeObserver = null;
let device = DEVICES.find(item => item.id === 'iphone-15-pro-max');

function resizeDevice() {
  const geometry = deviceGeometry(device);
  const scale = Math.max(0.05, Math.min(1, 430 / geometry.width, (window.innerWidth - 40) / geometry.width, (window.innerHeight - 140) / geometry.height));
  const player = $('device-player');
  player.style.width = `${geometry.width * scale}px`;
  player.style.height = `${geometry.height * scale}px`;
  $('dialog-body').style.setProperty('--device-display-width', `${geometry.width * scale}px`);
  player.style.setProperty('--device-scale', String(scale));
}

function sizeGameViewport() {
  const frame = frameHost.firstElementChild;
  if (!frame) return;
  frame.style.width = `${device.screenWidth}px`;
  frame.style.height = `${device.screenHeight - device.statusHeight - device.homeHeight}px`;
  frame.style.transform = 'none';
}

function selectDevice(id) {
  device = DEVICES.find(item => item.id === id) || DEVICES[0];
  const geometry = deviceGeometry(device);
  const shell = $('phone-device');
  shell.className = `phone-device ${device.skin}`;
  const properties = {
    '--body-width': geometry.width, '--body-height': geometry.height,
    '--screen-left': geometry.screenLeft, '--screen-top': geometry.screenTop,
    '--screen-width': device.screenWidth, '--screen-height': device.screenHeight,
    '--body-radius': device.radius, '--screen-radius': device.screenRadius,
    '--status-height': device.statusHeight, '--home-height': device.homeHeight
  };
  for (const [name, value] of Object.entries(properties)) shell.style.setProperty(name, `${value}px`);
  $('device-player').setAttribute('aria-label', `Trình chơi demo trong khung ${device.name}`);
  $('device-finish').textContent = device.finish;
  resizeDevice();
  // Resize the existing iframe: switching the frame never restarts the game.
  sizeGameViewport();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function disposeFrame() {
  clearDemoShare();
  clearTimeout(loadTimer);
  frameResizeObserver?.disconnect();
  frameResizeObserver = null;
  detachKeyboard?.();
  detachKeyboard = null;
  frameHost.replaceChildren();
  $('player-status').textContent = '';
}

function onEscape(event) {
  if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
}

function startDemo() {
  disposeFrame();
  $('dialog-body').classList.remove('rules-only');
  $('start-demo').hidden = true;
  frameHost.className = selected.orientation;
  const frame = document.createElement('iframe');
  frame.title = `Chơi ${selected.title}`;
  frame.allow = 'fullscreen; autoplay; gamepad';
  frame.allowFullscreen = true;
  frame.src = selected.entryURL;
  $('player-status').textContent = 'Đang tải demo…';
  loadTimer = setTimeout(() => {
    $('player-status').textContent = 'Demo tải lâu hơn dự kiến. Bạn có thể chạy lại hoặc mở game trong tab riêng.';
  }, 15000);
  frame.addEventListener('load', () => {
    if (frameHost.firstElementChild !== frame) return;
    clearTimeout(loadTimer);
    $('player-status').textContent = '';
    // Shell handles only dialog keyboard navigation. It never accesses gameplay state.
    try {
      const doc = frame.contentDocument;
      if (!doc) throw Error('Frame not accessible');
      const onFrameKey = event => {
        onEscape(event);
        if (event.key !== 'Tab') return;
        const focusables = [...doc.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(node => node.getClientRects().length);
        const active = doc.activeElement;
        if (event.shiftKey && (active === focusables[0] || active === doc.body)) {
          event.preventDefault(); $('standalone-link').focus();
        } else if (!event.shiftKey && (active === focusables.at(-1) || active === doc.body)) {
          event.preventDefault(); $('restart-demo').focus();
        }
      };
      doc.addEventListener('keydown', onFrameKey);
      detachKeyboard = () => doc.removeEventListener('keydown', onFrameKey);
    } catch {
      $('player-status').textContent = 'Dùng nút Đóng ở phía trên để kết thúc demo.';
    }
  });
  frameHost.append(frame);
  showDemoShare(selected);
  // The entire device scales uniformly; its frame, screen and cutout never stretch.
  frameResizeObserver = new ResizeObserver(sizeGameViewport);
  frameResizeObserver.observe(frameHost);
  resizeDevice();
  sizeGameViewport();
}

function fillList(id, items) { $(id).replaceChildren(...items.map(text => element('li', '', text))); }

function openGame(game, play, trigger) {
  disposeFrame();
  selected = game;
  returnFocus = trigger;
  $('dialog-title').textContent = game.title;
  $('dialog-category').textContent = `${game.category} / V${game.version}${game.levelCount ? ` / ${game.levelCount} MÀN` : ''}`;
  $('dialog-description').textContent = game.description;
  fillList('dialog-rules', game.rules);
  fillList('dialog-features', game.features || []);
  $('features-section').hidden = !game.features?.length;
  fillList('dialog-controls', game.controls);
  fillList('dialog-notes', game.notes);
  $('notes-section').hidden = !game.notes.length;
  $('standalone-link').href = game.entryURL;
  $('dialog-body').classList.toggle('rules-only', !play);
  $('start-demo').hidden = play;
  document.body.classList.add('modal-open');
  if (!dialog.open) dialog.showModal();
  resizeDevice();
  dialog.scrollTop = 0;
  $('close-dialog').focus();
  if (play) startDemo();
}

function createCard(game) {
  const card = element('article', 'game-card');
  const thumbnail = element('button', 'thumbnail-button');
  thumbnail.type = 'button';
  thumbnail.setAttribute('aria-label', `Chơi demo ${game.title}`);
  const image = element('img');
  image.src = game.thumbnailURL; image.alt = `Bàn chơi ${game.title}`;
  image.loading = 'lazy'; image.width = 640; image.height = 400;
  image.addEventListener('error', () => { image.hidden = true; thumbnail.classList.add('image-missing'); });
  const tag = element('span', 'image-tag', 'WEB DEMO');
  const playIcon = element('span', 'image-play', '▶'); playIcon.setAttribute('aria-hidden', 'true');
  thumbnail.append(image, tag, playIcon);
  thumbnail.addEventListener('click', () => openGame(game, true, thumbnail));
  const content = element('div', 'card-content');
  const meta = element('div', 'card-meta');
  meta.append(element('span', 'category-tag', game.category));
  if (game.levelCount) meta.append(element('span', 'separator', '·'), element('span', '', `${game.levelCount} màn chơi`));
  meta.append(element('span', 'separator', '·'), element('span', '', `v${game.version}`));
  const actions = element('div', 'card-actions');
  const play = element('button', 'button primary', 'Chơi demo ↗'); play.type = 'button';
  play.setAttribute('aria-label', `Chơi ${game.title}`);
  play.addEventListener('click', () => openGame(game, true, play));
  const rules = element('button', 'rules-button', 'Luật chơi'); rules.type = 'button';
  rules.setAttribute('aria-label', `Luật chơi ${game.title}`);
  rules.addEventListener('click', () => openGame(game, false, rules));
  actions.append(play, rules);
  const share = element('button', 'card-share', '▦ Chơi trên điện thoại · QR');
  share.type = 'button';
  share.setAttribute('aria-label', `QR chơi ${game.title} trên điện thoại`);
  share.addEventListener('click', () => openShare(game, share));
  content.append(meta, element('h3', '', game.title), element('p', 'card-description', game.description), actions, share);
  card.append(thumbnail, content);
  return card;
}

function render() {
  const visible = filterGames(games, $('search').value, $('category').value);
  $('game-grid').replaceChildren(...visible.map(createCard));
  $('empty-state').hidden = visible.length > 0;
  $('results-status').textContent = `Hiển thị ${visible.length} / ${games.length} game`;
}

$('search-form').addEventListener('submit', event => event.preventDefault());
for (const preset of DEVICES) {
  const option = element('option', '', preset.name);
  option.value = preset.id;
  $('device-select').append(option);
}
$('device-select').value = device.id;
$('device-select').addEventListener('change', event => selectDevice(event.target.value));
window.addEventListener('resize', resizeDevice);
selectDevice(device.id);
$('search').addEventListener('input', render);
$('category').addEventListener('change', render);
$('reset-filters').addEventListener('click', () => { $('search').value = ''; $('category').value = ''; render(); $('search').focus(); });
$('close-dialog').addEventListener('click', () => dialog.close());
$('restart-demo').addEventListener('click', startDemo);
$('start-demo').addEventListener('click', () => { startDemo(); $('restart-demo').focus(); });
$('show-rules').addEventListener('click', () => {
  $('game-details').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
dialog.addEventListener('keydown', onEscape);
dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
dialog.addEventListener('close', () => { disposeFrame(); selected = null; document.body.classList.remove('modal-open'); if (returnFocus?.isConnected) returnFocus.focus(); });

async function init() {
  try {
    const loaded = await loadCatalog(new URL('../catalog.json', import.meta.url));
    games = loaded.games;
    if (loaded.errors.length) {
      $('catalog-warning').textContent = `${loaded.errors.length} mục chưa tải được. Các game còn lại vẫn có thể chơi.`;
      $('catalog-warning').hidden = false;
      console.warn('Catalog errors:', loaded.errors);
    }
    [...new Set(games.map(game => game.category))].sort().forEach(category => {
      const option = element('option', '', category); option.value = category; $('category').append(option);
    });
    $('total-games').textContent = String(games.length);
    $('collection-count').textContent = String(games.length);
    render();
  } catch (error) {
    $('catalog-warning').textContent = location.protocol === 'file:' ? 'Thư viện cần HTTP server. Chạy RUN_LIBRARY.cmd rồi mở http://localhost:8080.' : `${error.message} Hãy tải lại trang để thử lại.`;
    $('catalog-warning').hidden = false;
    $('results-status').textContent = 'Chưa tải được thư viện.';
    $('total-games').textContent = '0'; $('collection-count').textContent = '0';
  }
}
init();
