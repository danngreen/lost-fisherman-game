const puppeteer = require('puppeteer-core');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const out = process.argv[3] || 'shots';
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await page.goto('file:///Users/dann/gamedev/fisherman/game/index.html');
  await sleep(1200);
  for (const st of steps) {
    try {
      if (st.js) { const r = await page.evaluate(st.js); if (r !== undefined) console.log('js>', JSON.stringify(r)); }
      if (st.keys) for (const k of st.keys) { if (k.startsWith('hold:')) { const [, key, ms] = k.split(':'); await page.keyboard.down(key); await sleep(+ms); await page.keyboard.up(key); } else { await page.keyboard.press(k); } await sleep(st.gap || 90); }
      if (st.solve) {
        for (let n = 0; n < (st.solve || 40); n++) {
          const need = await page.evaluate(() => (Game.scene && Game.scene.need && !Dlg.active) ? Game.scene.need : (Dlg.active ? 'dlg' : null));
          if (need === 'dlg') await page.keyboard.press('Enter');
          else if (need) await page.keyboard.press('Arrow' + need[0].toUpperCase() + need.slice(1));
          else if (st.until && await page.evaluate(st.until)) break;
          await sleep(st.gap || 350);
        }
      }
      if (st.wait) await sleep(st.wait);
      if (st.shot) await page.screenshot({ path: out + '/' + st.shot + '.png' });
    } catch (e) { errs.push('STEP ' + JSON.stringify(st).slice(0, 80) + ': ' + e.message); }
  }
  const ge = await page.evaluate(() => Game.error);
  console.log(errs.join('\n') || 'no console errors');
  console.log('Game.error:', ge);
  await browser.close();
})();
