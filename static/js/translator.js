let translateTimeout;
const DEBOUNCE_DELAY = 500; // milliseconds
let currentMode = 'text';

// Add these functions at the beginning of the file
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const status = document.getElementById('loadingStatus');
    status.textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add to container
    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    const file = e.target.files[0];
    handleFile(file);
}

async function handleFile(file) {
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('uploadProgress');
    const progressElement = progressBar.querySelector('.progress-bar');
    const progressStatus = document.getElementById('progressStatus');

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
    }

    // Show progress bar
    progressBar.style.display = 'block';
    progressElement.style.width = '0%';
    progressStatus.textContent = '0%';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_lang', document.getElementById('targetLang').value);

    try {
        showLoading('Detecting language...');
        statusText.textContent = 'Detecting language...';

        const response = await fetch('/translate-document', {
            method: 'POST',
            body: formData
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('same as target language')) {
                hideLoading();
                showToast('Document is already in the target language', 'info');
                statusText.textContent = 'No translation needed';
                return;
            }
            throw new Error(errorData.error || 'Translation failed');
        }

        showLoading('Downloading translated file...');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${file.name}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        hideLoading();
        showToast('Translation completed successfully!');
        statusText.textContent = 'Translation complete';
        
        // Reset progress bar
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressElement.style.width = '0%';
        }, 1000);

    } catch (error) {
        hideLoading();
        showToast(error.message, 'error');
        statusText.textContent = 'Translation failed';
        console.error('Translation error:', error);
        
        // Reset progress bar
        progressBar.style.display = 'none';
    }
}

// Add this function to create and show icons with tooltips
function createIconWithTooltip(iconType, tooltipText) {
    const icons = {
        source: `
            <span class="material-symbols-rounded">
                edit_document
            </span>
        `,
        translation: `
            <span class="material-symbols-rounded">
                translate
            </span>
        `,
        document: `
            <span class="material-symbols-rounded">
                description
            </span>
        `,
        text: `
            <span class="material-symbols-rounded">
                text_fields
            </span>
        `,
        copy: `
            <span class="material-symbols-rounded">
                content_copy
            </span>
        `,
        xcopy: `
            <span class="material-symbols-rounded">
                content_cut
            </span>
        `
    };

    return `
        <div class="icon-tooltip-container">
            ${icons[iconType]}
            <span class="tooltip">${tooltipText}</span>
        </div>
    `;
}

// Update the panel headers with icons
document.addEventListener('DOMContentLoaded', () => {
    // Source panel icon
    const sourcePanelLabel = document.querySelector('.panel-header .panel-label');
    sourcePanelLabel.innerHTML = `
        ${createIconWithTooltip('source', 'Enter your text here')}
        <span class="ml-2">Source Text</span>
    `;

    // Translation panel icon
    const translationPanelLabel = document.querySelectorAll('.panel-header .panel-label')[1];
    translationPanelLabel.innerHTML = `
        ${createIconWithTooltip('translation', 'Translated text appears here')}
        <span class="ml-2">Translation</span>
    `;

    // Update copy buttons
    document.getElementById('copyButton').innerHTML = `
        ${createIconWithTooltip('copy', 'Copy translation')}
        Copy
    `;

    document.getElementById('xcopyButton').innerHTML = `
        ${createIconWithTooltip('xcopy', 'Copy and clean translation')}
        XCopy
    `;

    // Update mode toggle buttons
    document.getElementById('textModeBtn').innerHTML = `
        ${createIconWithTooltip('text', 'Switch to text mode')}
        Text
    `;

    document.getElementById('documentModeBtn').innerHTML = `
        ${createIconWithTooltip('document', 'Switch to document mode')}
        Document
    `;
});
