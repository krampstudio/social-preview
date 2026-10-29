// Installs build/chrome in Chrome for Testing, opens each URL and clicks the
// toolbar action, so the real popup runs with a real activeTab grant.
import puppeteer from 'puppeteer';
import {ROOT, URLS, checkPopup, done, wait} from './common.mjs';

const browser = await puppeteer.launch({browser: 'chrome', headless: true, pipe: true, enableExtensions: true});
const id = await browser.installExtension(`${ROOT}/build/chrome`);
let ext;
for (let tries = 0; !ext && tries < 20; tries++) {
    // the extension is listed shortly after install resolves
    ext = (await browser.extensions()).get(id) ?? await wait(250);
}
console.log(`Chrome ${await browser.version()}, ${ext.name} ${ext.version}`);

for (const [i, url] of URLS.entries()) {
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
    const opened = browser.waitForTarget(t => t.url().endsWith('/popup.html'), {timeout: 15000});
    await ext.triggerAction(page);
    const popup = await (await opened).asPage();
    await popup.waitForSelector('#tabs button', {timeout: 10000});
    await wait(2000); // let images load
    await checkPopup(popup, url, `chrome-${i}`);
    await popup.close();
    await page.close();
}
await browser.close();
done();
