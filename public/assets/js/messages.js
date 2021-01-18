let conversations = document.querySelectorAll('.conversation');
const messaging = document.getElementById('messaging');
const addConversation = document.getElementById('addConversation');
const addConversationDiv = document.getElementById('addConversationDiv');
const addConversationSubmit = document.getElementById('addConversationSubmit');
const addConversationCancel = document.getElementById('addConversationCancel');
const addConversationInput = document.getElementById('addConversationInput');
const messagesList = document.getElementById('messagesList');
const internalMessages = document.getElementById('internalMessages');
const messageInput = document.querySelector('#messaging > input');
const sendMessageBtn = document.getElementById('sendMessageBtn');

let conversationLoaded = '';

// Load conversation takes a conversation ID and loads its messages & removes and adds appropriate html
const loadConversation = async (conversationID, scroll) => {
    if (conversationID) {
        conversationLoaded = conversationID;
        const response = await fetch('/messages/loadconversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID,
                conversationID,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {
            // Make the conversation background darker to show it is selected
            conversations = document.querySelectorAll('.conversation');
            conversations.forEach(conversation1 => {
                if (conversation1.getAttribute('data-conversation-id') == conversationID) {
                    conversation1.classList.add('active');
                }
            });
            // Removes previous html
            internalMessages.innerHTML = '';
            // Loops through messages generating html
            resJSON.messages.forEach(message => {
                const node = document.createElement('div');
                node.classList.add('text-box');
                if (JSON.stringify(message[0]) === JSON.stringify(userID)) {
                    node.classList.add('sent-text');
                } else {
                    node.classList.add('received-text');
                }
                node.innerHTML = `<div class="text">${message[1]}</div>`;
                // Load html
                internalMessages.appendChild(node);
            });
            // Scroll to bottom
            if (scroll) {
                internalMessages.scrollTop = internalMessages.scrollHeight;
            }
        } else {
            window.location.href = '/login';
        }   
    } else {
        internalMessages.innerHTML = '';
        conversationLoaded = '';
        // Make the conversation background light to show it is no longer selected
        conversations = document.querySelectorAll('.conversation');
        conversations.forEach(conversation => {
            if (conversation.getAttribute('data-conversation-id') == conversationID) {
                conversation.classList.remove('active');
            }
        });
    }
    
}
// Periodic load conversation here, all code copied from aboce.
setInterval(async () => {
    if (conversationLoaded) {
        const response = await fetch('/messages/loadconversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID,
                conversationID: conversationLoaded,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {
            // Removes previous html
            let previousHTML = internalMessages.innerHTML;
            internalMessages.innerHTML = '';
            // Loops through messages generating html
            resJSON.messages.forEach(message => {
                const node = document.createElement('div');
                node.classList.add('text-box');
                if (JSON.stringify(message[0]) === JSON.stringify(userID)) {
                    node.classList.add('sent-text');
                } else {
                    node.classList.add('received-text');
                }
                node.innerHTML = `<div class="text">${message[1]}</div>`;
                // Load html
                internalMessages.appendChild(node);
            });
            if (previousHTML != internalMessages.innerHTML) {
                internalMessages.scrollTop = internalMessages.scrollHeight;
            }
        } else {
            window.location.href = '/login';
        }   
    }
}, 3000)

// Add conversation
addConversation.addEventListener('click', () => {
    addConversationDiv.classList.toggle('active');
});
addConversationCancel.addEventListener('click', () => {
    addConversationDiv.classList.remove('active');
    addConversationInput.value = '';
});

addConversationSubmit.addEventListener('click', async () => {
    const receiver = addConversationInput.value;
    addConversationSubmit.innerText = 'Loading...';
    addConversationDiv.classList.remove('active');
    const response = await fetch('/messages/addconversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userID,
            receiver,
        }),
    });
    const resJSON = await response.json();
    if (resJSON.status === 'no-user') {
        alert('No account with that username!');
        addConversationSubmit.innerText = 'Add';
        return;
    }
    if (resJSON.status === 'already-convo') {
        alert('Already a conversation between you and that user!');
        addConversationSubmit.innerText = 'Add';
        return;
    }
    if (resJSON.status === 'yourself') {
        alert('You cannot create a conversation with yourself!');
        addConversationSubmit.innerText = 'Add';
        return;
    }
    if (resJSON.status === 'success') {
        // Generate conversation html
        const receiverUsername = resJSON.username;
        const node = document.createElement('div');
        node.classList.add('conversation');
        node.setAttribute('data-conversation-id', resJSON.conversationID);
        node.innerHTML = 
        `
        <h2>${receiverUsername}</h2>
        <h4>Start Messaging!</h4>
        `;
        addConversationSubmit.innerText = 'Add';
        addConversationInput.value = '';
    } else {
        window.location.href = '/login';
    }   
});

