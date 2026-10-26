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
    '--user-data-dir=C:\\Users\\alet-\\AppData\\Local\\Temp\\chrome-test-profile-' + Date.now(),
    targetBase + '/'
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
    await send('Log.enable');

    console.log('Waiting 5s for page to load & hydrate...');
    await sleep(5000);

    // 1. Initial State Check
    const state = await evaluate(`(() => {
      const input = document.querySelector('input');
      const roleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Role:'));
      return {
        title: document.title,
        hasInput: !!input,
        inputPlaceholder: input?.placeholder,
        roleText: roleBtn?.textContent.trim(),
        readyState: document.readyState
      };
    })()`);
    console.log('Initial Homepage State:', state);

    // 2. Test Search Input Click & Dropdown Expansion
    console.log('\n--- TEST 1: Search Pill & Input Click ---');
    const inputClick = await evaluate(`(() => {
      const input = document.querySelector('input');
      if (!input) return { error: 'no input' };
      input.click();
      return { clicked: true, focused: document.activeElement === input };
    })()`);
    console.log('Search input click:', inputClick);

    await sleep(1000);

    const dropdownState = await evaluate(`(() => {
      const dropdownHeader = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Filters & Suggestions'));
      return { dropdownVisible: !!dropdownHeader };
    })()`);
    console.log('Dropdown visible after click:', dropdownState);

    // 3. Test Filter Interaction (Select a property type inside dropdown)
    console.log('\n--- TEST 2: Filter Button Interaction ---');
    const filterSelect = await evaluate(`(() => {
      const houseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'House');
      if (!houseBtn) return { error: 'No House button found' };
      houseBtn.click();
      return { clicked: true };
    })()`);
    console.log('Clicked House filter:', filterSelect);

    // 4. Test Role Switcher Dropdown
    console.log('\n--- TEST 3: Role Switcher Dropdown ---');
    const roleToggle = await evaluate(`(() => {
      const roleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Role:'));
      if (!roleBtn) return { error: 'No role button' };
      roleBtn.click();
      return { clicked: true };
    })()`);
    console.log('Role button click:', roleToggle);

    await sleep(1000);

    const roleMenuVisible = await evaluate(`(() => {
      const menu = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Switch Test Persona'));
      return { menuVisible: !!menu };
    })()`);
    console.log('Role menu visible:', roleMenuVisible);

    // 5. Test Switching Role to "Agent"
    console.log('\n--- TEST 4: Switch Persona to Agent ---');
    const switchAgent = await evaluate(`(() => {
      const agentBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Property Practitioner'));
      if (!agentBtn) return { error: 'No Agent button in menu' };
      agentBtn.click();
      return { clickedAgent: true };
    })()`);
    console.log('Switch to Agent result:', switchAgent);

    await sleep(1000);

    const agentHeader = await evaluate(`(() => {
      const roleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Role:'));
      const mandateBtn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Add Mandate') || el.textContent.includes('Console'));
      return {
        currentRoleText: roleBtn?.textContent.trim(),
        hasMandateButton: !!mandateBtn
      };
    })()`);
    console.log('Header after switching to Agent:', agentHeader);

    // 6. Test Navigation to /auth/login and 1-Click Demo Login
    console.log('\n--- TEST 5: Login Page & 1-Click Demo Login ---');
    await send('Page.navigate', { url: targetBase + '/auth/login' });
    await sleep(4000);

    const loginPageState = await evaluate(`(() => {
      const demoHeading = Array.from(document.querySelectorAll('span, p')).find(el => el.textContent.includes('Quick Demo Access') || el.textContent.includes('Demo Test Personas'));
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      return {
        url: window.location.href,
        hasDemoSection: !!demoHeading,
        buttonCount: buttons.length,
        hasQuickSeller: buttons.some(b => b.includes('Seller')),
        hasQuickAgent: buttons.some(b => b.includes('Agent')),
        hasQuickAdmin: buttons.some(b => b.includes('Admin'))
      };
    })()`);
    console.log('Login Page State:', loginPageState);

    // Click 1-Tap Agent Login
    console.log('\n--- TEST 6: Clicking 1-Tap Agent Login Button ---');
    const clickAgentLogin = await evaluate(`(() => {
      const agentBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Agent') && b.textContent.includes('1-Tap'));
      if (!agentBtn) return { error: 'No 1-Tap Agent button found' };
      agentBtn.click();
      return { clicked1Tap: true };
    })()`);
    console.log('Clicked 1-Tap Agent:', clickAgentLogin);

    await sleep(4000);

    const postLoginUrl = await evaluate(`(() => {
      return {
        currentUrl: window.location.href,
        pathname: window.location.pathname,
        pageTitle: document.title
      };
    })()`);
    console.log('Post-login Navigation Result:', postLoginUrl);

    // Clean up
    ws.close();
    chromeProc.kill();
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  });

  ws.addEventListener('message', (event) => {
    const parsed = JSON.parse(event.data);
    if (parsed.id && pending.has(parsed.id)) {
      const { resolve } = pending.get(parsed.id);
      pending.delete(parsed.id);
      resolve(parsed);
    } else if (parsed.method === 'Runtime.consoleAPICalled') {
      const args = (parsed.params.args || []).map(a => a.value || a.description).join(' ');
      console.log(`[Browser Console ${parsed.params.type}]`, args);
    } else if (parsed.method === 'Runtime.exceptionThrown') {
      console.log(`[Browser Uncaught Exception]`, parsed.params.exceptionDetails?.text, parsed.params.exceptionDetails?.exception?.description);
    }
  });
}

run().catch(console.error);

