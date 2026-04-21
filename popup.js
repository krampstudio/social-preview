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
            if (chrome.runtime.lastError || !results || !results[0] || !results[0].result) return;
            const imageUrl = new URL(results[0].result, tabs[0].url).toString();
            const previewDiv = document.getElementById('image-preview');
            const noImageDiv = document.getElementById('no-image');
            const urlDiv = document.getElementById('url');

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Social Thumbnail Preview";
            previewDiv.appendChild(img);
            noImageDiv.style.display = 'none';

            const link = document.createElement('a');
            link.href = imageUrl;
            link.target = '_blank';
            link.textContent = imageUrl;
            urlDiv.appendChild(link);

            previewDiv.style.display = 'block';
        });
    });
});

