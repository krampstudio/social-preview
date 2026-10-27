/**
 * Runs inside the inspected page through scripting.executeScript, so it must
 * stay self-contained: no closure, no reference to anything outside its body.
 */
function extractPageMeta() {
    const tags = {};
    for (const el of document.querySelectorAll('meta[content]')) {
        const key = (el.getAttribute('property') || el.getAttribute('name') || '').trim().toLowerCase();
        const value = el.getAttribute('content').trim();
        if (key && value && !(key in tags)) tags[key] = value;
    }
    const href = selector => document.querySelector(selector)?.getAttribute('href') || null;
    return {
        url: location.href,
        baseURI: document.baseURI,
        title: document.title.trim(),
        tags,
        canonical: href('link[rel~="canonical" i]'),
        icon: href('link[rel~="icon" i]') || href('link[rel~="apple-touch-icon" i]')
    };
}

/**
 * Resolves the raw page metadata into the values each platform reads,
 * following the fallback order the platforms use. Each field keeps the tag it
 * came from so the inspector can explain where a value is coming from.
 */
function buildPreview(meta) {
    const tags = meta.tags || {};
    const absolute = value => {
        try {
            return new URL(value, meta.baseURI || meta.url).href;
        } catch {
            return null;
        }
    };
    const field = (keys, fallback) => {
        for (const key of keys) {
            if (tags[key]) return {value: tags[key], source: key};
        }
        return fallback && fallback.value ? fallback : {value: '', source: null};
    };
    const image = keys => {
        const found = field(keys);
        return found.value ? {...found, raw: found.value, value: absolute(found.value)} : found;
    };
    const titleTag = {value: meta.title || '', source: '<title>'};

    const pageUrl = new URL(meta.url);
    const iconUrl = meta.icon ? absolute(meta.icon) : `${pageUrl.origin}/favicon.ico`;

    return {
        url: meta.url,
        domain: pageUrl.hostname.replace(/^www\./, '') || pageUrl.href,
        favicon: iconUrl,
        themeColor: tags['theme-color'] || null,
        tags,
        title: titleTag,
        canonical: meta.canonical ? absolute(meta.canonical) : null,
        og: {
            title: field(['og:title'], titleTag),
            description: field(['og:description', 'description']),
            image: image(['og:image', 'og:image:url', 'og:image:secure_url']),
            siteName: field(['og:site_name']),
            url: field(['og:url'])
        },
        twitter: {
            card: field(['twitter:card']),
            title: field(['twitter:title', 'og:title'], titleTag),
            description: field(['twitter:description', 'og:description', 'description']),
            image: image(['twitter:image', 'twitter:image:src', 'og:image', 'og:image:url', 'og:image:secure_url']),
            site: field(['twitter:site'])
        }
    };
}

/**
 * Lists what is missing or likely to render poorly.
 * `imageSize` is the natural size of the og:image once loaded, if known.
 */
function checkPreview(preview, imageSize) {
    const checks = [];
    const add = (level, message) => checks.push({level, message});
    const {og, twitter} = preview;

    if (og.title.source === 'og:title') add('ok', 'og:title is set');
    else add('warn', 'og:title is missing, platforms fall back to the page <title>');
    if (og.title.value.length > 70) add('warn', `Title is ${og.title.value.length} characters, it will likely be truncated (aim for 70 or less)`);

    if (og.description.source === 'og:description') add('ok', 'og:description is set');
    else if (og.description.value) add('warn', 'og:description is missing, using <meta name="description">');
    else add('error', 'No description found (og:description or description)');
    if (og.description.value.length > 200) add('warn', `Description is ${og.description.value.length} characters, it will be truncated (aim for 200 or less)`);

    if (!og.image.value) {
        add('error', 'og:image is missing, most platforms will show no image');
    } else {
        add('ok', 'og:image is set');
        if (!/^https?:\/\//i.test(og.image.raw)) add('warn', 'og:image should be an absolute URL, some crawlers do not resolve relative URLs');
        else if (og.image.value.startsWith('http:')) add('warn', 'og:image is served over HTTP, prefer HTTPS');
    }
    if (imageSize) {
        const {width, height} = imageSize;
        if (width < 600 || height < 315) add('warn', `Image is ${width}×${height}, below 600×315 it is shown as a small thumbnail`);
        else if (width < 1200 || height < 630) add('ok', `Image is ${width}×${height} (1200×630 recommended for high-DPI screens)`);
        else add('ok', `Image is ${width}×${height}`);
        const ratio = width / height;
        if (Math.abs(ratio - 1.91) > 0.25 && twitter.card.value !== 'summary') add('warn', `Image ratio is ${ratio.toFixed(2)}:1, it will be cropped to 1.91:1`);
    }

    if (!og.url.value) add('warn', 'og:url is missing, the shared URL is used as canonical');
    if (!og.siteName.value) add('info', 'og:site_name is not set, the domain is used instead');

    if (twitter.card.value) add('ok', `twitter:card is "${twitter.card.value}"`);
    else add('warn', 'twitter:card is missing, X uses the compact "summary" card');

    return checks;
}

if (typeof module !== 'undefined') module.exports = {extractPageMeta, buildPreview, checkPreview};
