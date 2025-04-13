/**
 * n8n Chat Widget
 * A customizable chat widget that can be embedded in any website
 * Handles conversations, file attachments, and markdown rendering
 */

// Initialization state
let hasInitialized = false;

// Global variables for state management
let conversations = [];
let activeConversationIndex = -1;
let currentSessionId = '';
let attachedFiles = [];
let chatMessages = [];
let chatContainer, messagesContainer, textarea, sendButton;
let toggleButton, attachmentButton, fileInput, fileList;
let menuButtons, expandButtons, downloadButtons;
let viewConversationsButtons, newConversationButtons, newChatBtn;
let chatInterface;
let config = {};

// Initialize chat widget when DOM is ready
document.addEventListener('DOMContentLoaded', initChatWidget);

// Re-hydrate when navigating with Astro view transitions
document.addEventListener('astro:after-swap', function() {
    console.log("Astro after swap detected, re-initializing chat widget");
    // Reset initialization flag to force full reinit
    hasInitialized = false;
    // Reinitialize the chat widget
    initChatWidget();
});

/**
 * Initialize the chat widget - run only once per page load
 */
function initChatWidget() {
    console.log("Initializing chat widget, hasInitialized:", hasInitialized);
    
    // Always clean up any existing chat widgets before reinitializing
    const existingWidgets = document.querySelectorAll('.n8n-chat-widget');
    existingWidgets.forEach(widget => {
        widget.remove();
    });
    
    if (hasInitialized) return; // Prevent duplicate initialization
    hasInitialized = true;
    
    // Load configuration
    loadConfig();
    
    // Load external resources
    loadExternalResources();
    
    // Inject styles
    injectStyles();
    
    // Create widget DOM structure
    createWidgetDOM();
    
    // Setup UI event handlers
    setupChatUI();
    
    // Hydrate with previous conversations
    hydrateChatWidget();
    
    console.log("Chat widget initialization complete");
}

/**
 * Load and hydrate previous conversations
 */
function hydrateChatWidget() {
    // Load saved conversations
    if (loadConversations() && conversations.length > 0) {
        // Load the most recent conversation by default
        loadConversation(0);
    }
}

/**
 * Load configuration from window variable or use defaults
 */
function loadConfig() {
    // Default configuration
    const defaultConfig = {
        webhook: {
            url: '',
            route: ''
        },
        branding: {
            logo: '',
            name: '',
            welcomeText: '',
            responseTimeText: '',
            poweredBy: {
                text: 'Powered by InnovaQuest',
                link: 'https://innovaquest.ai'
            }
        },
        style: {
            primaryColor: '',
            secondaryColor: '',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#333333'
        }
    };
    
    // Merge user config with defaults
    config = window.ChatWidgetConfig ? 
        {
            webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
            style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
        } : defaultConfig;
}

/**
 * Load external resources (fonts, highlight.js, marked)
 */
function loadExternalResources() {
    // Load Geist font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);
    
    // Load Marked.js for Markdown parsing
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js';
    document.head.appendChild(markedScript);
    
    // Highlight.js for code syntax highlighting
    const highlightCssLink = document.createElement('link');
    highlightCssLink.rel = 'stylesheet';
    highlightCssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css';
    document.head.appendChild(highlightCssLink);
    
    const highlightJsScript = document.createElement('script');
    highlightJsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
    document.head.appendChild(highlightJsScript);
}

/**
 * Inject CSS styles for the chat widget
 */
