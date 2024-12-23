let translateTimeout;
const DEBOUNCE_DELAY = 500; // milliseconds

// Load saved language preference
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
        document.getElementById('targetLang').value = savedLang;
    }
});

// Save language preference and trigger translation
document.getElementById('targetLang').addEventListener('change', (e) => {
    localStorage.setItem('preferredLanguage', e.target.value);
    translateText();
});

// Handle input and paste events
document.getElementById('sourceText').addEventListener('input', () => {
    clearTimeout(translateTimeout);
    const statusText = document.getElementById('statusText');
    statusText.textContent = 'Waiting for you to stop typing...';
    
    translateTimeout = setTimeout(() => {
        translateText();
    }, DEBOUNCE_DELAY);
});

async function translateText() {
    const sourceText = document.getElementById('sourceText').value.trim();
    const targetLang = document.getElementById('targetLang').value;
    const translatedTextArea = document.getElementById('translatedText');
    const detectedLangElement = document.getElementById('detectedLang');
    const statusText = document.getElementById('statusText');

    // Don't translate if text is empty
    if (!sourceText) {
        translatedTextArea.value = '';
        detectedLangElement.textContent = 'Detected language: -';
        statusText.textContent = 'Type or paste text to translate...';
        return;
    }

    statusText.textContent = 'Translating...';
    
    try {
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: sourceText,
                target_lang: targetLang
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            translatedTextArea.value = data.translated_text;
            detectedLangElement.textContent = `Detected language: ${data.detected_language}`;
            statusText.textContent = 'Translation complete';
        } else {
            statusText.textContent = 'Translation failed';
            alert('Translation failed: ' + data.error);
        }
    } catch (error) {
        statusText.textContent = 'Translation failed';
        alert('Error: ' + error.message);
    }
}

async function copyTranslation() {
    const translatedText = document.getElementById('translatedText').value;
    const copyButton = document.getElementById('copyButton');
    
    try {
        await navigator.clipboard.writeText(translatedText);
        
        // Update button text to show success
        copyButton.innerHTML = `
            <svg class="octicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
            </svg>
            Copied!
        `;
        
        // Reset button text after 2 seconds
        setTimeout(() => {
            copyButton.innerHTML = `
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16">
                    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                </svg>
                Copy
            `;
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
        copyButton.textContent = 'Failed to copy';
        
        setTimeout(() => {
            copyButton.innerHTML = `
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16">
                    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                </svg>
                Copy
            `;
        }, 2000);
    }
}

// Add event listener when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const xcopyButton = document.getElementById('xcopyButton');
    if (xcopyButton) {
        xcopyButton.addEventListener('click', xCopyTranslation);
        console.log('XCopy button listener attached');
    } else {
        console.error('XCopy button not found!');
    }
});

async function xCopyTranslation() {
    // Get the text and clean it - that's it!
    const text = document.getElementById('translatedText').value;
    const cleaned = text.replace(/\s+/g, ' ').trim();
    
    try {
        await navigator.clipboard.writeText(cleaned);
        
        // Visual feedback
        const xcopyButton = document.getElementById('xcopyButton');
        xcopyButton.textContent = 'Cleaned!';
        setTimeout(() => xcopyButton.textContent = 'XCopy', 2000);
    } catch (err) {
        console.error('Copy failed:', err);
    }
}

// Connect button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('xcopyButton')
        .addEventListener('click', xCopyTranslation);
});
