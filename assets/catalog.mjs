/** Metadata contract only. This module never loads gameplay code. */
export function validateMetadata(data, metadataURL) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('metadata must be an object');
  for (const key of ['id', 'title', 'category', 'version', 'description', 'entry', 'thumbnail']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) throw Error(`${key} must be a non-empty string`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id)) throw Error('id must use lowercase words separated by hyphens');
  if (!['portrait', 'landscape', 'responsive'].includes(data.orientation)) throw Error('orientation must be portrait, landscape or responsive');
  for (const key of ['rules', 'controls', 'notes']) {
    if (!Array.isArray(data[key]) || data[key].some(item => typeof item !== 'string' || !item.trim())) throw Error(`${key} must be an array of non-empty strings`);
  }
  if (!data.rules.length || !data.controls.length) throw Error('rules and controls cannot be empty');
  if (data.features !== undefined && (!Array.isArray(data.features) || data.features.some(item => typeof item !== 'string' || !item.trim()))) throw Error('features must be an array of non-empty strings');
  if (data.levelCount !== undefined && (!Number.isInteger(data.levelCount) || data.levelCount < 1)) throw Error('levelCount must be a positive integer');
  const base = new URL('.', metadataURL);
  const resolved = {};
  for (const key of ['entry', 'thumbnail']) {
    const value = data[key];
    if (value.startsWith('/') || value.includes('\\') || /^[a-z][a-z\d+.-]*:/i.test(value)) throw Error(`${key} must be relative to the module`);
    const url = new URL(value, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.search || url.hash) throw Error(`${key} must stay inside the module`);
    resolved[`${key}URL`] = url.href;
  }
  return { ...data, ...resolved };
}

export function validateCatalog(data, catalogURL) {
  if (!data || !Array.isArray(data.games)) throw Error('catalog.games must be an array');
  const base = new URL('.', catalogURL);
  return data.games.map(path => {
    if (typeof path !== 'string' || !path.startsWith('./games/') || path.includes('\\')) throw Error('catalog entries must be relative ./games/.../game.json paths');
    const url = new URL(path, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(new URL('./games/', base).pathname) || !url.pathname.endsWith('/game.json') || url.search || url.hash) throw Error(`invalid module path: ${path}`);
    return url.href;
  });
}

export async function loadCatalog(catalogURL, fetcher = fetch) {
  const response = await fetcher(catalogURL);
  if (!response.ok) throw Error(`Không tải được danh mục (HTTP ${response.status}).`);
  const urls = validateCatalog(await response.json(), catalogURL);
  const results = await Promise.allSettled(urls.map(async url => {
    const response = await fetcher(url);
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    return validateMetadata(await response.json(), url);
  }));
  const games = [], errors = [], ids = new Set();
  results.forEach((result, i) => {
    if (result.status === 'rejected') errors.push(`${urls[i]}: ${result.reason.message}`);
    else if (ids.has(result.value.id)) errors.push(`${urls[i]}: duplicate id ${result.value.id}`);
    else { ids.add(result.value.id); games.push(result.value); }
  });
  return { games, errors };
}

export function filterGames(games, query, category) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
  const term = normalize(query.trim());
  return games.filter(game => (!category || game.category === category) && normalize(`${game.title} ${game.description}`).includes(term));
}