function injectStyles() {
    const styles = `
        .n8n-chat-widget {
            --chat--color-primary: var(--n8n-chat-primary-color, ${config.style.primaryColor || '#854fff'});
            --chat--color-secondary: var(--n8n-chat-secondary-color, ${config.style.secondaryColor || '#6b3fd4'});
            --chat--color-background: var(--n8n-chat-background-color, ${config.style.backgroundColor || '#ffffff'});
            --chat--color-font: var(--n8n-chat-font-color, ${config.style.fontColor || '#333333'});
            font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .n8n-chat-widget .loader {
            width: 20px;
            aspect-ratio: 1;
            color: var(--chat--color-primary);
            border: 2px solid;
            display: grid;
            box-sizing: border-box;
            animation: l1 4s infinite linear;
        }
        
        .n8n-chat-widget .loader::before,
        .n8n-chat-widget .loader::after {
            content: "";
            grid-area: 1/1;
            margin: auto;
            width: 70.7%;
            aspect-ratio: 1;
            border: 2px solid;
            box-sizing: content-box;
            animation: inherit;
        }
        
        .n8n-chat-widget .loader::after {
            width: 50%;
            aspect-ratio: 1;
            border: 2px solid;
            animation-duration: 2s;
        }
        
        @keyframes l1 {
            100% {transform: rotate(1turn)}
        }
        .n8n-chat-widget .chat-container {
         position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: none;
        width: 380px;
        height: 600px;
        background: var(--chat--color-background);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(133, 79, 255, 0.15);
        border: 1px solid rgba(133, 79, 255, 0.2);
        overflow: hidden;
        font-family: inherit;
        
        /* Add smooth transitions */
        transition: width 0.3s ease-in-out, height 0.3s ease-in-out, transform 0.3s ease-in-out;
    
        }
    
        .n8n-chat-widget .chat-container.expanded {
       width: 600px;  /* More modest width increase */
        height: 90vh;  /* Significant vertical expansion - 90% of viewport height */
        max-height: 900px; /* Maximum height cap for very large screens */
        transform: translateY(-5vh); /* Slight upward shift to center better vertically */
        box-shadow: 0 12px 48px rgba(133, 79, 255, 0.25); /* Enhanced shadow */
            
        }
    .n8n-chat-widget .chat-container.expanded .chat-messages {
        flex: 1;
        max-height: calc(90vh - 140px); /* Account for header and input area */
    }
        .n8n-chat-widget .chat-container.position-left {
            right: auto;
            left: 20px;
        }
    
        .n8n-chat-widget .chat-container.open {
            display: flex;
        flex-direction: column;
        animation: chatEntrance 0.3s ease-out forwards;
        }
    
        .n8n-chat-widget .brand-header {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(133, 79, 255, 0.1);
            position: relative;
            z-index: 200;
        }
    
        .n8n-chat-widget .header-actions {
            display: flex;
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            gap: 16px;
        }
    
        .n8n-chat-widget .header-button {
            background: none;
            border: none;
            color: var(--chat--color-font);
            cursor: pointer;
            padding: 4px 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            font-size: 20px;
            opacity: 1; /* Full visibility */
            border-radius: 4px;
        }
    
    
        .n8n-chat-widget .header-button:hover {
            background-color: rgba(133, 79, 255, 0.2); /* Add background color on hover */
            opacity: 1;
        }
    @keyframes chatEntrance {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
        .n8n-chat-widget .menu-button {
            position: relative;
            font-size: 18px;
            font-weight: normal; /* Remove bold */
        }
    
        .n8n-chat-widget .menu-dropdown {
            position: absolute;
            right: 0;
            top: 100%;
            background-color: #16131c; /* Use the exact background color instead of variable */
            border-radius: 8px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5); /* Deeper shadow */
            z-index: 100;
            display: none;
            width: 200px;
            margin-top: 8px;
            padding: 6px 0;
            border: 1px solid rgba(133, 79, 255, 0.3);
            /* Ensure complete opacity */
            opacity: 1;
        }
    
        .n8n-chat-widget .menu-dropdown.show {
            display: block;
            background-color: #16131c;
            z-index: 200;
        }
    
       .n8n-chat-widget .menu-item {
            padding: 12px 16px;
            cursor: pointer;
            color: var(--chat--color-font);
            transition: background 0.2s;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: #16131c; /* Same as menu background */
            position: relative;
            z-index: 2;
        }
      .n8n-chat-widget .menu-divider {
            height: 1px;
            background-color: rgba(133, 79, 255, 0.3);
            margin: 6px 0;
        }
    
         .n8n-chat-widget .menu-item:hover {
            background-color: #221d2d; /* Slightly lighter than background */
        }
    
        .n8n-chat-widget .close-button {
            position: relative;
            background: none;
            border: none;
            color: var(--chat--color-font);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
            font-size: 20px;
            opacity: 0.6;
        }
    
        .n8n-chat-widget .close-button:hover {
            opacity: 1;
        }
    
        .n8n-chat-widget .brand-header img {
            width: 32px;
            height: 32px;
        }
    
        .n8n-chat-widget .brand-header span {
            font-size: 18px;
            font-weight: 500;
            color: var(--chat--color-font);
        }
    
        .n8n-chat-widget .new-conversation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            text-align: center;
            width: 100%;
            max-width: 300px;
        }
    
        .n8n-chat-widget .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: var(--chat--color-font);
            margin-bottom: 24px;
            line-height: 1.3;
        }
    
        .n8n-chat-widget .new-chat-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.3s;
            font-weight: 500;
            font-family: inherit;
            margin-bottom: 12px;
        }
    
        .n8n-chat-widget .new-chat-btn:hover {
            transform: scale(1.02);
        }
    
        .n8n-chat-widget .message-icon {
            width: 20px;
            height: 20px;
        }
    
        .n8n-chat-widget .response-text {
            font-size: 14px;
            color: var(--chat--color-font);
            opacity: 0.7;
            margin: 0;
        }
    
        .n8n-chat-widget .chat-interface {
            display: none;
            flex-direction: column;
            height: calc(100% - 60px); /* Adjust height to account for header */
        }
    
        .n8n-chat-widget .chat-interface.active {
            display: flex;
        }
    
        .n8n-chat-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: var(--chat--color-background);
            display: flex;
            flex-direction: column;
        }
    
        .n8n-chat-widget .chat-message {
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.5;
            width: fit-content;
        }
    
        .n8n-chat-widget .chat-message.user {
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            align-self: flex-end;
            box-shadow: 0 4px 12px rgba(133, 79, 255, 0.2);
            border: none;
        }
    
        .n8n-chat-widget .chat-message.bot {
            background: var(--chat--color-background);
            border: 1px solid rgba(133, 79, 255, 0.2);
            color: var(--chat--color-font);
            align-self: flex-start;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            width: auto;
            max-width: 80%;
        }
    
        .n8n-chat-widget .chat-message .timestamp {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 4px;
            text-align: right;
            z-index: 1;
        }
    
        .n8n-chat-widget .file-attachment {
            background: rgba(133, 79, 255, 0.2);
            border-radius: 8px;
            padding: 8px 12px;
            margin: 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: white;
        }
    
        .n8n-chat-widget .file-icon {
            width: 20px;
            height: 20px;
            fill: var(--chat--color-primary);
        }
    
        .n8n-chat-widget .file-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: white;
        }
    
        .n8n-chat-widget .file-size {
            font-size: 11px;
            opacity: 0.7;
            color: white;
        }
    
        .n8n-chat-widget .file-remove {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 2px;
            opacity: 0.6;
            font-size: 14px;
        }
    
        .n8n-chat-widget .file-remove:hover {
            opacity: 1;
        }
    
        .n8n-chat-widget .file-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 100px;
            overflow-y: auto;
            padding: 4px 0;
        }
    
        /* File preview styles */
        .n8n-chat-widget .file-preview {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
    
        .n8n-chat-widget .file-preview-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
    
        .n8n-chat-widget .file-preview-thumbnail {
            width: 40px;
            height: 40px;
            border-radius: 4px;
            object-fit: cover;
            background-color: rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
    
        .n8n-chat-widget .file-preview-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    
        .n8n-chat-widget .file-preview-icon {
            width: 24px;
            height: 24px;
        }
    
        .n8n-chat-widget .file-preview-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            font-size: 12px;
        }
    
        .n8n-chat-widget .file-preview-name {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    
        .n8n-chat-widget .file-preview-size {
            opacity: 0.7;
        }
    
        /* Markdown Styling */
        .n8n-chat-widget .bot-markdown h1,
        .n8n-chat-widget .bot-markdown h2,
        .n8n-chat-widget .bot-markdown h3,
        .n8n-chat-widget .bot-markdown h4,
        .n8n-chat-widget .bot-markdown h5,
        .n8n-chat-widget .bot-markdown h6 {
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.25;
        }
    
        .n8n-chat-widget .bot-markdown h1 { font-size: 1.5em; }
        .n8n-chat-widget .bot-markdown h2 { font-size: 1.3em; }
        .n8n-chat-widget .bot-markdown h3 { font-size: 1.1em; }
    
        .n8n-chat-widget .bot-markdown p {
            margin-top: 0;
            margin-bottom: 1em;
        }
    
        .n8n-chat-widget .bot-markdown ul,
        .n8n-chat-widget .bot-markdown ol {
            padding-left: 1.5em;
            margin-bottom: 1em;
        }
    
        .n8n-chat-widget .bot-markdown li {
            margin-bottom: 0.25em;
        }
    
        .n8n-chat-widget .bot-markdown code {
            font-family: monospace;
            background-color: rgba(133, 79, 255, 0.1);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
            white-space: pre-wrap;
        }
    
        .n8n-chat-widget .bot-markdown pre {
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 6px;
            padding: 0.7em 1em;
            overflow-x: auto;
            margin: 1em 0;
            max-width: 100%;
        }
    
        .n8n-chat-widget .bot-markdown pre code {
            background-color: transparent;
            padding: 0;
            white-space: pre;
            color: #f8f8f2;
            font-family: monospace;
            display: block;
        }
    
        .n8n-chat-widget .bot-markdown blockquote {
            padding: 0 1em;
            color: rgba(var(--chat--color-font), 0.8);
            border-left: 4px solid var(--chat--color-primary);
            margin: 0 0 1em;
        }
    
        .n8n-chat-widget .bot-markdown a {
            color: var(--chat--color-primary);
            text-decoration: none;
        }
    
        .n8n-chat-widget .bot-markdown a:hover {
            text-decoration: underline;
        }
    
        .n8n-chat-widget .bot-markdown table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
        }
    
        .n8n-chat-widget .bot-markdown th,
        .n8n-chat-widget .bot-markdown td {
            border: 1px solid rgba(133, 79, 255, 0.2);
            padding: 0.5em;
        }
    
        .n8n-chat-widget .bot-markdown th {
            background-color: rgba(133, 79, 255, 0.1);
            font-weight: 600;
        }
    
        .n8n-chat-widget .chat-input {
        padding: 16px;
        background: var(--chat--color-background);
        border-top: 1px solid rgba(133, 79, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
        z-index: 5;
    }
    
    
       .n8n-chat-widget .input-area {
        display: flex;
        gap: 8px;
        align-items: flex-start; /* Align to top instead of center */
        position: relative;
    }
    
       .n8n-chat-widget .chat-input textarea {
        flex: 1;
        padding: 12px;
        border: 1px solid rgba(133, 79, 255, 0.2);
        border-radius: 8px;
        background: var(--chat--color-background);
        color: var(--chat--color-font);
        resize: none;
        font-family: inherit;
        font-size: 14px;
        min-height: 20px; /* Start with minimum height */
        max-height: 120px; /* Set maximum height before scrolling */
        height: auto; /* Allow height to adjust naturally */
        overflow-y: auto; /* Enable vertical scrolling when needed */
        line-height: 1.4; /* Improve text spacing */
        transition: height 0.1s ease; /* Smooth transition for height changes */
    }
    
        .n8n-chat-widget .chat-input textarea::placeholder {
            color: var(--chat--color-font);
            opacity: 0.6;
        }
    
        .n8n-chat-widget .attachment-button {
            background: none;
        border: none;
        color: var(--chat--color-font);
        opacity: 0.7;
        cursor: pointer;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
        align-self: flex-start;
        margin-top: 6px;
        }
    
        .n8n-chat-widget .attachment-button:hover {
            background: rgba(133, 79, 255, 0.1);
            opacity: 1;
        }
    
        .n8n-chat-widget .attachment-button svg {
            width: 20px;
            height: 20px;
        }
    
        .n8n-chat-widget .file-input {
            display: none;
        }
    
        .n8n-chat-widget .chat-input button.send-button {
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0 20px;
        cursor: pointer;
        transition: transform 0.2s;
        font-family: inherit;
        font-weight: 500;
        height: 36px;
        align-self: flex-start;
        margin-top: 6px;
        }
    
        .n8n-chat-widget .chat-input button.send-button:hover {
            transform: scale(1.05);
        }
    
        .n8n-chat-widget .chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: linear-gradient(135deg, var(--chat--color-primary) 0%, var(--chat--color-secondary) 100%);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(133, 79, 255, 0.3);
            z-index: 999;
            transition: transform 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    
        .n8n-chat-widget .chat-toggle.position-left {
            right: auto;
            left: 20px;
        }
    
        .n8n-chat-widget .chat-toggle:hover {
            transform: scale(1.05);
        }
    
        .n8n-chat-widget .chat-toggle svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
    
        .n8n-chat-widget .chat-footer {
            padding: 8px;
            text-align: center;
            background: var(--chat--color-background);
            border-top: 1px solid rgba(133, 79, 255, 0.1);
        }
    
        .n8n-chat-widget .chat-footer a {
            color: var(--chat--color-primary);
            text-decoration: none;
            font-size: 12px;
            opacity: 0.8;
            transition: opacity 0.2s;
            font-family: inherit;
        }
    
        .n8n-chat-widget .chat-footer a:hover {
            opacity: 1;
        }
    
        .n8n-chat-widget .conversations-view {
            display: none;
            flex-direction: column;
            height: calc(100% - 60px);
            background: var(--chat--color-background);
            overflow-y: auto;
            {
        transition: height 0.3s ease-in-out, max-height 0.3s ease-in-out;}
        }
        
        .n8n-chat-widget .conversations-view.active {
            display: flex;
        }
        
        .n8n-chat-widget .conversations-header {
            padding: 16px;
            border-bottom: 1px solid rgba(133, 79, 255, 0.1);
            font-weight: 500;
            font-size: 16px;
            color: var(--chat--color-font);
        }
        
        .n8n-chat-widget .conversation-list {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }
        
        .n8n-chat-widget .conversation-item {
            display: flex;
            padding: 12px 16px;
            border-bottom: 1px solid rgba(133, 79, 255, 0.1);
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .n8n-chat-widget .conversation-item:hover {
            background: rgba(133, 79, 255, 0.05);
        }
        
        .n8n-chat-widget .conversation-item.active {
            background: rgba(133, 79, 255, 0.1);
        }
        
        .n8n-chat-widget .conversation-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .n8n-chat-widget .conversation-title {
            font-weight: 500;
            color: var(--chat--color-font);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .n8n-chat-widget .conversation-preview {
            font-size: 13px;
            color: var(--chat--color-font);
            opacity: 0.7;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .n8n-chat-widget .conversation-date {
            font-size: 12px;
            color: var(--chat--color-font);
            opacity: 0.7;
            margin-left: 12px;
            white-space: nowrap;
        }
        
        .n8n-chat-widget .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: var(--chat--color-font);
            opacity: 0.7;
            text-align: center;
        }
        
        .n8n-chat-widget .empty-state svg {
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .n8n-chat-widget .loading-indicator {
            display: none;
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 12px;
            max-width: 80%;
            align-self: flex-start;
            background: var(--chat--color-background);
            border: 1px solid rgba(133, 79, 255, 0.2);
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

/**
 * Create the chat widget DOM structure
 */
function createWidgetDOM() {
    console.log("Creating chat widget DOM");
    
    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    widgetContainer.id = 'n8n-chat-widget';
    
    // Set CSS variables for colors
    widgetContainer.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--n8n-chat-font-color', config.style.fontColor);
    
    // Single unified HTML structure with a common header
    const chatWidgetHTML = `
        <div class="brand-header">
            <img src="${config.branding.logo || ''}" alt="${config.branding.name || 'Chat'}">
            <span>${config.branding.name || 'Chat'}</span>
            <div class="header-actions">
                <button class="header-button menu-button" title="Menu">
                    &bull;&bull;&bull;
                    <div class="menu-dropdown">
                        <div class="menu-item new-conversation-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            New conversation
                        </div>
                        <div class="menu-item view-conversations-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                            View conversations
                        </div>
                        <div class="menu-divider"></div>
                        <div class="menu-item download-transcript">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download transcript
                        </div>
                    </div>
                </button>
                <button class="header-button expand-button" title="Expand">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6"></path>
                        <path d="M9 21H3v-6"></path>
                        <path d="M21 3l-7 7"></path>
                        <path d="M3 21l7-7"></path>
                    </svg>
                </button>
                <button class="close-button" title="Close">&times;</button>
            </div>
        </div>
        
        <div class="new-conversation">
            <h2 class="welcome-text">${config.branding.welcomeText || 'Welcome! How can we help you today?'}</h2>
            <button class="new-chat-btn">
                <svg class="message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
                </svg>
                Send us a message
            </button>
            <p class="response-text">${config.branding.responseTimeText || 'We typically reply within a few minutes.'}</p>
        </div>
        
        <div class="chat-interface">
            <div class="chat-messages"></div>
            <div class="chat-input">
                <div class="file-list"></div>
                <div class="input-area">
                    <textarea placeholder="Type your message here..." rows="1"></textarea>
                    <button class="attachment-button" title="Attach file">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                        </svg>
                    </button>
                    <input type="file" class="file-input" multiple>
                    <button type="submit" class="send-button">Send</button>
                </div>
            </div>
            <div class="chat-footer">
                <a href="${config.branding.poweredBy?.link || '#'}" target="_blank">${config.branding.poweredBy?.text || 'Powered by Chat'}</a>
            </div>
        </div>
    `;
    
    // Add conversations view to the chat container
    const conversationsViewHTML = `
        <div class="conversations-view">
            <div class="conversations-header">Recent conversations</div>
            <div class="conversation-list">
                <!-- Conversation items will be added here dynamically -->
            </div>
        </div>
    `;
    
    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;
    chatContainer.innerHTML = chatWidgetHTML + conversationsViewHTML;
    
    const toggleButton = document.createElement('button');
    toggleButton.className = `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`;
    toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
        </svg>`;
    
    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);
    
    console.log("Chat widget DOM created");
    
    // Initialize DOM element references
    if (!initDOMReferences()) {
        console.error("Failed to initialize DOM references");
    }
}

