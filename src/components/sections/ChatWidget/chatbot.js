/**
 * n8n Chat Widget
 * A customizable chat widget that can be embedded in any Astro website
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
    
    // Enhance mobile experience
    enhanceMobileExperience();
    
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
            url: 'https://n8n.innovaquest.solutions/webhook/bd6697b2-4dc2-4943-a4d4-f3bc38d15092',
            route: 'general'
        },
        branding: {
            logo: 'https://play-lh.googleusercontent.com/h61OpMEtKOlyfeGsub4-rSDxsNdFtBLVtBpHSVdO-dma43qBVTuj2bsWkUcDuItc',
            name: 'InnovaQuest',
            welcomeText: 'Hi 👋, how can we help?',
            responseTimeText: 'Find out how we can help you',
            poweredBy: {
                text: 'Powered by InnovaQuest',
                link: 'https://innovaquest.ai'
            }
        },
        style: {
            primaryColor: '#854fff',
            secondaryColor: '#6b3fd4',
            position: 'right',
            backgroundColor: '#16131c',
            fontColor: '#ffffff'
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
    // Load Rajdhani font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;700&display=swap';
    document.head.appendChild(fontLink);
    
    // Load Marked.js for Markdown parsing
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js';
    markedScript.onload = function() {
        console.log('Marked.js loaded successfully');
    };
    document.head.appendChild(markedScript);
    
    // Highlight.js for code syntax highlighting
    const highlightCssLink = document.createElement('link');
    highlightCssLink.rel = 'stylesheet';
    highlightCssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css';
    document.head.appendChild(highlightCssLink);
    
    const highlightJsScript = document.createElement('script');
    highlightJsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
    highlightJsScript.onload = function() {
        console.log('Highlight.js loaded successfully');
    };
    document.head.appendChild(highlightJsScript);
}

/**
 * Inject CSS styles for the chat widget
 */
