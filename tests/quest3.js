// Walks through Chapter III's quest chain with dialogue and menus stubbed out,
// printing the top objective after each step.
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + require('path').resolve(__dirname, '../game/index.html'));
  await sleep(1000);
  const out = await page.evaluate(async () => {
    const log = [];
    window.__menu = []; window.__pick = 0;
    Dlg.say = (sp, text, opts) => Promise.resolve(opts && opts.choices ? window.__pick : 0);
    Menu.list = (o) => {
      const want = window.__menu.shift();
      if (want === undefined) return Promise.resolve(-1);
      const i = o.items.findIndex(it => (typeof it.label === 'function' ? it.label() : it.label).includes(want));
      if (i < 0) { log.push('  !! menu item not found: ' + want); return Promise.resolve(-1); }
      if (o.items[i].disabled) { log.push('  !! disabled: ' + want + ' (' + (o.items[i].whyNot || '') + ')'); return Promise.resolve(-1); }
      return Promise.resolve(i);
    };
    window.wait = () => Promise.resolve();
    Game.fadeTo = () => Promise.resolve();
    Game.goto = (id, p) => { log.push('  -> goto ' + id + (p && p.tow ? ' (tow)' : '') + (p && p.race ? ' (race)' : '')); return Promise.resolve(); };
    const lbl = o => typeof o.label === 'function' ? o.label() : o.label;
    const act = async (def, label) => {
      const o = def.objects.find(o => lbl(o).includes(label) && (!o.when || o.when()));
      if (!o) { log.push('  !! no visible object ' + label); return; }
      await o.act(Game.scenes[def.id]);
    };
    const step = async (name, fn, menu) => { window.__menu = menu || []; await fn(); log.push(name.padEnd(24) + ' $' + S.coins + ' | ' + objectives().join(' / ')); };
    S = newState(3);
    log.push('start: vessel=' + S.vessel + ' food=' + Inv.food() + ' | ' + objectives()[0]);
    await step('opening', () => act(C3_VILLAGE, 'Grandpa and Greta'));
    await step('bo tow line', () => c3Bo(), ['towing', 'Leave']);
    await step('oskar key', () => c3Oskar());
    log.push('  route saltmere->seal: ' + routeBlock('saltmere', 'seal') + ' | known seal? ' + locKnown('seal'));
    await step('ylva first', () => c3Ylva());
    await step('hartley door', () => act(C3_CANNERY, 'Hartley house'));
    await HARTLEY.onEnter(Game.scenes.hartley, {});
    await step('desk sketchbook', () => act(HARTLEY, 'desk'));
    await step('crayon', () => act(HARTLEY, 'drawing on the wall'));
    await step('family photo', () => act(HARTLEY, 'photograph'));
    // sketches: hold them up at the right spots
    const sk = async (def) => { const sc = Game.scenes[def.id]; const o = def.objects.find(o => lbl(o).includes('sketch') && o.when()); if (!o) { log.push('  !! no sketch spot in ' + def.id); return; } await o.act(sc); };
    await step('sketch cannery', () => sk(C3_CANNERY));
    await step('sketch puffin', () => sk(C3_PUFFIN));
    await step('ylva skerries', () => c3Ylva());
    log.push('  known seal? ' + locKnown('seal') + ' | route puffin->seal (pip): ' + routeBlock('puffin', 'seal'));
    await step('ylva sigrid', () => c3Ylva());
    // puffling night
    window.__pick = 0;
    await step('ylva pufflings', () => c3Ylva());
    log.push('  time=' + S.time + ' active=' + flag('pflActive'));
    const psc = Game.scenes.c3_puffin;
    for (let i = 0; i < 8; i++) {
      await act(C3_PUFFIN, 'Pick up the puffling');
      if (psc.pf.carry.length === 3 || i === 7) await act(C3_PUFFIN, 'Launch');
    }
    log.push('pufflings'.padEnd(24) + ' $' + S.coins + ' saved=' + JSON.stringify(S.f.pflSaved) + ' done=' + flag('pflDone') + ' book=' + Inv.has('countbook') + ' | ' + objectives().join(' / '));
    S.inv.bread = 6;
    await step('floe wren', () => act(C3_FLOE, 'The Wren'));
    log.push('  food left: ' + Inv.food());
    await step('sketch floe', () => sk(C3_FLOE));
    await step('tow home', () => C3_VILLAGE.onEnter(Game.scenes.c3_village, { towHome: true }));
    await step('oskar toby', () => c3Oskar());
    await step('bo list', () => c3Bo(), ['what the Wren needs', 'Leave']);
    await step('bram spar', () => c3Bram());
    await step('sketch lighthouse', () => sk(C3_LIGHTHOUSE));
    await step('tar', () => act(C3_CANNERY, 'tar'));
    S.coins += 20;
    await step('sailcloth', () => c3Hollis(), ['sailcloth', 'Leave']);
    await step('bo restore', () => c3Bo(), ['Restore', 'Leave']);
    window.__pick = 0;
    await step('nell paints', () => c3Nell());
    await step('sleep', () => act(C3_COTTAGE, 'Sleep'));
    log.push('  wrenReady=' + flag('wrenReady') + ' pages=' + JSON.stringify(S.bottles));
    S.vessel = 'wren';
    log.push('  route puffin->seal (wren): ' + routeBlock('puffin', 'seal'));
    // the Skerries
    await step('meet pim', () => c3Pim());
    S.inv.lumpfish = 1;
    await step('pim lumpfish', () => c3Pim());
    await step('sketch seal', () => sk(SEAL));
    await step('nell eider ask', () => c3Nell());
    await step('eider feather', () => act(EIDER, 'feather'));
    await step('meet ingrid', () => c3Ingrid(), ['Leave']);
    await step('meet toby', () => c3Toby());
    await step('sketch ness end', () => sk(NESSEND));
    await step('toby no coffee', () => c3Toby());
    await step('ingrid toby', () => c3Ingrid());
    await step('toby coffee', () => act(NESSEND, 'Knock on the shed door'));
    await step('toby story', () => act(NESSEND, 'Talk to the man'));
    await step('oskar alive', () => c3Oskar());
    await step('trunk letters', () => act(C3_COTTAGE, 'attic'));
    await step('give letters', () => act(NESSEND, 'Talk to Toby'));
    log.push('  riders: ' + c3Riders().length + ' redsail? ' + Inv.has('redsail'));
    await step('nell feather', () => c3Nell());
    S.inv.halibut = 1;
    await step('tam halibut', () => c3Tam());
    await step('arrive saltmere', () => C3_VILLAGE.onEnter(Game.scenes.c3_village, {}));
    log.push('  boat cfg: ' + JSON.stringify((S.vessel = 'wren', boatCfg())));
    await step('sleep to midsummer', () => act(C3_COTTAGE, 'Sleep'));
    window.__pick = 0;
    await step('start race', () => act(C3_VILLAGE, 'Start the Regatta'));
    const st = chap().voyageStyle('saltmere', 'saltmere');
    log.push('  rivals: ' + st.rivals.map(r => r.name).join(','));
    window.__pick = 1;
    await step('race end (2nd)', () => C3_VILLAGE.onEnter(Game.scenes.c3_village, { raceEnd: 2 }));
    log.push('  epilogue cards: ' + EPILOGUES[3].cards.length);
    log.push('ending: ended=' + flag('ended') + ' place=' + S.f.racePlace + ' scene=' + Game.sceneId + ' stats=' + JSON.stringify(EPILOGUES[3].stats()));
    log.push('items: ' + Object.keys(S.inv).join(','));
    return log.join('\n');
  });
  console.log(out);
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
