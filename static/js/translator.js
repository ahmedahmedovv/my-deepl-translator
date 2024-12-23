let translateTimeout;
const DEBOUNCE_DELAY = 500; // milliseconds
let currentMode = 'text';

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

// Add after DOMContentLoaded event
document.getElementById('textModeBtn').addEventListener('click', () => switchMode('text'));
document.getElementById('documentModeBtn').addEventListener('click', () => switchMode('document'));

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('textModeBtn').classList.toggle('selected', mode === 'text');
    document.getElementById('documentModeBtn').classList.toggle('selected', mode === 'document');
    
    document.querySelector('.panels-container').style.display = mode === 'text' ? 'flex' : 'none';
    document.getElementById('documentUploadPanel').style.display = mode === 'document' ? 'flex' : 'none';
}

// Document upload handling
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
    });
});

dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    handleFile(file);
}

async function handleFile(file) {
    const statusText = document.getElementById('statusText');
    statusText.textContent = 'Uploading and translating...';
    
    // Debug: Log file details
    console.log('File being uploaded:', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_lang', document.getElementById('targetLang').value);
    
    try {
        console.log('Starting file upload...');
        const response = await fetch('/translate-document', {
            method: 'POST',
            body: formData
        });
        
        console.log('Server response:', response.status, response.statusText);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Server returned error:', errorData);
            throw new Error(errorData.error || 'Translation failed');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Translation successful, preparing download...');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${file.name}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        statusText.textContent = 'Translation complete';
    } catch (error) {
        console.error('Translation error:', error);
        statusText.textContent = 'Translation failed';
        alert(`Translation failed: ${error.message}\n\nPlease check the browser console for more details.`);
    }
}
