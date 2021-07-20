const socket = io();
// Join personal room to listen for new conversations
socket.emit('joinUserRoom', { userID });


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
let conversation = {};
let editMode = false;
let conversationLoading = false;
let checkConversationsLoading = false;
let lastSentMessages = [];
let lastSentMessageIndex = -1;

const usersFromDB = {};

// ** NEW CODE **

// Listen for new message
socket.on('message', ({message, conversationID}) => {
    // Show text on screen
    const node = document.createElement('div');
    node.classList.add('text-box');
    // last child of internalMessages
    node.setAttribute('data-text-date', message.date);
    node.setAttribute('data-text-type', message.type);
    if (message.sender === userID) {
        node.classList.add('sent-text');
    } else {
        node.classList.add('received-text');
    }
    if (message.type === 'img') {
        node.innerHTML = `<img src="${message.value}" class="text img" /><i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i>`;
    } else {
        const newMessageValue = message.value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
        node.innerHTML = `<div class="text">${newMessageValue}<i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i></div>`;
        
    }
    
    // Add event listener to delete buttons
    const deleteBtn = node.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        deleteText(e.target.getAttribute('data-text-date'));
    })

    // Load html
    internalMessages.appendChild(node);
    internalMessages.scrollTop = internalMessages.scrollHeight;
});

socket.on('updateConversationsWithMessage', ({messageData: message, conversationID}) => {
    // Update conversations list so the message is correct, and is at top of list
    // find certain conversation
    const conversationNode = document.querySelector(`.conversation[data-conversation-id='${conversationID}']`);
    if (message.type == 'img') {
        conversationNode.children[1].innerText = 'Image';
    } else if (message.type == 'text') {
        conversationNode.children[1].innerText = message.value;
    }
    if (messagesList.children[0] != conversationNode) {
        messagesList.insertBefore(conversationNode, messagesList.children[0]);
    }
});

socket.on('deleteMessage', textDate => {
    // Visually instant delete
    const allTexts = document.querySelectorAll('i');
    allTexts.forEach(text => {
        if (text.getAttribute('data-text-date') == textDate) {
            if (text.getAttribute('data-text-type') == 'img') {
                text.parentNode.remove();
            } else {
                text.parentNode.parentNode.remove();
            }
            
        }
    })
});

