import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
export const SHOTS = `${ROOT}/build/e2e`;
export const TABS = ['x', 'facebook', 'linkedin', 'slack', 'discord', 'tags'];
export const URLS = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['https://huggingface.co', 'https://developer.mozilla.org/en-US/'];

mkdirSync(SHOTS, {recursive: true});

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let failures = 0;

export function expect(condition, message) {
    console.log(`  ${condition ? '✓' : '✕'} ${message}`);
    if (!condition) failures++;
}

/**
 * Clicks through every tab of an opened popup (Puppeteer page),
 * checking each one renders content, and saves a screenshot per tab.
 */
export async function checkPopup(popup, url, prefix) {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    expect(await popup.$eval('#page-domain', e => e.textContent) === domain, `${prefix}: popup reads ${domain}`);
    for (const tab of TABS) {
        await popup.click(`#tabs [data-id="${tab}"]`);
        await wait(400);
        const text = await popup.$eval('#panel', e => e.innerText.trim());
        expect(text.length > 0 && !text.includes('Can’t preview'), `${prefix}: ${tab} tab renders`);
        await popup.screenshot({path: `${SHOTS}/${prefix}-${tab}.png`});
    }
}

export function done() {
    console.log(failures ? `${failures} check(s) failed` : 'All checks passed');
    process.exit(failures ? 1 : 0);
}
