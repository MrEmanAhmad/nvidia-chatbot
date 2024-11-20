document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt');
    const chatContainer = document.getElementById('chat-container');
    const newChatBtn = document.getElementById('new-chat');
    const chatList = document.getElementById('chat-list');

    let currentChatId = null;
    let chats = {};

    // Initialize textarea auto-resize
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    async function generateChatName(messages) {
        if (messages.length === 0) return "New Chat";
        
        // Take the first message exchange to generate the name
        const context = messages.slice(0, 2).map(msg => msg.content).join('\n');
        
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: `Generate a very brief (3-4 words max) title for this chat based on the following exchange:\n${context}\nTitle:` 
                })
            });

            const data = await response.json();
            return data.response.replace(/["']/g, '').trim();
        } catch (error) {
            console.error('Error generating chat name:', error);
            return `Chat ${Object.keys(chats).length + 1}`;
        }
    }

    function createNewChat() {
        const chatId = Date.now().toString();
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.textContent = 'New Chat';  // Temporary name
        chatItem.dataset.chatId = chatId;
        
        chatList.appendChild(chatItem);
        chats[chatId] = [];
        
        switchToChat(chatId);
        return chatId;
    }

    function switchToChat(chatId) {
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');
        currentChatId = chatId;
        displayChat(chatId);
    }

    function displayChat(chatId) {
        chatContainer.innerHTML = '';
        chats[chatId].forEach(message => {
            appendMessage(message.content, message.type);
        });
    }

    function appendMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'bot') {
            // Format numbered lists
            content = content.replace(/(\d+\.)\s+/g, '<span class="list-number">$1</span> ');
            
            // Format bullet points
            content = content.replace(/^\*\s+/gm, '<span class="bullet-point">•</span> ');
            
            // Format bold text
            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Format paragraphs
            content = content.split('\n\n').map(para => 
                `<p>${para.trim()}</p>`
            ).join('');
            
            messageDiv.innerHTML = content;
        } else {
            messageDiv.textContent = content;
        }
        
        chatContainer.appendChild(messageDiv);
        messageDiv.style.animation = 'floatIn 0.3s ease forwards';
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatContainer.appendChild(indicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return indicator;
    }

    async function handleSubmit() {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        if (!currentChatId) {
            currentChatId = createNewChat();
        }

        // Clear input and reset height
        promptInput.value = '';
        promptInput.style.height = 'auto';

        // Append user message
        appendMessage(prompt, 'user');
        chats[currentChatId].push({ content: prompt, type: 'user' });

        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();
            typingIndicator.remove();

            appendMessage(data.response, 'bot');
            chats[currentChatId].push({ content: data.response, type: 'bot' });

            // Generate chat name after first exchange
            if (chats[currentChatId].length === 2) {
                const chatName = await generateChatName(chats[currentChatId]);
                const chatItem = document.querySelector(`[data-chat-id="${currentChatId}"]`);
                chatItem.textContent = chatName;
                
                // Add animation for name update
                chatItem.style.animation = 'updateName 0.5s ease';
            }

        } catch (error) {
            typingIndicator.remove();
            appendMessage('An error occurred while generating the response.', 'bot');
        }
    }

    // Event Listeners
    generateBtn.addEventListener('click', handleSubmit);
    
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });

    newChatBtn.addEventListener('click', createNewChat);

    chatList.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-item')) {
            switchToChat(e.target.dataset.chatId);
        }
    });

    // Create initial chat
    createNewChat();
}); 