socket.on('addedConvo', ({sender, conversationID}) => {
    // Generate conversation html
    const receiverUser = sender;
    const node = document.createElement('div');
    node.classList.add('conversation');
    node.setAttribute('data-conversation-id', conversationID);
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
    <h4>Start Messaging!</h4>
    <i class="fas fa-circle notification active"></i>
    `;

    node.addEventListener('click', () => { clickedConversation(node) });
    messagesList.insertBefore(node, messagesList.children[0]);
});

// Send message
function emitMessage(conversationID, message) {
    // Message = { value: '', type: 'text', sender: userID, date: Date.now() };
    socket.emit('message', {conversationID, message});

    // to update conversations list for those not currently in conversation
    conversation.people.forEach(person => {
        socket.emit('updateConversationsWithMessage', {person, messageData: message, conversationID});
    });
};


// ** OLD CODE **

// Check for Conversations *Right when page loads & periodically*
const checkConversations = async () => {
    if (!document.hidden) {
        try {
            if (!checkConversationsLoading) {
                checkConversationsLoading = true;
                conversationLoader.classList.add('active');
                const response = await fetch('/messages/checkconversations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userID,
                        conversationLoaded,
                    }),
                });
                const resJSON = await response.json();
                if (resJSON.status === 'success') {
                    if (resJSON.conversation) conversation = resJSON.conversation;
                    // Generate html for each conversation
                    resJSON.usersConversations.reverse().forEach(async (conversation, i) => {
                        let receiverID = '';
                        if (JSON.stringify(conversation.people[0]) === JSON.stringify(userID)) {
                            receiverID = conversation.people[1];
                        } else {
                            receiverID = conversation.people[0];
                        }

                        let receiverUser;  
                        if (usersFromDB[receiverID]) {
                            receiverUser = usersFromDB[receiverID];
                        } else {
                            receiverUser = await lookupUsername(receiverID);
                            usersFromDB[receiverID] = receiverUser;
                        }

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
                        <h4>${ conversation.messages[0] ? conversation.messages[conversation.messages.length - 1].type === 'img' ? 'Image' : conversation.messages[conversation.messages.length - 1].value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;') : 'Start Messaging!'}</h4>
                        <i class="fas fa-circle notification ${conversation.seen === 'unread' && conversation.seenFor == userID ? 'active' : ''}"></i>
                        `;

                        node.addEventListener('click', () => { clickedConversation(node) });
                        
                        //Remove node that is about to be replaced
                        if (messagesList.children[i]) {
                            messagesList.removeChild(messagesList.children[i]);
                        }
                        // Load html here
                        messagesList.insertBefore(node, messagesList.children[i]);

                        //
                        // LOADING CONVERSATION HERE INSTEAD OF SEPERATE FUNCTION
                        //
                        if (conversationLoaded) {
                            if (conversationLoaded === conversation._id) {
                                // Make the conversation background darker to show it is selected
                                // First remove other conversation darkened backgrounds
                                let tempConversations = document.querySelectorAll('.conversation');
                                tempConversations.forEach(conversation => {
                                    conversation.classList.remove('active');
                                });
                                tempConversations.forEach(conversation1 => {
                                    if (conversation1.getAttribute('data-conversation-id') == conversation._id) {
                                        conversation1.classList.add('active');
                    
                                        // Set header user
                                        messagingHeaderUser.innerHTML = conversation1.children[0].outerHTML;

                                        let person = '';
                                            if (JSON.stringify(conversation.people[0]) === JSON.stringify(userID)) {
                                                person = usersFromDB[conversation.people[1]].username;
                                            } else {
                                                person = usersFromDB[conversation.people[0]].username;
                                            }
                                        messagingHeaderUser.addEventListener('click', () => {
                                            window.location.href = `/account/${person}?k=${userID}`;
                                        });
                                    }
                                }); 
                                const previousHTML = internalMessages.innerHTML;
                                // Removes previous html
                                internalMessages.innerHTML = '';
                                // Loops through messages generating html
                                conversation.messages.forEach((message, i) => {
                                    const node = document.createElement('div');
                                    node.classList.add('text-box');
                                    node.setAttribute('data-text-date', message.date)
                                    if (message.sender === userID) {
                                        node.classList.add('sent-text');
                                    } else {
                                        node.classList.add('received-text');
                                    }
                                    if (message.type === 'img') {
                                        node.innerHTML = `<img src="${message.value}" class="text img" /><i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i>`;
                                    } else {
                                        const newMessageValue = message.value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
                                        node.innerHTML = `<div class="text">${newMessageValue}<i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i></div>`;
                                        
                                    }
                                    
                                    // Add event listener to delete buttons
                                    const deleteBtn = node.querySelector('.delete-btn');
                                    deleteBtn.addEventListener('click', (e) => {
                                        deleteText(e.target.getAttribute('data-text-date'));
                                    })
        
                                    // Load html
                                    internalMessages.appendChild(node);
                                });
                                const newHTML = internalMessages.innerHTML;
                                // Scroll to bottom
                                if (previousHTML !== newHTML && !editMode) {
                                    internalMessages.scrollTop = internalMessages.scrollHeight;
                                    document.querySelectorAll('.text.img').forEach( img => {
                                        img.onload = () => {
                                            internalMessages.scrollTop = internalMessages.scrollHeight;
                                        };
                                    });    
                                }
                                
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
                        
                        
                    });
                } else {
                    window.location.href = '/login';
                }
                conversationLoader.classList.remove('active');    
                checkConversationsLoading = false;
            } else {
                setTimeout(async () => {
                    await checkConversations();
                }, 500);
            }
            
        } catch(err) {
            console.error(err);
        }    
    }
    
    
}
checkConversations();
// setInterval(async () => {
//     if (!checkConversationsLoading) {
//         checkConversationsLoading = true;
//         await checkConversations();  
//         checkConversationsLoading = false;
//     }

// }, 3000);


// Function for click on conversation - Listener added when the element is created
const clickedConversation = (conversation) => {
    const conversationID = conversation.getAttribute('data-conversation-id');
        if (conversationLoaded === conversationID) {
            socket.emit('leaveConversation', { conversationID });
            conversationLoaded = '';
            let tempConversations = document.querySelectorAll('.conversation');
            tempConversations.forEach(conversation => {
                conversation.classList.remove('active');
            });
            internalMessages.innerHTML = '';
            // loadConversation();
            checkConversations();
        } else {
            socket.emit('leaveConversation', { conversationID: conversationLoaded });
            socket.emit('joinConversation', { conversationID, userID });
            conversationLoaded = conversationID;

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
            checkConversations();
        }
}


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
            const receiverUser = resJSON.receiver;
            const node = document.createElement('div');
            node.classList.add('conversation');
            node.setAttribute('data-conversation-id', resJSON.conversationID);
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
            <h4>Start Messaging!</h4>
            <i class="fas fa-circle notification active"></i>
            `;

            node.addEventListener('click', () => { clickedConversation(node) });
            messagesList.insertBefore(node, messagesList.firstChild);

            addConversationSubmit.innerText = 'Add';
            addConversationInput.value = '';
            socket.emit('addedConvo', { receiver: resJSON.receiver, conversationID: resJSON.conversationID, sender: resJSON.sender });

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
          const parsedAccounts = resJSON.searchedAccounts;
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
            addConversationSuggestions.insertBefore(node, addConversationSuggestions.children[0]);
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
  
// Send message
messageInput.addEventListener('keyup', (e) => {
    if (e.key == 'Enter') {
        if (conversationLoaded) {
            sendMessage(conversationLoaded, userID, e.target.value);
        }
    } else if (e.key == 'ArrowUp') {
        if (lastSentMessageIndex != lastSentMessages.length - 1) {
            lastSentMessageIndex += 1;
            messageInput.value = lastSentMessages[lastSentMessageIndex];
        }
    } else if (e.key == 'ArrowDown') {
        if (lastSentMessageIndex != -1) {
            if (lastSentMessageIndex != 0) {
                lastSentMessageIndex -= 1;
                messageInput.value = lastSentMessages[lastSentMessageIndex];
            } else {
                messageInput.value = '';
            }  
        }
    }

});

sendMessageBtn.addEventListener('click', () => {
    if (conversationLoaded) {
        sendMessage(conversationLoaded, userID, messageInput.value);
    }
});

// const instantMessageSend = (message) => {
//     if (!checkConversationsLoading) {
//         const node = document.createElement('div');
//         node.classList.add('text-box');
//         node.setAttribute('data-text-read', 'read');
//         node.classList.add('sent-text');
//         const newMessageValue = message.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
//         node.innerHTML = `<div class="text">${newMessageValue}<i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}"></i></div>`;
//         internalMessages.appendChild(node);
//         internalMessages.scrollTop = internalMessages.scrollHeight;    
//     } else {
//         setTimeout(() => { instantMessageSend(message); }, 100);
//     }
    
