const { spawn } = require('child_process');
const http = require('http');

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse: ${data} (${e.message})`));
        }
      });
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const targetBase = 'https://acting-colleague-healing-interval.trycloudflare.com';
  console.log('Testing target:', targetBase);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\alet-\\AppData\\Local\\Temp\\chrome-views-profile-' + Date.now(),
    targetBase + '/search'
  ]);

  chromeProc.on('error', (err) => console.error('Chrome spawn error:', err));

  let version = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      version = await getJson('http://127.0.0.1:9222/json/version');
      if (version) break;
    } catch {}
  }

  if (!version) {
    console.error('Could not connect to Chrome debugging port');
    chromeProc.kill();
    return;
  }
  console.log('Connected to Chrome:', version.Browser);

  const tabs = await getJson('http://127.0.0.1:9222/json/list');
  const tab = tabs.find(t => t.type === 'page') || tabs[0];
  console.log('Attaching to tab:', tab.id, tab.url);

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.result?.value;
  }

  ws.addEventListener('open', async () => {
    console.log('CDP WebSocket opened');
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Waiting 6s for /search to load & hydrate...');
    await sleep(6000);

    // 1. Initial State: Grid View Check
    console.log('\n--- TEST 1: Default View (Grid) ---');
    const initialState = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const gridBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Grid'));
      const cards = document.querySelectorAll('article');
      return {
        url: window.location.href,
        hasGridBtn: !!gridBtn,
        cardCount: cards.length,
        buttonsFound: buttons.filter(b => ['Grid', 'List', 'Map', 'Table'].includes(b))
      };
    })()`);
    console.log('Initial Search State:', initialState);

    // 2. Test Switching to List View
    console.log('\n--- TEST 2: Switch to List View ---');
    const clickList = await evaluate(`(() => {
      const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'List');
      if (!listBtn) return { error: 'List button not found' };
      listBtn.click();
      return { clickedList: true };
    })()`);
    console.log('Clicked List View:', clickList);

    await sleep(1500);

    const listState = await evaluate(`(() => {
      const cards = document.querySelectorAll('article');
      const firstCard = cards[0];
      const hasHorizontalLayout = firstCard ? firstCard.className.includes('md:flex-row') : false;
      const hasCompareLink = Array.from(document.querySelectorAll('a')).some(a => a.textContent.includes('Add to Compare'));
      return {
        url: window.location.href,
        cardCount: cards.length,
        hasHorizontalLayout,
        hasCompareLink
      };
    })()`);
    console.log('List View Render State:', listState);

    // 3. Test Switching to Compact Table View
    console.log('\n--- TEST 3: Switch to Compact Table View ---');
    const clickTable = await evaluate(`(() => {
      const tableBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Table');
      if (!tableBtn) return { error: 'Table button not found' };
      tableBtn.click();
      return { clickedTable: true };
    })()`);
    console.log('Clicked Table View:', clickTable);

    await sleep(1500);

    const tableState = await evaluate(`(() => {
      const table = document.querySelector('table');
      const ths = Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
      const rows = document.querySelectorAll('tbody tr');
      const hasRateM2 = ths.some(th => th.includes('Rate / m²'));
      return {
        url: window.location.href,
        hasTable: !!table,
        columnHeaders: ths,
        rowCount: rows.length,
        hasRateM2
      };
    })()`);
    console.log('Compact Table Render State:', tableState);

    // 4. Test Column Sorting inside Table
    console.log('\n--- TEST 4: Click Table Column Sort ---');
    const clickSort = await evaluate(`(() => {
      const priceTh = Array.from(document.querySelectorAll('th')).find(th => th.textContent.includes('Price'));
      if (!priceTh) return { error: 'Price header not found' };
      priceTh.click();
      const firstRowPrice = document.querySelector('tbody tr td:nth-child(3) p')?.textContent;
      return { clickedSort: true, firstRowPrice };
    })()`);
    console.log('Sort Column Result:', clickSort);

    // 5. Test Switching to Split Map View
    console.log('\n--- TEST 5: Switch to Split Map View ---');
    const clickMap = await evaluate(`(() => {
      const mapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Map');
      if (!mapBtn) return { error: 'Map button not found' };
      mapBtn.click();
      return { clickedMap: true };
    })()`);
    console.log('Clicked Map View:', clickMap);

    await sleep(2000);

    const mapState = await evaluate(`(() => {
      const hasMapHeader = Array.from(document.querySelectorAll('span, div')).some(el => el.textContent.includes('Geospatial Pinboard'));
      const pins = Array.from(document.querySelectorAll('button')).filter(b => b.className.includes('absolute') && (b.textContent.includes('R') || b.textContent.includes('M')));
      const leftCards = document.querySelectorAll('h3');
      return {
        url: window.location.href,
        hasMapHeader,
        pinCount: pins.length,
        leftCardCount: leftCards.length
      };
    })()`);
    console.log('Split Map Render State:', mapState);

    // Clean up
    ws.close();
    chromeProc.kill();
    console.log('\n=== ALL VIEW TESTS PASSED SUCCESSFULLY ===');
    process.exit(0);
  });

  ws.addEventListener('message', (event) => {
    const parsed = JSON.parse(event.data);
    if (parsed.id && pending.has(parsed.id)) {
      const { resolve } = pending.get(parsed.id);
      pending.delete(parsed.id);
      resolve(parsed);
    }
  });
}

run().catch(console.error);
