/**
 * Tiny DOM builder: strings become text nodes, never HTML,
 * so page metadata can't inject markup into the popup.
 */
function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === 'class') el.className = value;
        else el.setAttribute(key, value);
    }
    for (const child of children.flat()) {
        if (child === null || child === undefined || child === false || child === '') continue;
        el.append(child instanceof Node ? child : String(child));
    }
    return el;
}

function previewImage(src, className) {
    if (!src) return null;
    const img = h('img', {class: className, src, alt: '', referrerpolicy: 'no-referrer'});
    img.addEventListener('error', () => {
        img.replaceWith(h('div', {class: `${className} img-error`}, 'Image failed to load'));
    });
    return img;
}

function link(url, ...children) {
    return h('a', {href: url, target: '_blank', rel: 'noopener noreferrer'}, ...children);
}

/**
 * Each platform reads the page metadata with its own fallbacks and lays the
 * card out its own way. These mockups follow the current desktop layouts.
 */
const PLATFORMS = [
    {
        id: 'x',
        name: 'X',
        render(p) {
            const {card, title, description, image} = p.twitter;
            const large = card.value === 'summary_large_image' && image.value;
            if (large) {
                return h('div', {class: 'x'},
                    link(p.url, h('div', {class: 'x-card x-large'},
                        previewImage(image.value, 'x-image'),
                        title.value && h('span', {class: 'x-overlay'}, title.value)
                    )),
                    h('div', {class: 'x-from'}, `From ${p.domain}`)
                );
            }
            return h('div', {class: 'x'},
                link(p.url, h('div', {class: 'x-card x-summary'},
                    image.value
                        ? previewImage(image.value, 'x-thumb')
                        : h('div', {class: 'x-thumb x-thumb-empty'}, '🗎'),
                    h('div', {class: 'x-text'},
                        h('div', {class: 'x-domain'}, p.domain),
                        h('div', {class: 'x-title'}, title.value),
                        h('div', {class: 'x-desc'}, description.value)
                    )
                ))
            );
        }
    },
    {
        id: 'facebook',
        name: 'Facebook',
        render(p) {
            const {title, description, image} = p.og;
            return link(p.url, h('div', {class: 'fb'},
                previewImage(image.value, 'fb-image'),
                h('div', {class: 'fb-text'},
                    h('div', {class: 'fb-domain'}, p.domain.toUpperCase()),
                    h('div', {class: 'fb-title'}, title.value),
                    h('div', {class: 'fb-desc'}, description.value)
                )
            ));
        }
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        render(p) {
            const {title, image} = p.og;
            return link(p.url, h('div', {class: 'li'},
                previewImage(image.value, 'li-image'),
                h('div', {class: 'li-text'},
                    h('div', {class: 'li-title'}, title.value),
                    h('div', {class: 'li-domain'}, p.domain)
                )
            ));
        }
    },
    {
        id: 'slack',
        name: 'Slack',
        render(p) {
            const {title, description, image, siteName} = p.og;
            const thumb = p.twitter.card.value === 'summary';
            return h('div', {class: 'slack'}, h('div', {class: 'slack-attachment'},
                h('div', {class: 'slack-body'},
                    h('div', {class: 'slack-site'},
                        previewImage(p.favicon, 'slack-icon'),
                        siteName.value || p.domain
                    ),
                    h('div', {class: 'slack-title'}, link(p.url, title.value)),
                    h('div', {class: 'slack-desc'}, description.value),
                    !thumb && previewImage(image.value, 'slack-image')
                ),
                thumb && previewImage(image.value, 'slack-thumb')
            ));
        }
    },
    {
        id: 'discord',
        name: 'Discord',
        render(p) {
            // Discord prefers twitter:* tags and uses theme-color for the embed border
            const {title, description, image, card} = p.twitter;
            const {siteName} = p.og;
            const large = card.value === 'summary_large_image';
            const embed = h('div', {class: 'discord-embed'},
                h('div', {class: 'discord-body'},
                    siteName.value && h('div', {class: 'discord-site'}, siteName.value),
                    h('div', {class: 'discord-title'}, link(p.url, title.value)),
                    h('div', {class: 'discord-desc'}, description.value),
                    large && previewImage(image.value, 'discord-image')
                ),
                !large && previewImage(image.value, 'discord-thumb')
            );
            // assigning through CSSOM drops invalid values instead of injecting declarations
            if (p.themeColor) embed.style.borderLeftColor = p.themeColor;
            return h('div', {class: 'discord'}, embed);
        }
    }
];

if (typeof module !== 'undefined') module.exports = {PLATFORMS};
