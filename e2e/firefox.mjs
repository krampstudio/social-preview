// Installs build/firefox in Firefox. Automation can't click a toolbar action
// in Firefox, so a test copy of the extension adds host permissions and opens
// popup.html in a tab, which is then pointed at each page's tab. The `browser`
// namespace, scripting.executeScript and rendering all run for real.
import puppeteer from 'puppeteer';
import {cpSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {ROOT, SHOTS, URLS, checkPopup, done, wait} from './common.mjs';

const testBuild = `${SHOTS}/firefox-extension`;
rmSync(testBuild, {recursive: true, force: true});
cpSync(`${ROOT}/build/firefox`, testBuild, {recursive: true});
const manifest = JSON.parse(readFileSync(`${testBuild}/manifest.json`, 'utf8'));
manifest.host_permissions = ['<all_urls>'];
manifest.background = {scripts: ['open-popup.js']};
writeFileSync(`${testBuild}/manifest.json`, JSON.stringify(manifest));
writeFileSync(`${testBuild}/open-popup.js`, "browser.tabs.create({url: browser.runtime.getURL('popup.html')});");

const browser = await puppeteer.launch({
    browser: 'firefox',
    headless: true,
    // needed for automation to reach moz-extension:// pages
    env: {...process.env, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1'}
});
console.log(`Firefox ${await browser.version()}, ${await browser.installExtension(testBuild)}`);
await wait(2000);

let popup;
for (const page of await browser.pages()) {
    if ((await page.evaluate(() => location.href)).startsWith('moz-extension://')) popup = page;
}
if (!popup) throw new Error('Extension popup page did not open');
await popup.evaluate(() => globalThis.realQuery = browser.tabs.query);

for (const [i, url] of URLS.entries()) {
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
    await popup.evaluate(async origin => {
        const [target] = await globalThis.realQuery({url: `${origin}/*`});
        browser.tabs.query = async () => [target];
        document.getElementById('page').hidden = false;
        await init();
    }, new URL(url).origin);
    await wait(2000);
    await checkPopup(popup, url, `firefox-${i}`);
    await page.close();
}
await browser.close();
done();