function injectStyles() {
    const styles = `
        .n8n-chat-widget {
            --chat-primary: ${config.style.primaryColor};
            --chat-secondary: ${config.style.secondaryColor};
            --chat-bg: ${config.style.backgroundColor};
            --chat-text: ${config.style.fontColor};
            --chat-shadow: rgba(0, 0, 0, 0.2);
            --chat-border: rgba(133, 79, 255, 0.2);
            font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: var(--chat-text);
            line-height: 1.5;
            font-size: 14px;
        }

        /* Chat toggle button */
        .n8n-chat-widget .chat-toggle {
            position: fixed;
            bottom: 20px;
            ${config.style.position}: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-secondary) 100%);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(133, 79, 255, 0.3);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
            color: white;
        }

        /* Persistent glowing effect for toggle button */
        .n8n-chat-widget .chat-toggle {
            box-shadow: 0 0 0 rgba(178, 197, 253, 0.3); 
            animation: pulse 4s infinite;
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(133, 79, 255, 0.6); /* Increased opacity */
            }
            70% {
                box-shadow: 0 0 0 20px rgba(133, 79, 255, 0); /* Increased spread from 10px to 20px */
            }
            100% {
                box-shadow: 0 0 0 0 rgba(133, 79, 255, 0);
            }
        }

        /* Hide toggle button when chat is open */
        .n8n-chat-widget.chat-open .chat-toggle {
            opacity: 0;
            visibility: hidden;
        }

        .n8n-chat-widget .chat-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 24px rgba(133, 79, 255, 0.4);
        }

        .n8n-chat-widget .chat-toggle svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }

        /* Main chat container */
        .n8n-chat-widget .chat-container {
            position: fixed;
            bottom: 20px;
            ${config.style.position}: 20px;
            width: 380px;
            height: 600px;
            max-height: 600px;
            background: var(--chat-bg);
            border-radius: 12px;
            box-shadow: 0 10px 40px var(--chat-shadow);
            border: 1px solid var(--chat-border);
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 999998;
            transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .n8n-chat-widget .chat-container.open {
            display: flex;
            animation: chat-fade-in 0.3s ease forwards;
            box-shadow: 0 5px 15px rgba(178, 197, 253, 0.3);
        }

        .n8n-chat-widget .chat-container.expanded {
            width: 700px;
            height: 900px;
            max-height: 85vh;
            box-shadow: 0 5px 15px rgba(178, 197, 253, 0.3);
        }

        @keyframes chat-fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .n8n-chat-widget .chat-header {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid var(--chat-border);
            z-index: 10;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-header-logo {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin-right: 12px;
        }

        .n8n-chat-widget .chat-header-title {
            flex: 1;
            font-size: 18px;
            font-weight: 500;
        }

        .n8n-chat-widget .chat-header-actions {
            display: flex;
            gap: 10px;
        }

        .n8n-chat-widget .chat-header-button {
            background: none;
            border: none;
            color: var(--chat-text);
            opacity: 0.7;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .n8n-chat-widget .chat-header-button:hover {
            opacity: 1;
            background-color: rgba(133, 79, 255, 0.1);
        }

        .n8n-chat-widget .chat-header-button svg {
            width: 18px;
            height: 18px;
            stroke: currentColor;
        }

        /* Menu dropdown */
        .n8n-chat-widget .chat-menu {
            position: relative;
        }

        .n8n-chat-widget .chat-menu-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            width: 220px;
            background: var(--chat-bg);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            border: 1px solid var(--chat-border);
            z-index: 100;
            display: none;
            overflow: hidden;
            margin-top: 8px;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-menu-dropdown.show {
            display: block;
            animation: dropdown-fade-in 0.2s ease forwards;
        }

        /* Make menu toggle 100% visible when menu is open */
        .n8n-chat-widget .chat-menu-toggle.active,
        .n8n-chat-widget .chat-menu-dropdown.show ~ .chat-menu-toggle {
            opacity: 1 !important;
        }

        @keyframes dropdown-fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .n8n-chat-widget .chat-menu-item {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-menu-item:hover {
            background: rgba(133, 79, 255, 0.1);
        }

        .n8n-chat-widget .chat-menu-item svg {
            width: 16px;
            height: 16px;
            stroke: var(--chat-text);
        }

        .n8n-chat-widget .chat-menu-divider {
            height: 1px;
            background: var(--chat-border);
            margin: 6px 0;
        }

        /* Chat views container */
        .n8n-chat-widget .chat-views {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        /* Welcome view */
        .n8n-chat-widget .chat-welcome {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            text-align: center;
            display: none; /* Hide by default, show only when needed */
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-welcome-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 20px;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-welcome-button {
            display: flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-secondary) 100%);
            color: white;
            border: none;
            border-radius: 30px;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 4px 12px rgba(133, 79, 255, 0.2);
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-welcome-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(133, 79, 255, 0.3);
        }

        .n8n-chat-widget .chat-welcome-response {
            font-size: 14px;
            opacity: 0.7;
            font-family: 'Rajdhani', sans-serif;
        }

        /* Chat messages view */
        .n8n-chat-widget .chat-messages-view {
            display: none;
            flex-direction: column;
            flex: 1;
            width: 100%;
        }

        .n8n-chat-widget .chat-messages-view.active {
            display: flex;
        }

        .n8n-chat-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            scroll-behavior: smooth;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .n8n-chat-widget .chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .n8n-chat-widget .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }

        .n8n-chat-widget .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(133, 79, 255, 0.3);
            border-radius: 10px;
        }

        .n8n-chat-widget .chat-message {
            display: flex;
            flex-direction: column;
            max-width: 85%;
            margin-bottom: 4px;
            animation: message-fade-in 0.3s ease forwards;
            font-family: 'Rajdhani', sans-serif;
        }

        @keyframes message-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .n8n-chat-widget .chat-message.user {
            align-self: flex-end;
        }

        .n8n-chat-widget .chat-message.bot {
            align-self: flex-start;
        }

        .n8n-chat-widget .chat-message-bubble {
            padding: 12px 16px;
            border-radius: 18px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: relative;
            transition: transform 0.2s ease;
            width: auto;
            display: inline-block;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-message-bubble:hover {
            transform: translateY(-2px);
        }

        .n8n-chat-widget .chat-message.user .chat-message-bubble {
            background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-secondary) 100%);
            color: white;
            border-top-right-radius: 4px;
            align-self: flex-end;
        }

        .n8n-chat-widget .chat-message.bot .chat-message-bubble {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--chat-border);
            border-top-left-radius: 4px;
            align-self: flex-start;
        }

        .n8n-chat-widget .chat-message-time {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 4px;
            align-self: flex-end;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-message.bot .chat-message-time {
            align-self: flex-start;
        }

        /* Square Loading indicator */
        .n8n-chat-widget .loader {
            width: 20px;
            aspect-ratio: 1;
            color: var(--chat-primary);
            border: 2px solid;
            display: grid;
            box-sizing: border-box;
            animation: l1 4s infinite linear;
            background: transparent;
        }
        
        .n8n-chat-widget .loader::before,
        .n8n-chat-widget .loader::after {
            content: "";
            grid-area: 1/1;
            margin: auto;
            width: 70.7%;
            aspect-ratio: 1;
            border: 2px solid;
            box-sizing: border-box;
            animation: inherit;
            background: transparent;
        }
        
        .n8n-chat-widget .loader::after {
            width: 50%;
            aspect-ratio: 1;
            border: 2px solid;
            animation-duration: 2s;
            background: transparent;
        }
        
        @keyframes l1 {
            100% {transform: rotate(1turn)}
        }
        
        .n8n-chat-widget .loading-indicator {
            display: none;
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 12px;
            max-width: 80%;
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--chat-border);
            justify-content: center;
            align-items: center;
        }

        /* Input area */
        .n8n-chat-widget .chat-input {
            padding: 15px;
            border-top: 1px solid var(--chat-border);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .n8n-chat-widget .input-area {
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }

        .n8n-chat-widget .chat-input-field {
            flex: 1;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--chat-border);
            border-radius: 8px;
            color: var(--chat-text);
            font-family: 'Rajdhani', sans-serif;
            font-size: 14px;
            resize: none;
            height: 44px;
            max-height: 150px;
            overflow-y: hidden;
            transition: border-color 0.2s ease, background 0.2s ease;
        }

        .n8n-chat-widget .chat-input-field:focus {
            outline: none;
            border-color: var(--chat-primary);
            background: rgba(255, 255, 255, 0.08);
        }

        .n8n-chat-widget .chat-input-field::placeholder {
            color: rgba(255, 255, 255, 0.5);
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .file-input {
            display: none;
        }

        .n8n-chat-widget .file-list {
            display: none;
            flex-direction: column;
            gap: 4px;
            max-height: 100px;
            overflow-y: auto;
            padding: 4px 0;
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
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .file-icon {
            width: 20px;
            height: 20px;
            fill: var(--chat-primary);
        }

        .n8n-chat-widget .file-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: white;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .file-size {
            font-size: 11px;
            opacity: 0.7;
            color: white;
            font-family: 'Rajdhani', sans-serif;
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

        .n8n-chat-widget .chat-attachment-button {
            background: none;
            border: none;
            color: var(--chat-text);
            opacity: 0.7;
            cursor: pointer;
            width: 24px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            margin: 0 5px;
            transition: opacity 0.2s;
            align-self: flex-end;
        }

        .n8n-chat-widget .chat-attachment-button:hover {
            opacity: 1;
        }

        .n8n-chat-widget .chat-attachment-button svg {
            width: 20px;
            height: 20px;
        }

        .n8n-chat-widget .chat-input-button {
            background: linear-gradient(135deg, var(--chat-primary) 0%, var(--chat-secondary) 100%);
  color: white;
  border: none;
  border-radius: 9999px; /* full pill shape */
  padding: 6px 18px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
  height: 36px;
  letter-spacing: 1px;
  font-size: 14px;
  font-family: 'Rajdhani', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
  margin-bottom: 4px;
        }

        .n8n-chat-widget .chat-input-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(133, 79, 255, 0.3);
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
            font-family: 'Rajdhani', sans-serif;
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
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .file-preview-name {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .file-preview-size {
            opacity: 0.7;
            font-family: 'Rajdhani', sans-serif;
        }

        /* Footer */
        .n8n-chat-widget .chat-footer {
            padding: 10px;
            text-align: center;
            border-top: 1px solid var(--chat-border);
            font-size: 12px;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-footer a {
            color: var(--chat-primary);
            text-decoration: none;
            opacity: 0.8;
            transition: opacity 0.2s ease;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-footer a:hover {
            opacity: 1;
        }

        /* Conversation view */
        .n8n-chat-widget .chat-conversations-view {
            display: none;
            flex-direction: column;
            flex: 1;
            width: 100%;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-conversations-view.active {
            display: flex;
        }

        .n8n-chat-widget .chat-conversations-header {
            padding: 16px;
            font-weight: 500;
            border-bottom: 1px solid var(--chat-border);
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-conversations-list {
            flex: 1;
            overflow-y: auto;
        }

        .n8n-chat-widget .chat-conversation-item {
            display: flex;
            padding: 16px;
            border-bottom: 1px solid var(--chat-border);
            cursor: pointer;
            transition: background 0.2s ease;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-conversation-item:hover {
            background: rgba(133, 79, 255, 0.1);
        }

        .n8n-chat-widget .chat-conversation-item.active {
            background: rgba(133, 79, 255, 0.15);
        }

        .n8n-chat-widget .chat-conversation-content {
            flex: 1;
            overflow: hidden;
        }

        .n8n-chat-widget .chat-conversation-title {
            font-weight: 500;
            margin-bottom: 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-conversation-preview {
            opacity: 0.7;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-conversation-time {
            margin-left: 15px;
            opacity: 0.6;
            font-size: 12px;
            white-space: nowrap;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            text-align: center;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-empty-icon {
            margin-bottom: 20px;
            opacity: 0.3;
        }

        .n8n-chat-widget .chat-empty-text {
            margin-bottom: 20px;
            opacity: 0.7;
            font-family: 'Rajdhani', sans-serif;
        }

        /* Markdown content styling */
        .n8n-chat-widget .chat-markdown {
            line-height: 1.6;
            width: 100%;
            overflow: auto;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown p {
            margin: 0 0 12px 0;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown p:last-child {
            margin-bottom: 0;
        }

        .n8n-chat-widget .chat-markdown h1,
        .n8n-chat-widget .chat-markdown h2,
        .n8n-chat-widget .chat-markdown h3 {
            margin: 16px 0 8px 0;
            font-weight: 600;
            line-height: 1.25;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown h1 {
            font-size: 1.5em;
            border-bottom: 1px solid var(--chat-border);
            padding-bottom: 4px;
        }

        .n8n-chat-widget .chat-markdown h2 {
            font-size: 1.3em;
            border-bottom: 1px solid var(--chat-border);
            padding-bottom: 4px;
        }

        .n8n-chat-widget .chat-markdown h3 {
            font-size: 1.1em;
        }

        .n8n-chat-widget .chat-markdown ul,
        .n8n-chat-widget .chat-markdown ol {
            margin: 8px 0 16px 0;
            padding-left: 20px;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown li {
            margin-bottom: 4px;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown a {
            color: #a58aff;
            text-decoration: none;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown a:hover {
            text-decoration: underline;
        }

        .n8n-chat-widget .chat-markdown blockquote {
            border-left: 4px solid var(--chat-primary);
            margin: 8px 0;
            padding: 4px 0 4px 16px;
            opacity: 0.8;
            font-style: italic;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 4px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
        }

        .n8n-chat-widget .chat-markdown pre {
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            overflow-x: auto;
            margin: 12px 0;
            border-left: 3px solid var(--chat-primary);
        }

        .n8n-chat-widget .chat-markdown pre code {
            background: transparent;
            padding: 0;
            border-radius: 0;
            font-size: 0.9em;
            color: #f8f8f2;
            white-space: pre;
        }

        .n8n-chat-widget .chat-markdown table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown th,
        .n8n-chat-widget .chat-markdown td {
            border: 1px solid var(--chat-border);
            padding: 8px;
            text-align: left;
            font-family: 'Rajdhani', sans-serif;
        }

        .n8n-chat-widget .chat-markdown th {
            background: rgba(133, 79, 255, 0.1);
            font-weight: 600;
        }

        .n8n-chat-widget .chat-markdown img {
            max-width: 100%;
            border-radius: 8px;
            margin: 12px 0;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
            .n8n-chat-widget .chat-container {
                width: 100%;
                height: 100vh;
                bottom: 0;
                ${config.style.position}: 0;
                border-radius: 0;
                border: none;
                margin: 0;
                max-height: 100vh;
            }
            
            .n8n-chat-widget .chat-container.open {
                transform: none;
            }
            
            body.chat-open {
                overflow: hidden;
                position: fixed;
                width: 100%;
                height: 100%;
            }
            
            .n8n-chat-widget .chat-header-button.expand-button {
                display: none;
            }
            
            .n8n-chat-widget .chat-messages {
                max-height: calc(100vh - 150px);
            }
            
            .n8n-chat-widget .chat-welcome-button,
            .n8n-chat-widget .chat-input-button {
                padding: 12px 24px;
                font-size: 14px;
            }
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

/**
 * Create the chat widget DOM structure
 */
function createWidgetDOM() {
    console.log("Creating chat widget DOM");
    
    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    
    // Chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
    // Header
    const header = document.createElement('div');
    header.className = 'chat-header';
    header.innerHTML = `
        <img src="${config.branding.logo}" alt="${config.branding.name}" class="chat-header-logo">
        <div class="chat-header-title">${config.branding.name}</div>
        <div class="chat-header-actions">
            <div class="chat-menu">
                <button class="chat-header-button chat-menu-toggle" title="Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                    <div class="chat-menu-dropdown">
                        <div class="chat-menu-item chat-new-conversation">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            New conversation
                        </div>
                        <div class="chat-menu-item chat-view-conversations">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            View conversations
                        </div>
                        <div class="chat-menu-divider"></div>
                        <div class="chat-menu-item chat-download-transcript">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download transcript
                        </div>
                    </div>
                </button>
            </div>
            <button class="chat-header-button expand-button" title="Expand">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6"></path>
                    <path d="M9 21H3v-6"></path>
                    <path d="M21 3l-7 7"></path>
                    <path d="M3 21l7-7"></path>
                </svg>
            </button>
            <button class="chat-header-button close-button" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    // Views container
    const viewsContainer = document.createElement('div');
    viewsContainer.className = 'chat-views';
    
    // Welcome view
    const welcomeView = document.createElement('div');
    welcomeView.className = 'chat-welcome';
    welcomeView.innerHTML = `
        <h2 class="chat-welcome-title">${config.branding.welcomeText}</h2>
        <button class="chat-welcome-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            See How We Can Help
        </button>
        <p class="chat-welcome-response">${config.branding.responseTimeText}</p>
    `;
    
    // Chat messages view
    const messagesView = document.createElement('div');
    messagesView.className = 'chat-messages-view';
    messagesView.innerHTML = `
        <div class="chat-messages"></div>
        <div class="chat-input">
            <div class="file-list"></div>
            <div class="input-area">
                <textarea class="chat-input-field" placeholder="Type your message..." rows="1"></textarea>
                <button class="chat-attachment-button" title="Attach file">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                </button>
                <input type="file" class="file-input" multiple>
                <button class="chat-input-button">Send</button>
            </div>
        </div>
        <div class="chat-footer">
            <a href="${config.branding.poweredBy.link}" target="_blank">${config.branding.poweredBy.text}</a>
        </div>
    `;
    
    // Conversations view
    const conversationsView = document.createElement('div');
    conversationsView.className = 'chat-conversations-view';
    conversationsView.innerHTML = `
        <div class="chat-conversations-header">Recent conversations</div>
        <div class="chat-conversations-list"></div>
    `;
    
    // Assemble the widget
    viewsContainer.appendChild(welcomeView);
    viewsContainer.appendChild(messagesView);
    viewsContainer.appendChild(conversationsView);
    
    chatContainer.appendChild(header);
    chatContainer.appendChild(viewsContainer);
    
    // Toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'chat-toggle';
    toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.476 0-2.886-.313-4.156-.878l-3.156.586.586-3.156A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
        </svg>
    `;
    
    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);
    
    console.log("Chat widget DOM created");
}

/**
 * Initialize DOM element references
 */
function initDOMReferences() {
    // Get DOM elements from the widget container
    const widgetContainer = document.querySelector('.n8n-chat-widget');
    if (!widgetContainer) {
        console.error("Widget container not found");
        return false;
    }
    
    chatContainer = widgetContainer.querySelector('.chat-container');
    toggleButton = widgetContainer.querySelector('.chat-toggle');
    chatInterface = widgetContainer.querySelector('.chat-messages-view');
    newChatBtn = widgetContainer.querySelector('.chat-welcome-button');
    messagesContainer = widgetContainer.querySelector('.chat-messages');
    textarea = widgetContainer.querySelector('.chat-input-field');
    sendButton = widgetContainer.querySelector('.chat-input-button');
    attachmentButton = widgetContainer.querySelector('.chat-attachment-button');
    fileInput = widgetContainer.querySelector('.file-input');
    fileList = widgetContainer.querySelector('.file-list');
    
    menuButtons = widgetContainer.querySelectorAll('.chat-menu-toggle');
    expandButtons = widgetContainer.querySelectorAll('.expand-button');
    downloadButtons = widgetContainer.querySelectorAll('.chat-download-transcript');
    viewConversationsButtons = widgetContainer.querySelectorAll('.chat-view-conversations');
    newConversationButtons = widgetContainer.querySelectorAll('.chat-new-conversation');
    
    return true;
}

/**
 * Set up UI event handlers
 */
function setupChatUI() {
    console.log("Setting up chat UI event handlers");
    
    // Initialize DOM references
    if (!initDOMReferences()) {
        console.error("Failed to initialize DOM references");
        return;
    }
    
    // Toggle chat open/close
    toggleButton.addEventListener('click', () => {
        const widgetContainer = document.querySelector('.n8n-chat-widget');
        
        if (chatContainer.classList.contains('open')) {
            chatContainer.classList.remove('open');
            widgetContainer.classList.remove('chat-open');
            document.body.classList.remove('chat-open');
        } else {
            chatContainer.classList.add('open');
            widgetContainer.classList.add('chat-open');
            
            // On mobile, disable scrolling of the background
            if (isMobileDevice()) {
                document.body.classList.add('chat-open');
            }
            
            // If it's first time, show welcome screen, else show messages
            if (conversations.length === 0) {
                document.querySelector('.chat-welcome').style.display = 'flex';
                chatInterface.classList.remove('active');
                document.querySelector('.chat-conversations-view').classList.remove('active');
            } else {
                document.querySelector('.chat-welcome').style.display = 'none';
                chatInterface.classList.add('active');
                document.querySelector('.chat-conversations-view').classList.remove('active');
                // Scroll to bottom of messages
                scrollToBottom();
            }
        }
    });
    
    // Close button
    document.querySelector('.close-button').addEventListener('click', () => {
        chatContainer.classList.remove('open');
        document.querySelector('.n8n-chat-widget').classList.remove('chat-open');
        document.body.classList.remove('chat-open');
    });
    
    // Expand button (except on mobile)
    if (!isMobileDevice()) {
        document.querySelector('.expand-button').addEventListener('click', () => {
            chatContainer.classList.toggle('expanded');
            
            // Toggle expand/collapse icon
            const button = document.querySelector('.expand-button');
            if (chatContainer.classList.contains('expanded')) {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 14h6v6"></path>
                        <path d="M20 10h-6V4"></path>
                        <path d="M14 10l7-7"></path>
                        <path d="M3 21l7-7"></path>
                    </svg>
                `;
                button.title = "Collapse";
            } else {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6"></path>
                        <path d="M9 21H3v-6"></path>
                        <path d="M21 3l-7 7"></path>
                        <path d="M3 21l7-7"></path>
                    </svg>
                `;
                button.title = "Expand";
            }
        });
    }
    
    // Menu button
    const menuToggle = document.querySelector('.chat-menu-toggle');
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuDropdown = document.querySelector('.chat-menu-dropdown');
        menuDropdown.classList.toggle('show');
        
        // Add active class to make toggle button fully visible
        menuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
        const menuDropdown = document.querySelector('.chat-menu-dropdown');
        const menuToggle = document.querySelector('.chat-menu-toggle');
        
        if (menuDropdown.classList.contains('show')) {
            menuDropdown.classList.remove('show');
            menuToggle.classList.remove('active');
        }
    });
    
    // Welcome button
    newChatBtn.addEventListener('click', startNewConversation);
    
    // New conversation button
    document.querySelector('.chat-new-conversation').addEventListener('click', (e) => {
        e.stopPropagation();
        startNewConversation();
        const menuDropdown = document.querySelector('.chat-menu-dropdown');
        const menuToggle = document.querySelector('.chat-menu-toggle');
        menuDropdown.classList.remove('show');
        menuToggle.classList.remove('active');
    });
    
    // View conversations button
    document.querySelector('.chat-view-conversations').addEventListener('click', (e) => {
        e.stopPropagation();
        showConversationsView();
        const menuDropdown = document.querySelector('.chat-menu-dropdown');
        const menuToggle = document.querySelector('.chat-menu-toggle');
        menuDropdown.classList.remove('show');
        menuToggle.classList.remove('active');
    });
    
    // Download transcript button
    document.querySelector('.chat-download-transcript').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadTranscript();
        const menuDropdown = document.querySelector('.chat-menu-dropdown');
        const menuToggle = document.querySelector('.chat-menu-toggle');
        menuDropdown.classList.remove('show');
        menuToggle.classList.remove('active');
    });
    
    // Send button
    sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message || attachedFiles.length > 0) {
            sendMessage(message);
            textarea.value = '';
            autoResizeTextarea(textarea);
        }
    });
    
    // Enter key to send (except with Shift)
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = textarea.value.trim();
            if (message || attachedFiles.length > 0) {
                sendMessage(message);
                textarea.value = '';
                autoResizeTextarea(textarea);
            }
        }
    });
    
    // Auto-resize textarea
    textarea.addEventListener('input', () => {
        autoResizeTextarea(textarea);
    });
    
    // File attachment
    attachmentButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            Array.from(e.target.files).forEach(file => {
                if (!isValidFileType(file)) {
                    alert(`File ${file.name} is not allowed. Only PNG, JPG, PDF, and CSV files are permitted.`);
                    return;
                }
                
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                    return;
                }
                
                addFileToList(file);
            });
            fileInput.value = '';
        }
    });
    
    // Handle file remove
    fileList.addEventListener('click', (e) => {
        if (e.target.classList.contains('file-remove')) {
            const fileId = e.target.dataset.fileId;
            removeFile(fileId);
        }
    });
}

/**
 * Automatically resize textarea height based on content
 * @param {HTMLTextAreaElement} textareaElement The textarea element
 */
function autoResizeTextarea(textareaElement) {
    // Reset height to calculate the scrollHeight
    textareaElement.style.height = '44px';
    
    // Get the scroll height
    const scrollHeight = textareaElement.scrollHeight;
    
    // Set the new height, but respect max-height
    if (scrollHeight > 150) {
        textareaElement.style.height = '150px';
        textareaElement.style.overflowY = 'auto';
    } else {
        textareaElement.style.height = scrollHeight + 'px';
        textareaElement.style.overflowY = 'hidden';
    }
}

/**
 * Scroll to bottom of messages container
 * @param {number} delay Optional delay in ms before scrolling
 */
function scrollToBottom(delay = 100) {
    setTimeout(() => {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, delay);
}

/**
 * Load conversations from localStorage
 * @returns {boolean} True if conversations were loaded
 */
function loadConversations() {
    const savedConversations = localStorage.getItem('n8n_chat_conversations');
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
        return conversations.length > 0;
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
 * Generate a UUID for conversation ID
 * @returns {string} UUID
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
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Format date for message timestamp
 * @param {Date} date Date object
 * @returns {string} Formatted time string
 */
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
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
        return 'Today';
    } else if (diff < 2 * day) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

/**
 * Get current date with timezone info
 * @returns {string} Formatted date string
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
 * Check if file type is valid
 * @param {File} file File object
 * @returns {boolean} True if file type is allowed
 */
function isValidFileType(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/csv'];
    return allowedTypes.includes(file.type);
}

/**
 * Create a file thumbnail
 * @param {File} file File object
 * @param {Function} callback Callback function with thumbnail URL
 */
function createThumbnail(file, callback) {
    const extension = file.name.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png'];
    
    if (imageTypes.includes(extension) && 
       (file.type === 'image/jpeg' || file.type === 'image/png')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const maxSize = 100;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                callback(canvas.toDataURL('image/jpeg', 0.7));
            };
            
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        callback(null);
    }
}

/**
 * Add file to attachment list
 * @param {File} file File object
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
    fileList.style.display = 'flex';
}

/**
 * Remove file from attachment list
 * @param {string} fileId File ID to remove
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
 * Create file preview element
 * @param {File} file File object
 * @returns {Promise<HTMLElement>} Promise resolving to preview element
 */
function createFilePreviewElement(file) {
    return new Promise((resolve) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
        
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'file-preview-thumbnail';
        
        const extension = file.name.split('.').pop().toLowerCase();
        
        if ((extension === 'jpg' || extension === 'jpeg' || extension === 'png') && 
            (file.type === 'image/jpeg' || file.type === 'image/png')) {
            createThumbnail(file, (thumbnailUrl) => {
                if (thumbnailUrl) {
                    const img = document.createElement('img');
                    img.src = thumbnailUrl;
                    img.alt = file.name;
                    img.setAttribute('draggable', 'false');
                    img.oncontextmenu = () => false;
                    
                    thumbnailContainer.appendChild(img);
                } else {
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
        } else {
            thumbnailContainer.innerHTML = getFileTypeIcon(file.name);
            
            previewItem.appendChild(thumbnailContainer);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-preview-info';
            fileInfo.innerHTML = `
                <span class="file-preview-name">${file.name}</span>
                <span class="file-preview-size">${formatFileSize(file.size)}</span>
            `;
            
            previewItem.appendChild(fileInfo);
            resolve(previewItem);
        }
    });
}

/**
 * Get file type icon based on extension
 * @param {string} filename Filename
 * @returns {string} SVG icon HTML
 */
function getFileTypeIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>`;
    } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(extension)) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>`;
    } else if (extension === 'csv') {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>`;
    } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
        </svg>`;
    }
}

/**
 * Render markdown content
 * @param {string} text Markdown text
 * @returns {string} HTML content
 */
function renderMarkdown(text) {
    if (!text) return '';
    
    if (typeof marked === 'undefined') {
        console.warn('Marked.js not loaded yet, returning plain text');
        return text;
    }

    // Configure marked
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    console.error('Error highlighting code:', e);
                }
            }
            return code;
        },
        gfm: true,
        breaks: true,
        sanitize: false
    });

    try {
        return marked.parse(text);
    } catch (e) {
        console.error('Error parsing markdown:', e);
        return text;
    }
}

/**
 * Apply syntax highlighting to code blocks
 */
function applySyntaxHighlighting() {
    if (typeof hljs !== 'undefined') {
        messagesContainer.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    } else {
        console.warn('Highlight.js not loaded yet, skipping syntax highlighting');
        // Try again in a second
        setTimeout(applySyntaxHighlighting, 1000);
    }
}

/**
 * Start a new conversation
 */
async function startNewConversation() {
    // Generate new session ID
    currentSessionId = generateUUID();
    chatMessages = [];
    activeConversationIndex = -1;
    
    // Update UI
    document.querySelector('.chat-welcome').style.display = 'none';
    document.querySelector('.chat-conversations-view').classList.remove('active');
    document.querySelector('.chat-messages-view').classList.add('active');
    messagesContainer.innerHTML = '';
    
    // Clear input and attachments
    textarea.value = '';
    attachedFiles = [];
    fileList.innerHTML = '';
    fileList.style.display = 'none';
    autoResizeTextarea(textarea);

    try {
        // Send initial empty message
        const data = [{
            action: "loadPreviousSession",
            sessionId: currentSessionId,
            route: config.webhook.route,
            metadata: { userId: "" }
        }];

        // Show loading indicator
        const loadingIndicator = createLoadingIndicator();
        messagesContainer.appendChild(loadingIndicator);

        const response = await fetch(config.webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        
        // Remove loading indicator
        messagesContainer.removeChild(loadingIndicator);

        // Extract bot response
        const botResponse = Array.isArray(responseData) ? 
            responseData[0].output : responseData.output;
        
        // Add bot message
        addMessage(botResponse, 'bot');
        
        // Save conversation
        saveChatState();
        
    } catch (error) {
        console.error('Error starting conversation:', error);
        
        // Show error message
        addMessage('Sorry, there was a problem connecting to the server. Please try again later.', 'bot');
    }
    
    // Focus on input field
    textarea.focus();
}

/**
 * Create a loading indicator
 * @returns {HTMLElement} Loading indicator element
 */
function createLoadingIndicator() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-indicator';
    
    // Create the square loader with its layers
    const loaderEl = document.createElement('div');
    loaderEl.className = 'loader';
    
    loadingEl.appendChild(loaderEl);
    loadingEl.style.display = 'flex';
    
    return loadingEl;
}

/**
 * Add a message to the chat
 * @param {string} message Message text
 * @param {string} sender 'user' or 'bot'
 */
function addMessage(message, sender) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    
    // Create message bubble
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-message-bubble';
    
    if (sender === 'bot') {
        // For bot messages, render markdown
        const markdownEl = document.createElement('div');
        markdownEl.className = 'chat-markdown';
        markdownEl.innerHTML = renderMarkdown(message);
        bubbleEl.appendChild(markdownEl);
    } else {
        // For user messages, use plain text
        bubbleEl.textContent = message;
    }
    
    // Create timestamp
    const timeEl = document.createElement('div');
    timeEl.className = 'chat-message-time';
    const now = new Date();
    timeEl.textContent = formatTime(now);
    
    // Assemble message
    messageEl.appendChild(bubbleEl);
    messageEl.appendChild(timeEl);
    
    // Add to container
    messagesContainer.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Save message to transcript
    chatMessages.push({
        timestamp: formatTime(now),
        sender: sender === 'user' ? 'Visitor' : config.branding.name,
        message: message,
        html: sender === 'bot' ? renderMarkdown(message) : null
    });
    
    // Apply syntax highlighting if available
    applySyntaxHighlighting();
}

/**
 * Send a message to the API
 * @param {string} message Message text
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
            userId: "",
            fileAttachments: attachedFiles.map(fileObj => ({
                name: fileObj.file.name,
                size: fileObj.file.size,
                type: fileObj.file.type
            }))
        }
    };
    
    // Add message data to FormData
    formData.append('data', JSON.stringify(messageData));
    
    // Keep track of file names for chat history
    const fileNames = [];
    
    // Add files to FormData
    attachedFiles.forEach((fileObj) => {
        formData.append('file_attachments', fileObj.file, fileObj.file.name);
        fileNames.push(fileObj.file.name);
    });

    // Add user message to UI
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message user';
    
    // Create message bubble
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-message-bubble';
    bubbleEl.textContent = message;
    
    // Create timestamp
    const timeEl = document.createElement('div');
    timeEl.className = 'chat-message-time';
    const now = new Date();
    timeEl.textContent = formatTime(now);
    
    // Assemble message
    messageEl.appendChild(bubbleEl);
    messageEl.appendChild(timeEl);
    
    // Add file previews if any
    if (attachedFiles.length > 0) {
        const filePreviewDiv = document.createElement('div');
        filePreviewDiv.className = 'file-preview';
        
        const previewPromises = attachedFiles.map(fileObj => createFilePreviewElement(fileObj.file));
        
        Promise.all(previewPromises).then(previewElements => {
            previewElements.forEach(previewElement => {
                filePreviewDiv.appendChild(previewElement);
            });
            
            bubbleEl.appendChild(filePreviewDiv);
            scrollToBottom();
        });
    }
    
    // Add to container
    messagesContainer.appendChild(messageEl);
    
    // Save to transcript
    const messageRecord = {
        timestamp: formatTime(now),
        sender: "Visitor",
        message: message
    };
    
    if (attachedFiles.length > 0) {
        messageRecord.files = fileNames;
    }
    
    chatMessages.push(messageRecord);
    
    // Save chat state
    saveChatState();
    
    // Scroll to bottom
    scrollToBottom();
    
    // Keep a copy of files to send
    const filesToSend = [...attachedFiles];
    
    // Clear attached files
    attachedFiles = [];
    fileList.innerHTML = '';
    fileList.style.display = 'none';

    // Show loading indicator
    const loadingIndicator = createLoadingIndicator();
    messagesContainer.appendChild(loadingIndicator);
    scrollToBottom();
    
    try {
        let response;
        
        // Use FormData with multipart/form-data when files are attached
        if (filesToSend.length > 0) {
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
        
        // Remove loading indicator
        messagesContainer.removeChild(loadingIndicator);
        
        // Extract bot response
        const botResponse = Array.isArray(data) ? data[0].output : data.output;
        
        // Add bot message
        addMessage(botResponse, 'bot');
        
        // Save updated chat state
        saveChatState();
        
    } catch (error) {
        console.error('Error:', error);
        
        // Remove loading indicator
        messagesContainer.removeChild(loadingIndicator);
        
        // Show error message
        addMessage('Sorry, there was an error sending your message. Please try again.', 'bot');
        
        // Save conversation
        saveChatState();
    }
}

/**
 * Save chat state to localStorage
 */
/**
 * Save chat state to localStorage
 */
function saveChatState() {
    if (currentSessionId && chatMessages.length > 0) {
        // Find existing conversation or create new one
        let conversationIndex = conversations.findIndex(c => c.sessionId === currentSessionId);
        
        // Create preview text
        const lastMessage = chatMessages[chatMessages.length - 1];
        let plainText = lastMessage.message;
        
        // Strip HTML if there's rendered HTML
        if (lastMessage.sender !== 'Visitor') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = plainText;
            plainText = tempDiv.textContent || tempDiv.innerText || plainText;
        }
        
        const preview = plainText.substring(0, 60) + 
            (plainText.length > 60 ? '...' : '');
        
        if (conversationIndex >= 0) {
            // Update existing conversation
            conversations[conversationIndex] = {
                ...conversations[conversationIndex],
                messages: chatMessages,
                preview: preview,
                lastUpdated: new Date().toISOString()
            };
        } else {
            // Create new conversation
            conversations.unshift({
                sessionId: currentSessionId,
                title: `Conversation ${conversations.length + 1}`,
                messages: chatMessages,
                preview: preview,
                lastUpdated: new Date().toISOString()
            });
            
            // Set the active index to 0 (the new conversation)
            activeConversationIndex = 0;
        }
        
        // Save to storage
        saveConversations();
    }
}

/**
 * Load a specific conversation
 * @param {number} index Conversation index
 */
function loadConversation(index) {
    if (index >= 0 && index < conversations.length) {
        activeConversationIndex = index;
        
        // Get conversation data
        const conversation = conversations[index];
        currentSessionId = conversation.sessionId;
        chatMessages = [...conversation.messages];
        
        // Switch to messages view
        document.querySelector('.chat-welcome').style.display = 'none';
        document.querySelector('.chat-conversations-view').classList.remove('active');
        document.querySelector('.chat-messages-view').classList.add('active');
        
        // Clear messages container
        messagesContainer.innerHTML = '';
        
        // Add messages
        chatMessages.forEach(msg => {
            // Create message element
            const messageEl = document.createElement('div');
            messageEl.className = `chat-message ${msg.sender === 'Visitor' ? 'user' : 'bot'}`;
            
            // Create message bubble
            const bubbleEl = document.createElement('div');
            bubbleEl.className = 'chat-message-bubble';
            
            if (msg.sender !== 'Visitor') {
                // Bot message with markdown
                const markdownEl = document.createElement('div');
                markdownEl.className = 'chat-markdown';
                
                // If we have pre-rendered HTML, use it, otherwise render markdown
                if (msg.html) {
                    markdownEl.innerHTML = msg.html;
                } else {
                    markdownEl.innerHTML = renderMarkdown(msg.message);
                    
                    // Update the saved HTML in the message object
                    msg.html = markdownEl.innerHTML;
                }
                
                bubbleEl.appendChild(markdownEl);
            } else {
                // User message as plain text
                bubbleEl.textContent = msg.message;
                
                // Add file attachments if they exist in the message
                if (msg.files && msg.files.length > 0) {
                    const filePreviewDiv = document.createElement('div');
                    filePreviewDiv.className = 'file-preview';
                    
                    // Create file preview elements for each attached file
                    msg.files.forEach(fileName => {
                        const filePreviewItem = document.createElement('div');
                        filePreviewItem.className = 'file-preview-item';
                        
                        const thumbnailContainer = document.createElement('div');
                        thumbnailContainer.className = 'file-preview-thumbnail';
                        thumbnailContainer.innerHTML = getFileTypeIcon(fileName);
                        
                        const fileInfo = document.createElement('div');
                        fileInfo.className = 'file-preview-info';
                        fileInfo.innerHTML = `
                            <span class="file-preview-name">${fileName}</span>
                        `;
                        
                        // Add fileDetails if available (size, etc)
                        if (msg.fileDetails) {
                            const fileDetail = msg.fileDetails.find(fd => fd.name === fileName);
                            if (fileDetail && fileDetail.size) {
                                const sizeSpan = document.createElement('span');
                                sizeSpan.className = 'file-preview-size';
                                sizeSpan.textContent = formatFileSize(fileDetail.size);
                                fileInfo.appendChild(sizeSpan);
                            }
                        }
                        
                        filePreviewItem.appendChild(thumbnailContainer);
                        filePreviewItem.appendChild(fileInfo);
                        filePreviewDiv.appendChild(filePreviewItem);
                    });
                    
                    bubbleEl.appendChild(filePreviewDiv);
                }
            }
            
            // Create timestamp
            const timeEl = document.createElement('div');
            timeEl.className = 'chat-message-time';
            timeEl.textContent = msg.timestamp;
            
            // Assemble message
            messageEl.appendChild(bubbleEl);
            messageEl.appendChild(timeEl);
            
            // Add to container
            messagesContainer.appendChild(messageEl);
        });
        
        // Scroll to bottom with a longer delay to ensure all content is rendered
        scrollToBottom(300);
        
        // Apply syntax highlighting
        applySyntaxHighlighting();
        
        // Save conversation to ensure HTML is stored
        saveChatState();
    }
}

/**
 * Show conversations view
 */
function showConversationsView() {
    document.querySelector('.chat-welcome').style.display = 'none';
    document.querySelector('.chat-messages-view').classList.remove('active');
    document.querySelector('.chat-conversations-view').classList.add('active');
    
    // Render conversations
    renderConversationsList();
}

/**
 * Render the conversations list
 */
function renderConversationsList() {
    const conversationsList = document.querySelector('.chat-conversations-list');
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        // Show empty state
        const emptyEl = document.createElement('div');
        emptyEl.className = 'chat-empty-state';
        emptyEl.innerHTML = `
            <svg class="chat-empty-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p class="chat-empty-text">No conversations yet</p>
            <button class="chat-welcome-button">GROW MY BUSINESS</button>
        `;
        
        conversationsList.appendChild(emptyEl);
        
        // Add event listener to button
        const newChatBtn = emptyEl.querySelector('.chat-welcome-button');
        newChatBtn.addEventListener('click', startNewConversation);
        
        return;
    }
    
    // Add conversation items
    conversations.forEach((conversation, index) => {
        const date = new Date(conversation.lastUpdated);
        
        const itemEl = document.createElement('div');
        itemEl.className = `chat-conversation-item${index === activeConversationIndex ? ' active' : ''}`;
        itemEl.innerHTML = `
            <div class="chat-conversation-content">
                <div class="chat-conversation-title">${conversation.title}</div>
                <div class="chat-conversation-preview">${conversation.preview}</div>
            </div>
            <div class="chat-conversation-time">${formatDate(date)}</div>
        `;
        
        // Add click handler
        itemEl.addEventListener('click', () => {
            loadConversation(index);
        });
        
        conversationsList.appendChild(itemEl);
    });
}

/**
 * Generate and download transcript
 */
function downloadTranscript() {
    if (!currentSessionId || chatMessages.length === 0) {
        console.warn('No conversation to download');
        return;
    }
    
    // Create transcript text
    let transcript = `Conversation with ${config.branding.name}\n`;
    transcript += `Date: ${new Date().toLocaleDateString()}\n`;
    transcript += `${'-'.repeat(40)}\n\n`;
    
    chatMessages.forEach(msg => {
        // Get plain text from messages
        let msgText = msg.message;
        if (msg.sender !== 'Visitor' && msg.message.includes('<')) {
            // Create a temporary div to strip HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msgText;
            msgText = tempDiv.textContent || tempDiv.innerText || msgText;
        }
        
        transcript += `[${msg.timestamp}] ${msg.sender}: ${msgText}\n\n`;
    });
    
    transcript += `\n${'-'.repeat(40)}\n`;
    transcript += `Generated on ${new Date().toLocaleString()}`;
    
    // Create and trigger download
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.branding.name.replace(/\s+/g, '-')}-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Check if device is mobile
 * @returns {boolean} True if on mobile device
 */
function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           (navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i));
}

/**
 * Set up textarea auto-resizing
 */
function setupTextareaAutoResize() {
    if (!textarea) return;
    
    // Set initial height
    textarea.style.height = '44px';
    
    // Input event listener to adjust height
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
}

/**
 * Add viewport meta tag for mobile
 */
function addViewportMeta() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
}

/**
 * Enhance mobile experience
 */
function enhanceMobileExperience() {
    addViewportMeta();
    setupTextareaAutoResize();
    
    // Add touch event listener for iOS
    document.addEventListener('touchstart', function() {}, false);
    
    // Hide expand button on mobile
    if (isMobileDevice()) {
        const expandButtons = document.querySelectorAll('.expand-button');
        expandButtons.forEach(button => {
            button.style.display = 'none';
        });
    }
}
