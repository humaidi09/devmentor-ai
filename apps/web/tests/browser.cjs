const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'Use an isolated local prototype');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,args:['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e=>errors.push(e.message));
    const go = async path => { await page.goto(base+path,{waitUntil:'networkidle'}); };
    await go('/onboarding');
    await page.getByLabel('Campus (optional)', {exact:true}).selectOption('not-listed');
    await page.getByText('Only fictional demo information', {exact:false}).waitFor();
    await page.getByRole('checkbox',{name:'Academic Study',exact:true}).uncheck();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.waitForURL('**/dashboard');
    assert.equal(await page.getByRole('link',{name:'Academic Study',exact:true}).count(),0);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.getByRole('link',{name:'Academic Study',exact:true}).count(),0);
    await go('/settings');
    await page.getByRole('switch',{name:'Academic Study',exact:true}).click();
    await page.getByRole('switch',{name:'Reminders',exact:true}).click();
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.getByRole('switch',{name:'Reminders',exact:true}).getAttribute('aria-checked'),'true');
    console.log('PASS onboarding, campus fallback and saved preferences');

    await go('/support/resources/r-house-office');
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.reload({waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Saved',exact:true}).waitFor();
    await go('/support');
    await page.getByLabel('Message',{exact:true}).fill('tuition fees');
    await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.getByText('Here are some verified resources', {exact:false}).waitFor();
    await page.route('**/api/chat',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'}));
    await page.getByLabel('Message',{exact:true}).fill('help');
    await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.getByText('Sorry, something went wrong.',{exact:false}).waitFor();
    await page.unroute('**/api/chat');
    console.log('PASS saved resources, chat, API error fallback');

    await go('/learn/visual-lab/bubble-sort');
    await page.getByLabel('Numbers (comma-separated)',{exact:true}).fill('3, 1, 2');
    await page.getByRole('button',{name:'Apply example',exact:true}).click();
    await page.getByRole('button',{name:'Next step',exact:true}).focus();
    await page.keyboard.press('Enter');
    await page.getByText('Compare 3 and 1.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Previous step',exact:true}).click();
    await page.getByLabel('Numbers (comma-separated)',{exact:true}).fill('oops');
    await page.getByRole('button',{name:'Apply example',exact:true}).click();
    await page.getByRole('alert').waitFor();
    await page.getByRole('button',{name:'Show steps as text',exact:true}).click();
    assert.equal(await page.locator('#text-steps li').count(),9);
    // Keyboard navigation and visible focus, with reduced-motion preference.
    await go('/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(),'Skip to main content');
    assert.notEqual(await page.locator(':focus').evaluate(el=>getComputedStyle(el).position),'static');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'),'main-content');
    console.log('PASS visual logic controls, invalid input, keyboard skip/focus');

    const routes=['/','/onboarding','/dashboard','/support','/support/resources','/support/resources/r-fin-tuition','/support/saved','/support/steps','/support/human','/study','/learn','/cp','/settings','/learn/visual-lab',...['bfs','dfs','bubble-sort','binary-search','sql-inner-join','normalization'].map(x=>'/learn/visual-lab/'+x)];
    for (const route of routes) {
      await go(route);
      const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
      assert.deepEqual(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],route+' accessibility');
      await page.setViewportSize({width:360,height:800});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' English overflow');
      await page.getByRole('button',{name:'বাংলা',exact:true}).first().click();
      assert.equal(await page.locator('html').getAttribute('lang'),'bn');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' Bangla overflow');
      if(route==='/learn/visual-lab/normalization') await page.getByText('UNF: courses ঘরে',{exact:false}).waitFor();
      await page.getByRole('button',{name:'EN',exact:true}).first().click();
      await page.setViewportSize({width:1440,height:1000});
      console.log('PASS route + accessibility + bilingual mobile:',route);
    }
    // Wait for complete public pre-cache, then reload and navigate without network.
    await page.evaluate(async()=>{await navigator.serviceWorker.ready; if(!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    await context.setOffline(true);
    await go('/learn/visual-lab/normalization');
    await page.getByRole('heading',{name:'Normalization',exact:true}).waitFor();
    await page.getByRole('button',{name:'Next step',exact:true}).click();
    await page.getByText('1NF: one value per cell.',{exact:false}).waitFor();
    await go('/support');
    await page.getByLabel('Message',{exact:true}).fill('tuition fees');
    await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.getByText('Here are some verified resources',{exact:false}).waitFor();
    const cacheKeys=await page.evaluate(async()=>{const entries=[];for(const k of await caches.keys())for(const r of await (await caches.open(k)).keys())entries.push(new URL(r.url).pathname);return entries;});
    assert.ok(!cacheKeys.some(p=>p.startsWith('/api/')));
    await context.setOffline(false);
    await go('/settings');
    await page.evaluate(()=>localStorage.setItem('unrelated-app','keep'));
    page.once('dialog',d=>d.accept());
    await page.getByRole('button',{name:'Clear demo data',exact:true}).click();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-app')),'keep');
    assert.equal(await page.evaluate(()=>localStorage.getItem('close-ai-preferences')),null);
    assert.deepEqual(errors,[]);
    console.log('PASS offline reload + local chat, API cache exclusion, scoped deletion; no browser errors');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
