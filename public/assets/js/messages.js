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
const addConversationSuggestions = document.getElementById('addConversationSuggestions');
const conversationLoader = document.getElementById('conversationLoader');
const sendImgBtn = document.getElementById('sendImgBtn');
const sendImgIcon = document.getElementById('sendImgIcon');
const sendImgFile = document.getElementById('sendImgFile');
const messagingHeader = document.getElementById('messagingHeader');
const messagingHeaderUser = document.querySelector('#messagingHeader > h1');
const editMessages = document.getElementById('editMessages');

let conversationLoaded = '';
let editMode = false;

// Load conversation takes a conversation ID and loads its messages & removes and adds new html
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
            // First remove other conversation darkened backgrounds
            let tempConversations = document.querySelectorAll('.conversation');
            tempConversations.forEach(conversation => {
                conversation.classList.remove('active');
            });
            tempConversations.forEach(conversation1 => {
                if (conversation1.getAttribute('data-conversation-id') == conversationID) {
                    conversation1.classList.add('active');

                    // Set header user
                    messagingHeaderUser.innerHTML = conversation1.children[0].outerHTML;
                }
            }); 

            // Removes previous html
            internalMessages.innerHTML = '';
            // Loops through messages generating html
            resJSON.messages.forEach((message, i) => {
                const node = document.createElement('div');
                node.classList.add('text-box');
                node.setAttribute('data-text-index', resJSON.messages.length-i)
                if (JSON.stringify(message[0]) === JSON.stringify(userID)) {
                    node.classList.add('sent-text');
                } else {
                    node.classList.add('received-text');
                }
                if (message[2] === 'img') {
                    node.innerHTML = `<img src="${message[1]}" class="text img" /><i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-index="${resJSON.messages.length-i}"></i>`;
                } else {
                    node.innerHTML = `<div class="text">${message[1]}<i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-index="${resJSON.messages.length-i}"></i></div>`;
                }
                
                // Add event listener to delete buttons
                const deleteBtn = node.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    deleteText(e.target.getAttribute('data-text-index'));
                })

                // Load html
                internalMessages.appendChild(node);
            });
            // Scroll to bottom
            if (scroll) {
                internalMessages.scrollTop = internalMessages.scrollHeight;
                document.querySelectorAll('.text.img').forEach( img => {
                    img.onload = () => {
                        internalMessages.scrollTop = internalMessages.scrollHeight;
                    };
                });    
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
            conversation.classList.remove('active');
        });
    }
    
}
// Periodic load conversation here, all code from above.
setInterval(async () => {
    await loadConversation(conversationLoaded)
}, 3000)

// Add conversation
addConversation.addEventListener('click', () => {
    addConversationDiv.classList.toggle('active');
    addConversationInput.style.display = 'block';
});
addConversationCancel.addEventListener('click', () => {
    addConversationDiv.classList.remove('active');
    addConversationInput.value = '';
});

addConversationSubmit.addEventListener('click', async () => {
    addConversationSubmitFunction(); 
});

addConversationInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        addConversationSubmitFunction();
    }
})

const addConversationSubmitFunction = async () => {
    if (addConversationInput.value) {
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
            myAlert('No account with that username!');
            addConversationSubmit.innerText = 'Add';
            addConversationInput.value = '';
            return;
        }
        if (resJSON.status === 'already-convo') {
            myAlert('Already a conversation between you and that user!');
            addConversationSubmit.innerText = 'Add';
            addConversationInput.value = '';
            return;
        }
        if (resJSON.status === 'yourself') {
            myAlert('You cannot create a conversation with yourself!');
            addConversationSubmit.innerText = 'Add';
            addConversationInput.value = '';
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
    }
       
}

// Add conversation search for user
addConversationInput.addEventListener('input', async (e) => {
    try {
      if (e.target.value) {
        const response = await fetch('/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: e.target.value,
            userID,
            device: window.navigator.userAgent,
          }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'wrong user') {
          window.location.href = '/login';
        } else if (resJSON.status === 'success') {
          const parsedAccounts = resJSON.searchedAccounts.map((account) =>
            JSON.parse(account)
          );
          addConversationSuggestions.innerHTML = '';
          parsedAccounts.forEach((account) => {
            const node = document.createElement('div');
            node.classList.add('suggestion');
            node.setAttribute('data-username', account.username)
            node.addEventListener('click', () => { autofillSearchUsername(node.getAttribute('data-username')); });
            let prefixHTML = ``;
              if (account.prefix.title) {
                  if (account.rank === 'owner') {
                    prefixHTML = `<p class="prefix owner">[${account.prefix.title.split('')[0]}]</p>`
                  } else if (account.rank === 'admin') {
                    prefixHTML = `<p class="prefix admin">[${account.prefix.title.split('')[0]}]</p>`
                  } else {
                    prefixHTML = `<p class="prefix">[${account.prefix.title.split('')[0]}]</p>`;
                  }
              }
            node.innerHTML = 
            `
            ${prefixHTML} ${account.username} - ${account.name}
            `;
            addConversationSuggestions.insertBefore(node, addConversationSuggestions.childNodes[0]);
          });
        }
      } else {
        addConversationSuggestions.innerHTML = '';
      }
    } catch (err) {
      console.error(err);
    }
});

const autofillSearchUsername = username => {
    const inputArray = addConversationInput.value.split(' ');
    inputArray[inputArray.length - 1] = username;
    addConversationInput.value = inputArray.join();
    addConversationInput.select();
}
  
  