/**
 * Initialize DOM element references
 */
function initDOMReferences() {
    console.log("Initializing DOM references");
    
    // Get DOM elements from the widget container
    const widgetContainer = document.querySelector('.n8n-chat-widget');
    if (!widgetContainer) {
        console.error("Widget container not found");
        return false;
    }
    
    // Get chat container
    chatContainer = widgetContainer.querySelector('.chat-container');
    if (!chatContainer) {
        console.error("Chat container not found");
        return false;
    }
    
    // Get toggle button
    toggleButton = widgetContainer.querySelector('.chat-toggle');
    if (!toggleButton) {
        console.error("Toggle button not found");
        return false;
    }
    
    // Get other elements
    newChatBtn = chatContainer.querySelector('.new-chat-btn');
    chatInterface = chatContainer.querySelector('.chat-interface');
    messagesContainer = chatContainer.querySelector('.chat-messages');
    textarea = chatContainer.querySelector('textarea');
    sendButton = chatContainer.querySelector('button.send-button');
    attachmentButton = chatContainer.querySelector('.attachment-button');
    fileInput = chatContainer.querySelector('.file-input');
    fileList = chatContainer.querySelector('.file-list');
    menuButtons = chatContainer.querySelectorAll('.menu-button');
    expandButtons = chatContainer.querySelectorAll('.expand-button');
    downloadButtons = chatContainer.querySelectorAll('.download-transcript');
    viewConversationsButtons = chatContainer.querySelectorAll('.view-conversations-btn');
    newConversationButtons = chatContainer.querySelectorAll('.new-conversation-btn');
    
    console.log("DOM references initialized successfully");
    return true;
}

