// Safari's popup can't be automated, so this checks Safari's engine (WebKit):
// the real extraction runs against each URL, and the real popup renders
// through test/harness.html, which stubs only the extension API.
import {webkit} from 'playwright';
import {readFileSync} from 'node:fs';
import {ROOT, SHOTS, TABS, URLS, done, expect} from './common.mjs';

const browser = await webkit.launch();
console.log(`WebKit ${browser.version()}`);
// bypassCSP: the extension injects through scripting.executeScript, which page CSP doesn't block
const context = await browser.newContext({viewport: {width: 440, height: 600}, bypassCSP: true});
const metaSource = readFileSync(`${ROOT}/meta.js`, 'utf8');

for (const url of URLS) {
    const page = await context.newPage();
    await page.goto(url, {waitUntil: 'load', timeout: 60000});
    await page.addScriptTag({content: metaSource});
    const preview = await page.evaluate(() => buildPreview(extractPageMeta()));
    expect(preview.og.title.value && preview.og.image.value, `${preview.domain}: extracts title and image`);
    await page.close();
}

for (const fixture of ['large', 'summary', 'bare']) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const tab of TABS) {
        await page.goto(`file://${ROOT}/test/harness.html?fixture=${fixture}&tab=${tab}`);
        await page.waitForTimeout(1000);
        const text = (await page.innerText('#panel')).trim();
        expect(text.length > 0, `${fixture} fixture: ${tab} tab renders`);
        await page.screenshot({path: `${SHOTS}/webkit-${fixture}-${tab}.png`});
    }
    expect(errors.length === 0, `${fixture} fixture: no script errors ${errors.join(', ')}`);
    await page.close();
}
await browser.close();
done();
