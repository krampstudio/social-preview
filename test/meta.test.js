const test = require('node:test');
const assert = require('node:assert/strict');
const {buildPreview, checkPreview} = require('../meta.js');

const page = (tags, extra = {}) => ({
    url: 'https://www.example.com/blog/post?id=1',
    baseURI: 'https://www.example.com/blog/post?id=1',
    title: 'Document title',
    tags,
    canonical: null,
    icon: null,
    ...extra
});

test('uses Open Graph tags and resolves relative images', () => {
    const p = buildPreview(page({
        'og:title': 'OG title',
        'og:description': 'OG description',
        'og:image': '/img/cover.png',
        'og:site_name': 'Example'
    }));
    assert.equal(p.domain, 'example.com');
    assert.equal(p.og.title.value, 'OG title');
    assert.equal(p.og.image.value, 'https://www.example.com/img/cover.png');
    assert.equal(p.og.image.raw, '/img/cover.png');
    assert.equal(p.favicon, 'https://www.example.com/favicon.ico');
});

test('twitter tags override Open Graph for X, falling back to og', () => {
    const p = buildPreview(page({
        'og:title': 'OG title',
        'og:image': 'https://cdn.example.com/og.png',
        'twitter:title': 'Tweet title',
        'twitter:card': 'summary_large_image'
    }));
    assert.equal(p.twitter.title.value, 'Tweet title');
    assert.equal(p.twitter.title.source, 'twitter:title');
    assert.equal(p.twitter.image.value, 'https://cdn.example.com/og.png');
    assert.equal(p.twitter.image.source, 'og:image');
    assert.equal(p.og.title.value, 'OG title');
});

test('falls back to <title> and meta description', () => {
    const p = buildPreview(page({description: 'Meta description'}, {icon: 'icons/fav.svg'}));
    assert.equal(p.og.title.value, 'Document title');
    assert.equal(p.og.title.source, '<title>');
    assert.equal(p.og.description.source, 'description');
    assert.equal(p.twitter.description.value, 'Meta description');
    assert.equal(p.og.image.value, '');
    assert.equal(p.favicon, 'https://www.example.com/blog/icons/fav.svg');
});

test('checks report missing and undersized metadata', () => {
    const bare = checkPreview(buildPreview(page({})));
    assert.ok(bare.some(c => c.level === 'error' && /og:image/.test(c.message)));
    assert.ok(bare.some(c => c.level === 'warn' && /twitter:card/.test(c.message)));

    const full = buildPreview(page({
        'og:title': 'T', 'og:description': 'D', 'og:image': 'https://x.test/a.png',
        'og:url': 'https://example.com', 'og:site_name': 'S', 'twitter:card': 'summary_large_image'
    }));
    assert.deepEqual(checkPreview(full, {width: 1200, height: 630}).filter(c => c.level !== 'ok'), []);
    assert.ok(checkPreview(full, {width: 300, height: 200}).some(c => /small thumbnail/.test(c.message)));
});