/**
 * Set up UI event handlers
 */
function setupChatUI() {
    console.log("Setting up chat UI event handlers");
    
    // Check if required elements exist
    if (!chatContainer || !toggleButton || !newChatBtn || !chatInterface || 
        !messagesContainer || !textarea || !sendButton || !attachmentButton || 
        !fileInput || !fileList) {
        console.error("Required DOM elements not found");
        return;
    }
    
    // Main action buttons
    newChatBtn.addEventListener('click', startNewConversation);
    
    sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message || attachedFiles.length > 0) {
            sendMessage(message);
            textarea.value = '';
        }
    });
    
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = textarea.value.trim();
            if (message || attachedFiles.length > 0) {
                sendMessage(message);
                textarea.value = '';
            }
        }
    });
    
    // File attachment handling
    attachmentButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            Array.from(e.target.files).forEach(file => {
                // You can add file type and size validation here
                // For example, limit to 10MB
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                    return;
                }
                addFileToList(file);
            });
            // Reset the input so the same file can be selected again
            fileInput.value = '';
        }
    });
    
    // Handle file removal
    fileList.addEventListener('click', (e) => {
        if (e.target.classList.contains('file-remove')) {
            const fileId = e.target.dataset.fileId;
            removeFile(fileId);
        }
    });
    
    // Toggle chat open/close - IMPORTANT!
    toggleButton.addEventListener('click', () => {
        console.log("Toggle button clicked");
        chatContainer.classList.toggle('open');
    });
    
    // Menu button handlers
    if (menuButtons && menuButtons.length) {
        menuButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMenu(button);
            });
        });
    }
    
    // Download transcript handlers
    if (downloadButtons && downloadButtons.length) {
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadTranscript();
                // Close the menu
                const dropdown = button.closest('.menu-dropdown');
                if (dropdown) dropdown.classList.remove('show');
            });
        });
    }
    
    // Expand button handlers
    if (expandButtons && expandButtons.length) {
        expandButtons.forEach(button => {
            button.addEventListener('click', () => {
                chatContainer.classList.toggle('expanded');
                // Toggle button icon between expand and collapse
                if (chatContainer.classList.contains('expanded')) {
                    button.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 14h6v6"></path>
                            <path d="M20 10h-6V4"></path>
                            <path d="M14 10l7-7"></path>
                            <path d="M3 21l7-7"></path>
                        </svg>
                    `;
                    button.title = "Collapse";
                } else {
                    button.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h6v6"></path>
                            <path d="M9 21H3v-6"></path>
                            <path d="M21 3l-7 7"></path>
                            <path d="M3 21l7-7"></path>
                        </svg>
                    `;
                    button.title = "Expand";
                }
            });
        });
    }
    
    // Event handlers for conversation management
    if (viewConversationsButtons && viewConversationsButtons.length) {
        viewConversationsButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                showConversationsView();
                // Close the menu
                document.querySelectorAll('.menu-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            });
        });
    }
    
    if (newConversationButtons && newConversationButtons.length) {
        newConversationButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                
                // Clear messages container
                messagesContainer.innerHTML = '';
                
                // Start new conversation
                startNewConversation();
                
                // Close the menu
                document.querySelectorAll('.menu-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            });
        });
    }
    
    // Add close button handlers
    const closeButtons = chatContainer.querySelectorAll('.close-button');
    if (closeButtons && closeButtons.length) {
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                chatContainer.classList.remove('open');
            });
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.menu-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });
    
    // Close dropdown when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.menu-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
    
    console.log("Chat UI event handlers set up successfully");
}

