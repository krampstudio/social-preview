// Firefox and Safari expose the promise-based `browser`, Chrome only `chrome`
const ext = globalThis.browser ?? globalThis.chrome;

const TAGS_TAB = {id: 'tags', name: 'Tags'};
const STORAGE_KEY = 'social-preview:tab';

async function readActiveTab() {
    const [tab] = await ext.tabs.query({active: true, currentWindow: true});
    if (!tab) throw new Error('No active tab');
    const [injection] = await ext.scripting.executeScript({
        target: {tabId: tab.id},
        func: extractPageMeta
    });
    if (!injection || !injection.result) throw new Error('No result from the page');
    return injection.result;
}

function probeImage(url) {
    if (!url) return Promise.resolve(null);
    return new Promise(resolve => {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.onload = () => resolve({width: img.naturalWidth, height: img.naturalHeight});
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

function savedTab() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function saveTab(id) {
    try {
        localStorage.setItem(STORAGE_KEY, id);
    } catch {
        // storage can be unavailable (private mode), the tab just won't be remembered
    }
}

function renderTags(preview, imageSize) {
    const icons = {ok: '✓', warn: '!', error: '✕', info: 'i'};
    const checks = checkPreview(preview, imageSize);
    const image = preview.og.image.value;

    const rows = [['<title>', preview.title.value]];
    for (const [key, value] of Object.entries(preview.tags)) {
        if (/^(og|twitter|article|fb):|^(description|theme-color)$/.test(key)) rows.push([key, value]);
    }
    if (preview.canonical) rows.push(['canonical', preview.canonical]);

    return h('div', {class: 'tags'},
        h('ul', {class: 'checks'},
            checks.map(c => h('li', {class: `check check-${c.level}`},
                h('span', {class: 'check-icon', 'aria-label': c.level}, icons[c.level]),
                c.message
            ))
        ),
        image && h('div', {class: 'tags-image'},
            previewImage(image, 'tags-thumb'),
            h('div', {},
                h('div', {class: 'tags-dims'}, imageSize ? `${imageSize.width} × ${imageSize.height}px` : 'Size unknown'),
                link(image, image)
            )
        ),
        h('table', {class: 'tag-table'},
            h('tbody', {}, rows.map(([key, value]) => h('tr', {},
                h('th', {scope: 'row'}, key),
                h('td', {}, value)
            )))
        )
    );
}

function renderPanel(id, preview, imageSize) {
    const panel = document.getElementById('panel');
    const platform = PLATFORMS.find(p => p.id === id);
    panel.replaceChildren(platform ? platform.render(preview) : renderTags(preview, imageSize));
    panel.setAttribute('aria-labelledby', `tab-${id}`);
}

function renderTabs(preview, imageSize) {
    const nav = document.getElementById('tabs');
    const tabs = [...PLATFORMS, TAGS_TAB];
    let current = tabs.some(t => t.id === savedTab()) ? savedTab() : tabs[0].id;

    const select = id => {
        current = id;
        saveTab(id);
        for (const button of nav.children) {
            button.setAttribute('aria-selected', String(button.dataset.id === id));
            button.tabIndex = button.dataset.id === id ? 0 : -1;
        }
        renderPanel(id, preview, imageSize);
    };

    nav.replaceChildren(...tabs.map(tab => {
        const button = h('button', {type: 'button', role: 'tab', id: `tab-${tab.id}`, 'data-id': tab.id}, tab.name);
        button.addEventListener('click', () => select(tab.id));
        return button;
    }));
    nav.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const index = tabs.findIndex(t => t.id === current);
        const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        select(next.id);
        nav.querySelector(`[data-id="${next.id}"]`).focus();
    });
    select(current);
    return {refresh: size => {
        imageSize = size;
        if (current === TAGS_TAB.id) renderPanel(current, preview, imageSize);
    }};
}

function renderHeader(preview) {
    const icon = document.getElementById('page-icon');
    icon.addEventListener('error', () => icon.hidden = true);
    icon.src = preview.favicon;
    document.getElementById('page-domain').textContent = preview.domain;
    document.getElementById('page-url').textContent = preview.url;
}

function renderError(message) {
    document.getElementById('page').hidden = true;
    document.getElementById('panel').replaceChildren(
        h('div', {class: 'status status-error'},
            h('strong', {}, 'Can’t preview this page'),
            h('p', {}, message)
        )
    );
}

async function init() {
    let meta;
    try {
        meta = await readActiveTab();
    } catch (err) {
        console.warn('Social Preview:', err);
        renderError('Browser pages, extension stores and other restricted pages can’t be read by extensions. Try on a regular web page.');
        return;
    }
    const preview = buildPreview(meta);
    renderHeader(preview);
    const tabs = renderTabs(preview, null);
    tabs.refresh(await probeImage(preview.og.image.value));
}

document.addEventListener('DOMContentLoaded', init);