// Check for Conversations *Right when page loads & periodically*
const checkConversations = async () => {
    const response = await fetch('/messages/checkconversations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userID,
        }),
    });
    const resJSON = await response.json();
    if (resJSON.status === 'success') {
        // Generate html for each conversation
        resJSON.usersConversations.forEach(async conversation => {
            let receiverID = '';
            if (JSON.stringify(conversation.people[0]) === JSON.stringify(userID)) {
                receiverID = conversation.people[1];
            } else {
                receiverID = conversation.people[0];
            }
            const receiverUser = await lookupUsername(receiverID);   
            const node = document.createElement('div');
            node.classList.add('conversation');
            node.setAttribute('data-conversation-id', conversation._id);
            node.innerHTML = 
            `
            <h2>${receiverUser}</h2>
            <h4>${ conversation.messages[0] ? conversation.messages[conversation.messages.length - 1][1] : 'Start Messaging!'}</h4>
            `;
            node.addEventListener('click', () => { clickedConversation(node) });
            // Right before loading the html, remove previous html to eliminate flash
            if (messagesList.innerHTML) {
                messagesList.innerHTML = '';
            }
            // Load html here
            messagesList.insertBefore(node, messagesList.childNodes[0]);
        });
    } else {
        window.location.href = '/login';
    }
}
checkConversations();
setInterval(checkConversations, 3000);


// Lookup username from ID
const lookupUsername = async (receiverID) => {
    const response = await fetch('/messages/lookupusername', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            receiverID,
        })
    });
    const resJSON = await response.json();
    return resJSON.username;
}

// Function for click on conversation - Listener added when the element is created
const clickedConversation = (conversation) => {
    if (conversationLoaded) {
        conversationLoaded = '';
        loadConversation();
    } else {
        const conversationID = conversation.getAttribute('data-conversation-id');
        // Load conversation by ID
        loadConversation(conversationID, 'scroll-bottom');
    }
}

// Send message
messageInput.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
        if (conversationLoaded) {
            sendMessage(conversationLoaded, userID, e.target.value);
        }
    }
});

sendMessageBtn.addEventListener('click', () => {
    if (conversationLoaded) {
        sendMessage(conversationLoaded, userID, messageInput.value);
    }
})

const sendMessage = async (conversationID, senderID, message) => {
    const response = await fetch('/messages/sendmessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversationID,
            senderID,
            message,
        })
    });
    // justSentMessage = true;
    const resJSON = await response.json();
    if (resJSON.status === 'success') {
        messageInput.value = '';
    } else {
        window.location.href = '/login';
    }
}

//Gets rid of input bar if nothing in conversationLoaded
setInterval(() => {
    if (conversationLoaded) {
        messageInput.style.visibility = 'visible';
        sendMessageBtn.style.visibility = 'visible';
    } else if (!conversationLoaded) {
        messageInput.style.visibility = 'hidden';
        sendMessageBtn.style.visibility = 'hidden';
    }
}, 1)