// Check for Conversations *Right when page loads & periodically*
const checkConversations = async () => {
    conversationLoader.classList.add('active');
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
        resJSON.usersConversations.reverse().forEach(async (conversation, i) => {
            let receiverID = '';
            if (JSON.stringify(conversation.people[0]) === JSON.stringify(userID)) {
                receiverID = conversation.people[1];
            } else {
                receiverID = conversation.people[0];
            }
            const receiverUser = await lookupUsername(receiverID);  

            const node = document.createElement('div');
            node.classList.add('conversation');
            if (conversation._id === conversationLoaded) {
                node.classList.add('active');
            }
            node.setAttribute('data-conversation-id', conversation._id);
            let prefixHTML = ``;
            if (receiverUser.prefix.title) {
                if (receiverUser.rank === 'owner') {
                  prefixHTML = `<p class="prefix owner">[${receiverUser.prefix.title.split('')[0]}]</p>`
                } else if (receiverUser.rank === 'admin') {
                  prefixHTML = `<p class="prefix admin">[${receiverUser.prefix.title.split('')[0]}]</p>`
                } else {
                  prefixHTML = `<p class="prefix">[${receiverUser.prefix.title.split('')[0]}]</p>`;
                }
            }
            node.innerHTML = 
            `
            <h2>${prefixHTML} ${receiverUser.username}</h2>
            <h4>${ conversation.messages[0] ? conversation.messages[conversation.messages.length - 1][2] === 'img' ? 'Image' : conversation.messages[conversation.messages.length - 1][1] : 'Start Messaging!'}</h4>
            `;
            node.addEventListener('click', () => { clickedConversation(node) });
            
            //Remove node that is about to be replaced
            messagesList.removeChild(messagesList.childNodes[i]);
            // Load html here
            messagesList.insertBefore(node, messagesList.childNodes[i]);
            conversationLoader.classList.remove('active');
        });
    } else {
        window.location.href = '/login';
    }
}
checkConversations();
setInterval(checkConversations, 3000);

// Function for click on conversation - Listener added when the element is created
const clickedConversation = (conversation) => {
        if (conversationLoaded === conversation.getAttribute('data-conversation-id')) {
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
    messageInput.value = '';
    const response = await fetch('/messages/sendmessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversationID,
            senderID,
            message,
            device: window.navigator.userAgent,
        })
    });
    const resJSON = await response.json();
    if (resJSON.status === 'success') {
        loadConversation(conversationID, 'scroll-bottom');

    } else {
        window.location.href = '/login';
    }
}

sendImgIcon.addEventListener('click', () => {
    sendImgFile.click();
})

sendImgFile.addEventListener('change', (e) => {
    if (conversationLoaded) {

        // LOWER SIZE AND QUALITY OF IMG HERE
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = (event) => {
            const image = new Image();
            image.src = event.target.result;
            image.onload = (ev) => {
                const canvas = document.createElement('canvas');
                const MAX_LENGTH = 200;
                let scaleSize;
                if (ev.target.height - ev.target.width >= 0) {
                    canvas.height = MAX_LENGTH;
                    scaleSize = canvas.height / ev.target.height;
                    canvas.width = ev.target.width * scaleSize;
                } else {
                    canvas.width = MAX_LENGTH;
                    scaleSize = canvas.width / ev.target.width;
                    canvas.height = ev.target.height * scaleSize;
                }
                const ctx = canvas.getContext('2d');
                ctx.drawImage(ev.target, 0, 0, canvas.width, canvas.height);
                const encodedSrc = ctx.canvas.toDataURL('image/jpeg');
                sendImg(conversationLoaded, userID, encodedSrc);
            }
        }
    }
})

const sendImg = async (conversationID, senderID, message) => {
    try {
        const response = await fetch('/messages/sendimg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationID,
                senderID,
                message,
                device: window.navigator.userAgent,
            })
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {
            messageInput.value = '';
            loadConversation(conversationID, 'scroll-bottom');

        } else {
            window.location.href = '/login';
        }    
    } catch(err) {
        myAlert('Something went wrong.')
    }
    
}

editMessages.addEventListener('click', () => {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        editMode ? editMode = false : editMode = true;
        btn.classList.toggle('active');
        messaging.classList.toggle('delete-mode')
    });
});

const deleteText = async (textIndex) => {
    try {
        const response = await fetch('/messages/deletetext', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID,
                textIndex,
                conversationLoaded,
                device: window.navigator.userAgent,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'unseccessful') {
            window.location.href = '/login';
        } else if (resJSON.status === 'wrong-user') {
            myAlert('You can only delete messages YOU send!');
        } else if (resJSON.status === 'success') {
            await loadConversation(conversationLoaded);
        }
    } catch (err) {
        console.error(err);
    }
}

//Gets rid of input bar if nothing in conversationLoaded
setInterval(() => {
    if (conversationLoaded) {
        messageInput.style.visibility = 'visible';
        sendMessageBtn.style.visibility = 'visible';
        sendImgBtn.style.visibility = 'visible';
        messagingHeader.style.visibility = 'visible';
    } else if (!conversationLoaded) {
        messageInput.style.visibility = 'hidden';
        sendMessageBtn.style.visibility = 'hidden';
        sendImgBtn.style.visibility = 'hidden';
        messagingHeader.style.visibility = 'hidden';
    }
}, 1)