
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
            // Create preview image
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Social Thumbnail Preview";
            previewDiv.appendChild(img);
            noImageDiv.style.display = 'none';
            previewDiv.style.display = 'block';
        });
    });