// };

// instantImgSend = (img) => {
//     if (!checkConversationsLoading) {
//         const node = document.createElement('div');
//         node.classList.add('text-box');
//         node.setAttribute('data-text-read', 'read');
//         node.classList.add('sent-text');
//         node.innerHTML = `<img src="${img}" class="text img" /><i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}"></i>`;
//         internalMessages.appendChild(node);
//         internalMessages.childNodes[internalMessages.childNodes.length - 1].childNodes[0].onload = () => {
//             internalMessages.scrollTop = internalMessages.scrollHeight;  
//         }
//     } else {
//         setTimeout(() => { instantImgSend(img); }, 100);
//     }
// }

const sendMessage = async (conversationID, senderID, message) => {
    messageInput.value = '';
    lastSentMessages.unshift(message);
    // Instantly show message sent
    // if (conversationLoaded) {
    //     instantMessageSend(message);
    // }
    // checkConversationsLoading = true;
    // Actually send message
    emitMessage(conversationID, { value: message, type: 'text', sender: senderID, date: Date.now() });
    // Update messages list for each user when theyre not in the conversation
    // const response = await fetch('/messages/sendmessage', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         conversationID,
    //         senderID,
    //         message,
    //         date: Date.now(),
    //         device: window.navigator.userAgent,
    //     })
    // });
    // const resJSON = await response.json();
    // checkConversationsLoading = false;
    // if (resJSON.status === 'success') {
    //     // loadConversation(conversationID);
    //     checkConversations();

    // } else {
    //     window.location.href = '/login';
    // }
}

sendImgIcon.addEventListener('click', () => {
    sendImgFile.click();
})

sendImgFile.addEventListener('change', (e) => {
    if (conversationLoaded) {
        // LOWER SIZE AND QUALITY OF IMG HERE
        const reader = new FileReader();
        reader.readAsDataURL(sendImgFile.files[0]);
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
                // instantImgSend(encodedSrc);
                sendImg(conversationLoaded, userID, encodedSrc);
            }
        }
    }
})

const sendImg = async (conversationID, senderID, message) => {
    // checkConversationsLoading = true;
    // Actually send img
    emitMessage(conversationID, { value: message, type: 'img', sender: senderID, date: Date.now() });
    // const response = await fetch('/messages/sendimg', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         conversationID,
    //         senderID,
    //         message,
    //         date: Date.now(),
    //         device: window.navigator.userAgent,
    //     })
    // });
    // const resJSON = await response.json();
    // checkConversationsLoading = false;
    // if (resJSON.status === 'success') {
    //     messageInput.value = '';
    //     // loadConversation(conversationID);
    //     checkConversations();
    // } else {
    //     window.location.href = '/login';
    // }    
    
}

editMessages.addEventListener('click', () => {
    messaging.classList.toggle('delete-mode');
    editMode ? editMode = false : editMode = true;
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.classList.toggle('active');
    });
});

const deleteText = (textDate) => {

    socket.emit('deleteMessage', {conversationID: conversationLoaded, textDate, userID});
    // checkConversationsLoading = true;
    // try {
    //     editMessages.style.visibility = 'hidden';
        
    //     const response = await fetch('/messages/deletetext', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             userID,
    //             textDate,
    //             conversationLoaded,
    //             device: window.navigator.userAgent,
    //         }),
    //     });
    //     const resJSON = await response.json();
    //     editMessages.style.visibility = 'visible';
    //     checkConversationsLoading = false;
    //     if (resJSON.status === 'unseccessful') {
    //         window.location.href = '/login';
    //     } else if (resJSON.status === 'wrong-user') {
    //         myAlert('You can only delete messages YOU send!');
    //     } else if (resJSON.status === 'success') {
    //         // await loadConversation(conversationLoaded);
    //         await checkConversations();
    //     }
    // } catch (err) {
    //     console.error(err);
    // }
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