/**
 * Load conversations from localStorage
 * @returns {boolean} Whether any conversations were loaded
 */
function loadConversations() {
    const savedConversations = localStorage.getItem('n8n_chat_conversations');
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
        return true;
    }
    return false;
}

/**
 * Save conversations to localStorage
 */
function saveConversations() {
    localStorage.setItem('n8n_chat_conversations', JSON.stringify(conversations));
}

/**
 * Toggle the menu dropdown
 * @param {HTMLElement} menuButton The menu button element
 */
function toggleMenu(menuButton) {
    const dropdown = menuButton.querySelector('.menu-dropdown');
    dropdown.classList.toggle('show');
}

/**
 * Generate a UUID for unique identifiers
 * @returns {string} A UUID string
 */
function generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

/**
 * Format file size for display
 * @param {number} bytes File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Format date and time
 * @param {Date} date Date object
 * @returns {string} Formatted time string
 */
function formatDateTime(date) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
}

/**
 * Get current date with timezone
 * @returns {string} Formatted date string with timezone
 */
function getCurrentDateWithTimezone() {
    const now = new Date();
    const options = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    };
    return now.toLocaleString('en-US', options);
}

/**
 * Format date for conversation list
 * @param {Date} date Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const day = 24 * 60 * 60 * 1000;
    
    if (diff < day) {
        return formatDateTime(date);
    } else if (diff < 2 * day) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

/**
 * Get file type icon based on file extension
 * @param {string} filename Filename with extension
 * @returns {string} SVG icon markup
 */
function getFileTypeIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    // Define file type categories
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'];
    const codeTypes = ['js', 'html', 'css', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'swift'];
    const archiveTypes = ['zip', 'rar', 'tar', 'gz', '7z'];
    
    let iconPath;
    
    if (imageTypes.includes(extension)) {
        iconPath = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>`;
    } else if (documentTypes.includes(extension)) {
        iconPath = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>`;
    } else if (codeTypes.includes(extension)) {
        iconPath = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
        </svg>`;
    } else if (archiveTypes.includes(extension)) {
        iconPath = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>`;
    } else {
        // Generic file icon
        iconPath = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
        </svg>`;
    }
    
    return iconPath;
}

/**
 * Create a thumbnail for image preview
 * @param {File} file The file object
 * @param {Function} callback Callback function with thumbnail URL
 */
function createThumbnail(file, callback) {
    const extension = file.name.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    // Check if file is an image type that can be previewed
    if (imageTypes.includes(extension)) {
        const reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        // Not an image, use icon instead
        callback(null);
    }
}

/**
 * Add a file to the attachment list
 * @param {File} file The file object
 */
function addFileToList(file) {
    const fileId = generateUUID();
    
    attachedFiles.push({
        id: fileId,
        file: file
    });
    
    const fileElement = document.createElement('div');
    fileElement.className = 'file-attachment';
    fileElement.dataset.fileId = fileId;
    fileElement.innerHTML = `
        <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        <span class="file-name">${file.name}</span>
        <span class="file-size">(${formatFileSize(file.size)})</span>
        <button class="file-remove" data-file-id="${fileId}">×</button>
    `;
    
    fileList.appendChild(fileElement);
    fileList.style.display = attachedFiles.length ? 'flex' : 'none';
}

/**
 * Remove a file from the attachment list
 * @param {string} fileId The file ID to remove
 */
function removeFile(fileId) {
    attachedFiles = attachedFiles.filter(file => file.id !== fileId);
    const fileElement = fileList.querySelector(`[data-file-id="${fileId}"]`);
    if (fileElement) {
        fileElement.remove();
    }
    fileList.style.display = attachedFiles.length ? 'flex' : 'none';
}

/**
 * Create a file preview element
 * @param {File} file The file object
 * @returns {Promise<HTMLElement>} Promise resolving to the preview element
 */
function createFilePreviewElement(file) {
    return new Promise((resolve) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
        
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'file-preview-thumbnail';
        
        createThumbnail(file, (thumbnailUrl) => {
            if (thumbnailUrl) {
                // Image preview
                thumbnailContainer.innerHTML = `<img src="${thumbnailUrl}" alt="${file.name}" />`;
            } else {
                // Icon based on file type
                thumbnailContainer.innerHTML = getFileTypeIcon(file.name);
            }
            
            previewItem.appendChild(thumbnailContainer);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-preview-info';
            fileInfo.innerHTML = `
                <span class="file-preview-name">${file.name}</span>
                <span class="file-preview-size">${formatFileSize(file.size)}</span>
            `;
            
            previewItem.appendChild(fileInfo);
            resolve(previewItem);
        });
    });
}

/**
 * Render markdown content
 * @param {string} text The markdown text
 * @returns {string} HTML content
 */
function renderMarkdown(text) {
    if (typeof marked === 'undefined') {
        console.warn('Marked.js not loaded yet, using plaintext');
        return text;
    }

    // Configure marked options
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, {language: lang}).value;
                } catch (err) {
                    console.error('Error highlighting code:', err);
                }
            }
            return code;
        },
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartypants: false,
        xhtml: false
    });

    try {
        return marked.parse(text);
    } catch (e) {
        console.error('Error parsing markdown:', e);
        return text;
    }
}

/**
 * Save chat state to localStorage
 */
function saveChatState() {
    if (currentSessionId && chatMessages.length > 0) {
        // Find or create conversation in the list
        let existingConversationIndex = conversations.findIndex(c => c.sessionId === currentSessionId);
        
        const preview = chatMessages.length > 0 
            ? chatMessages[chatMessages.length - 1].message.substring(0, 50) + (chatMessages[chatMessages.length - 1].message.length > 50 ? '...' : '')
            : 'New conversation';
            
        if (existingConversationIndex >= 0) {
            // Update existing conversation
            conversations[existingConversationIndex] = {
                ...conversations[existingConversationIndex],
                messages: chatMessages,
                lastUpdated: new Date().toISOString(),
                preview: preview
            };
        } else {
            // Create new conversation
            conversations.unshift({
                sessionId: currentSessionId,
                title: `Conversation ${conversations.length + 1}`,
                messages: chatMessages,
                lastUpdated: new Date().toISOString(),
                preview: preview
            });
        }
        
        // Save to localStorage
        saveConversations();
    }
}

/**
 * Generate and download transcript
 */
function downloadTranscript() {
    // Create a transcript
    const startDate = new Date();
    let transcript = `Conversation with ${config.branding.name}\n`;
    transcript += `Started on ${getCurrentDateWithTimezone()}\n`;
    transcript += `---\n`;
    
    chatMessages.forEach(msg => {
        transcript += `${msg.timestamp} | ${msg.sender}: ${msg.message}\n`;
        if (msg.files && msg.files.length > 0) {
            transcript += `  Attached files: ${msg.files.join(', ')}\n`;
        }
    });
    
    transcript += `---\n`;
    transcript += `Exported from ${config.branding.name} on ${getCurrentDateWithTimezone()}`;
    
    // Create and download the file
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.branding.name.replace(/\s+/g, '-')}-conversation-${startDate.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Render the conversation list
 */
function renderConversationList() {
    const conversationList = chatContainer.querySelector('.conversation-list');
    conversationList.innerHTML = '';
    
    if (conversations.length === 0) {
        conversationList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>No conversations yet</p>
                <button class="new-chat-btn">Start a new conversation</button>
            </div>
        `;
        
        const newChatBtn = conversationList.querySelector('.new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', startNewConversation);
        }
        
        return;
    }
    
    conversations.forEach((conversation, index) => {
        const date = new Date(conversation.lastUpdated);
        const formattedDate = formatDate(date);
        
        const conversationItem = document.createElement('div');
        conversationItem.className = `conversation-item${index === activeConversationIndex ? ' active' : ''}`;
        conversationItem.dataset.index = index;
        
        conversationItem.innerHTML = `
            <div class="conversation-content">
                <div class="conversation-title">${conversation.title}</div>
                <div class="conversation-preview">${conversation.preview}</div>
            </div>
            <div class="conversation-date">${formattedDate}</div>
        `;
        
        conversationItem.addEventListener('click', () => {
            loadConversation(index);
        });
        
        conversationList.appendChild(conversationItem);
    });
}

