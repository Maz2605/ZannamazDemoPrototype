// Optional browser QA using a pre-existing Playwright installation (NODE_PATH).
// Run prepare-drag-wheel-qa.mjs first. Does not install any packages.
const { chromium } = require('playwright');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { writeFile, mkdir } = require('node:fs/promises');
const assert = require('node:assert/strict');

(async () => {
  const output = resolve(__dirname, '../test-results/drag-wheel');
  await mkdir(output, { recursive:true });
  const browser = await chromium.launchPersistentContext(resolve(output, 'playwright-profile'), {
    channel:process.env.QA_BROWSER || 'chrome', headless:true, timeout:15000
  });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({width:390,height:844});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(resolve(output,'browser.html')).href);
    await page.locator('#results[data-complete="true"]').waitFor({timeout:20000});
    const result = await page.locator('#results').textContent();
    console.log(result);
    assert.ok(!result.includes('FAIL'), 'browser regression failure');

    const gameURL = pathToFileURL(resolve(__dirname,'../games/spirit-grove/index.html')).href;
    await page.goto(gameURL);
    await page.screenshot({path:resolve(output,'game.png'),fullPage:true});
    await page.evaluate(()=>window.SpiritGrove.Debug.load(5));
    await page.screenshot({path:resolve(output,'rune-lock.png'),fullPage:true});
    await page.evaluate(()=>window.SpiritGrove.Debug.load(3));
    await page.screenshot({path:resolve(output,'one-way.png'),fullPage:true});

    async function mouseTurn(frame, direction, offset = {x:0,y:0}, scale = 1) {
      await frame.evaluate(() => window.SpiritGrove.Debug.load(1));
      const points = await frame.evaluate(direction => {
        const g = window.SpiritGrove, board = document.getElementById('board');
        const c = g.Art.hubPoint(g.LEVELS[1],0), matrix = board.getScreenCTM();
        return Array.from({length:18},(_,i) => {
          const p = new DOMPoint(c.x + direction*i*4, c.y).matrixTransform(matrix);
          return {x:p.x,y:p.y};
        });
      },direction);
      const screen = p => ({x:offset.x+p.x*scale,y:offset.y+p.y*scale});
      let p = screen(points[0]);
      await page.mouse.move(p.x,p.y); await page.mouse.down();
      for(const point of points.slice(1)) { p=screen(point); await page.mouse.move(p.x,p.y); }
      assert.equal(await frame.evaluate(()=>document.querySelectorAll('[data-orbit-cell]').length),4,'native drag missing preview');
      if (!offset.x && !offset.y && direction===1) await page.screenshot({path:resolve(output,'preview.png'),fullPage:true});
      await page.mouse.up();
      await frame.waitForFunction(()=>!document.getElementById('board').classList.contains('dragging'));
      const correct = await frame.evaluate(direction => {
        const g=window.SpiritGrove;
        const expected=g.Engine.spin(g.LEVELS[1],g.Engine.parse(g.LEVELS[1]),0,-direction).next;
        return g.Debug.getMoves()===1 && g.Debug.getState().join('')===expected.join('');
      },direction);
      assert.ok(correct,'native pointer produced wrong state or move count');
    }
    await mouseTurn(page,1); await mouseTurn(page,-1);
    console.log('PASS native mouse dragging and pointer capture in both directions at 390px');

    await page.evaluate(()=>window.SpiritGrove.Debug.load(1));
    const targets = await page.evaluate(()=>{
      const g=window.SpiritGrove, matrix=document.getElementById('board').getScreenCTM();
      const h=g.Art.hubPoint(g.LEVELS[1],1), c=g.Art.wheelPoint(g.LEVELS[1],1);
      const screen=(x,y)=>{const p=new DOMPoint(x,y).matrixTransform(matrix);return{x:p.x,y:p.y};};
      return {hub:screen(h.x,h.y),head:screen(c.x,c.y-44-61),end:screen(c.x+51,c.y-44-61*Math.cos(Math.PI/6))};
    });
    await page.mouse.click(targets.hub.x,targets.hub.y);
    await page.mouse.move(targets.head.x,targets.head.y); await page.mouse.down();
    await page.mouse.move(targets.end.x,targets.end.y,{steps:8});
    await page.mouse.up();
    await page.waitForFunction(()=>!document.getElementById('board').classList.contains('dragging'));
    assert.ok(await page.evaluate(()=>{
      const g=window.SpiritGrove;
      return g.Debug.getMoves()===1 && g.Debug.getState().join('')===g.Engine.spin(g.LEVELS[1],g.Engine.parse(g.LEVELS[1]),1,-1).next.join('');
    }),'native head hit target failed or chose wrong group');
    console.log('PASS native center selection followed by short swipe over shared animal head');

    await writeFile(resolve(output,'scaled.html'), `<!doctype html><style>body{margin:20px}iframe{width:430px;height:900px;border:0;transform:scale(.65);transform-origin:top left}</style><iframe src="${gameURL}"></iframe>`);
    await page.setViewportSize({width:800,height:900});
    await page.goto(pathToFileURL(resolve(output,'scaled.html')).href);
    const frame = await page.locator('iframe').elementHandle().then(el=>el.contentFrame());
    await frame.waitForFunction(()=>window.SpiritGrove?.Debug);
    const box = await page.locator('iframe').boundingBox();
    await mouseTurn(frame,1,{x:box.x,y:box.y},.65);
    console.log('PASS native mouse dragging in iframe scaled to 65%');
    assert.deepEqual(errors,[],'browser JavaScript errors');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
