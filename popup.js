document.addEventListener('DOMContentLoaded', function () {
    // Get current tab URL and find og:image
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs[0]) return;
        
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: () => {
                const meta = document.querySelector('meta[property="og:image"]');
                return meta ? meta.content : null;
            }
        }, results => {
            if (!results[0].result) return;
            const imageUrl = new URL(results[0].result, tabs[0].url).toString();
            const previewDiv = document.getElementById('image-preview');
            const noImageDiv = document.getElementById('no-image');
            const urlDiv = document.getElementById('url');
            // Create preview image
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Social Thumbnail Preview";
            previewDiv.appendChild(img);
            noImageDiv.style.display = 'none';
            urlDiv.innerHTML = `<a href="${imageUrl}" target="_blank">${imageUrl}</a>`;
            previewDiv.style.display = 'block';
        });
    });
});