/**
 * Show conversations view
 */
function showConversationsView() {
    chatInterface.classList.remove('active');
    chatContainer.querySelector('.new-conversation').style.display = 'none';
    chatContainer.querySelector('.conversations-view').classList.add('active');
    
    renderConversationList();
}

/**
 * Load and display a specific conversation
 * @param {number} index The index of the conversation to load
 */
function loadConversation(index) {
    if (index >= 0 && index < conversations.length) {
        activeConversationIndex = index;
        const conversation = conversations[index];
        
        // Load the conversation
        currentSessionId = conversation.sessionId;
        chatMessages = [...conversation.messages];
        
        // Switch to chat interface
        chatContainer.querySelector('.conversations-view').classList.remove('active');
        chatContainer.querySelector('.new-conversation').style.display = 'none';
        chatInterface.classList.add('active');
        
        // Clear current messages and render saved ones
        messagesContainer.innerHTML = '';
        
        // Function to render messages with file previews
        async function renderMessages() {
            for (const msg of chatMessages) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `chat-message ${msg.sender === 'Visitor' ? 'user' : 'bot'}`;
                
                if (msg.sender === 'Visitor') {
                    // User message
                    messageDiv.textContent = msg.message;
                    
                    // If there are files, add file previews
                    if (msg.files && msg.files.length > 0) {
                        const filePreviewDiv = document.createElement('div');
                        filePreviewDiv.className = 'file-preview';
                        
                        // Display file info instead of actual files since we don't have the actual files in history
                        for (const fileName of msg.files) {
                            const filePreviewItem = document.createElement('div');
                            filePreviewItem.className = 'file-preview-item';
                            
                            const thumbnailContainer = document.createElement('div');
                            thumbnailContainer.className = 'file-preview-thumbnail';
                            thumbnailContainer.innerHTML = getFileTypeIcon(fileName);
                            
                            const fileInfo = document.createElement('div');
                            fileInfo.className = 'file-preview-info';
                            fileInfo.innerHTML = `<span class="file-preview-name">${fileName}</span>`;
                            
                            filePreviewItem.appendChild(thumbnailContainer);
                            filePreviewItem.appendChild(fileInfo);
                            filePreviewDiv.appendChild(filePreviewItem);
                        }
                        
                        messageDiv.appendChild(filePreviewDiv);
                    }
                } else {
                    // Bot message with markdown support
                    const markdownDiv = document.createElement('div');
                    markdownDiv.className = 'bot-markdown';
                    markdownDiv.innerHTML = renderMarkdown(msg.message);
                    messageDiv.appendChild(markdownDiv);
                }
                
                // Add timestamp
                const timestamp = document.createElement('div');
                timestamp.className = 'timestamp';
                timestamp.textContent = msg.timestamp;
                messageDiv.appendChild(timestamp);
                
                messagesContainer.appendChild(messageDiv);
            }
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Apply syntax highlighting
            if (typeof hljs !== 'undefined') {
                messagesContainer.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        }
        
        renderMessages();
    }
}

/**
 * Start a new conversation
 */
async function startNewConversation() {
    // Create a new session ID and clear message history
    currentSessionId = generateUUID();
    chatMessages = [];
    activeConversationIndex = -1;
    
    // Hide conversation view if open
    chatContainer.querySelector('.conversations-view').classList.remove('active');
    
    const data = [{
        action: "loadPreviousSession",
        sessionId: currentSessionId,
        route: config.webhook.route,
        metadata: {
            userId: ""
        }
    }];

    try {
        const response = await fetch(config.webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        
        // Show header, hide welcome screen, show chat interface
        chatContainer.querySelector('.new-conversation').style.display = 'none';
        chatInterface.classList.add('active');

        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'chat-message bot';
        
        const markdownDiv = document.createElement('div');
        markdownDiv.className = 'bot-markdown';
        
        const botResponse = Array.isArray(responseData) ? responseData[0].output : responseData.output;
        markdownDiv.innerHTML = renderMarkdown(botResponse);
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = formatDateTime(new Date());
        
        botMessageDiv.appendChild(markdownDiv);
        botMessageDiv.appendChild(timestamp);
        messagesContainer.appendChild(botMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to transcript
        chatMessages.push({
            timestamp: formatDateTime(new Date()),
            sender: config.branding.name,
            message: botResponse
        });
        
        // Save updated chat state to localStorage
        saveChatState();
        
        // Apply syntax highlighting to code blocks if hljs is loaded
        if (typeof hljs !== 'undefined') {
            botMessageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Send a message to the server
 * @param {string} message The message text
 */
async function sendMessage(message) {
    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add message data
    const messageData = {
        action: "sendMessage",
        sessionId: currentSessionId,
        route: config.webhook.route,
        chatInput: message,
        metadata: {
            userId: ""
        }
    };
    
    // First, add the JSON message data to the FormData
    formData.append('data', JSON.stringify(messageData));
    
    // Keep track of file names for chat history
    const fileNames = [];
    
    // Add files individually to the FormData with the 'files' key for each one
    attachedFiles.forEach((fileObj, index) => {
        // Explicitly use the same field name 'files' for all files
        formData.append('files', fileObj.file);
        fileNames.push(fileObj.file.name);
    });

    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user';
    userMessageDiv.textContent = message;
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatDateTime(new Date());
    userMessageDiv.appendChild(timestamp);
    
    // Save to transcript
    const messageRecord = {
        timestamp: formatDateTime(new Date()),
        sender: "Visitor",
        message: message
    };
    
    // If there are attached files, add file previews and save to message record
    if (attachedFiles.length > 0) {
        messageRecord.files = fileNames;
        
        const filePreviewDiv = document.createElement('div');
        filePreviewDiv.className = 'file-preview';
        
        // Create file preview elements for each attached file
        const previewPromises = attachedFiles.map(fileObj => createFilePreviewElement(fileObj.file));
        
        Promise.all(previewPromises).then(previewElements => {
            // Add all preview elements to the file preview div
            previewElements.forEach(previewElement => {
                filePreviewDiv.appendChild(previewElement);
            });
            
            // Add the file preview div to the user message
            userMessageDiv.appendChild(filePreviewDiv);
            
            // Make sure messages container scrolls to show the latest message
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }
    
    // Add the user message to the chat
    messagesContainer.appendChild(userMessageDiv);
    
    // Add message to chat history
    chatMessages.push(messageRecord);
    
    // Save chat state with new message
    saveChatState();
    
    // Scroll to bottom to show latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Keep a copy of files to send
    const filesToSend = [...attachedFiles];
    
    // Clear attached files after sending
    attachedFiles = [];
    fileList.innerHTML = '';
    fileList.style.display = 'none';

    // Show loading indicator after user message is sent
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    
    const loader = document.createElement('div');
    loader.className = 'loader';
    
    loadingIndicator.appendChild(loader);
    messagesContainer.appendChild(loadingIndicator);
    loadingIndicator.style.display = 'flex';
    
    // Scroll to show the loading indicator
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        let response;
        
        // Use FormData with multipart/form-data when files are attached
        if (filesToSend.length > 0) {
            // Log the FormData contents for debugging (optional)
            console.log(`Sending message with ${filesToSend.length} attached files`);
            
            response = await fetch(config.webhook.url, {
                method: 'POST',
                body: formData
            });
        } else {
            // If no files, use regular JSON
            response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
        }
        
        const data = await response.json();
        
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'chat-message bot';
        
        const markdownDiv = document.createElement('div');
        markdownDiv.className = 'bot-markdown';
        
        const botResponse = Array.isArray(data) ? data[0].output : data.output;
        markdownDiv.innerHTML = renderMarkdown(botResponse);
        
        // Add timestamp
        const timestampBot = document.createElement('div');
        timestampBot.className = 'timestamp';
        timestampBot.textContent = formatDateTime(new Date());
        
        botMessageDiv.appendChild(markdownDiv);
        botMessageDiv.appendChild(timestampBot);
        messagesContainer.appendChild(botMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to transcript
        chatMessages.push({
            timestamp: formatDateTime(new Date()),
            sender: config.branding.name,
            message: botResponse
        });
        
        // Save updated chat state to localStorage
        saveChatState();
        
        // Apply syntax highlighting to code blocks if hljs is loaded
        if (typeof hljs !== 'undefined') {
            botMessageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    } catch (error) {
        console.error('Error:', error);
        
        // Hide loading indicator even if there's an error
        loadingIndicator.style.display = 'none';
        
        // Show error message
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'chat-message bot';
        errorMessageDiv.textContent = 'Sorry, there was an error sending your message. Please try again.';
        
        // Add timestamp
        const timestampError = document.createElement('div');
        timestampError.className = 'timestamp';
        timestampError.textContent = formatDateTime(new Date());
        
        errorMessageDiv.appendChild(timestampError);
        messagesContainer.appendChild(errorMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to transcript
        chatMessages.push({
            timestamp: formatDateTime(new Date()),
            sender: config.branding.name,
            message: 'Sorry, there was an error sending your message. Please try again.'
        });
    }
}