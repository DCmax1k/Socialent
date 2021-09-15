//const socket = io();
// Join personal room to listen for new conversations
// socket.emit('joinUserRoom', { userID });


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
const messagingHeaderUser = document.querySelector('#messagingHeader > div');
const editMessages = document.getElementById('editMessages');
const userIsTyping = document.getElementById('userIsTyping');
const usernameTyping = document.getElementById('usernameTyping');
const currentUsersInChat = document.getElementById('currentUsersInChat');

let conversationLoaded = '';
let allConversations = [];
let conversation = {};
let editMode = false;
let conversationLoading = false;
let checkConversationsLoading = false;
let lastSentMessages = [];
let lastSentMessageIndex = -1;
let pastUserOrigin = '';
let pastMessageDate = 0;
let usersInChat = [];
let usersIdsInChat = [];


const usersFromDB = {};

// ** NEW CODE **

const formatUsersPrefix = (receiver) => {
    let prefix = '';
    if (receiver.prefix.title) {
        if (receiver.rank === 'owner') {
            prefix = `<p class="prefix owner" style="font-size: 15px;">[${receiver.prefix.title.split('')[0]}]</p> `
        } else if (receiver.rank === 'admin') {
            prefix = `<p class="prefix admin" style="font-size: 15px;">[${receiver.prefix.title.split('')[0]}]</p> `
        } else {
            prefix = `<p class="prefix" style="font-size: 15px;">[${receiver.prefix.title.split('')[0]}]</p> `;
        }
    }
    return prefix;
}
const formatUsersVerified = (receiver) => {
    let verified = '';
    if (receiver.verified) {
        verified = ` <img class="verified" src="/images//verified.svg" alt="Verified Logo">`;
    }
    return verified;
}

// Listen for new message
socket.on('message', ({message}) => {
    // // Show text on screen

    // Show users username in group
    let messageUserOriginHtml = '';
    if (message.sender !== userID) {
        if (pastUserOrigin != usersFromDB[message.sender].username) {
            messageUserOriginHtml = conversation.people.length > 2 ? message.sender !== userID ? `<div class="who-sent-message">${usersFromDB[message.sender].username}</div>` : '' : '';
            pastUserOrigin = usersFromDB[message.sender].username;
        }
    } else {
        pastUserOrigin = '';
    }

    // Show message date if longer than an hour ago
    let messageDateHTML = '';
    if (message.date - pastMessageDate >= 3600000) {
        const timeStringFirst = new Date(message.date).toLocaleTimeString();
        const dateSplit = timeStringFirst.split('');
        dateSplit.splice(dateSplit.length - 6, 3);
        const timeOfMessage = dateSplit.join('');
        const dateOfMessageFirst = new Date(message.date).toDateString();

        const dateOfMessage = dateOfMessageFirst + ', ' + timeOfMessage;
        messageDateHTML = `<div class="message-date">${dateOfMessage}</div>`;
        pastMessageDate = message.date;
    }

    const node = document.createElement('div');
    if (messageDateHTML !== '') {
        node.style.marginTop = '40px';
    } else if (messageUserOriginHtml !== '') {
        node.style.marginTop = '15px';
    }
    node.classList.add('text-box');
    node.setAttribute('data-text-date', message.date)
    if (message.sender === userID) {
        node.classList.add('sent-text');
    } else {
        node.classList.add('received-text');
    }
    if (message.type === 'img') {
        node.innerHTML = `
        <img src="${message.value}" class="text img" />
        <i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i>
        ${messageUserOriginHtml}
        ${messageDateHTML}
        `;
    } else {
        const newMessageValue = message.value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
        node.innerHTML = `
        <div class="text">
            ${newMessageValue}
            <i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i>
        </div>
        ${messageUserOriginHtml}
        ${messageDateHTML}
        `;
        
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

socket.on('updateConversationsWithMessage', ({messageData: message, conversationID, usersIds}) => {
    // Update conversations list so the message is correct, and is at top of list
    // find certain conversation
    let showNoti = usersIds.includes(userID) ? false : true;
    if (message.sender == userID) showNoti = false;
    const conversationNode = document.querySelector(`.conversation[data-conversation-id='${conversationID}']`);
    if (message.type == 'img') {
        conversationNode.children[1].innerText = 'Image';
    } else if (message.type == 'text') {
        conversationNode.children[1].innerText = message.value;
    }
    if (messagesList.children[0] != conversationNode) {
        messagesList.insertBefore(conversationNode, messagesList.children[0]);
    }
    if (showNoti) {
        conversationNode.children[2].classList.add('active');
    }

    // Update conversation object with new message
    // Find conversation
    const currentConversation = allConversations.find(conversation => conversation._id === conversationID);
    currentConversation.messages.push(message);
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

socket.on('addedConvo', ({senders, conversationID}) => {
    // Generate conversation html
    const receiversUser = senders;
    const node = document.createElement('div');
    node.classList.add('conversation');
    node.setAttribute('data-conversation-id', conversationID);
    // let prefixHTML = ``;
    // if (receiverUser.prefix.title) {
    //     if (receiverUser.rank === 'owner') {
    //     prefixHTML = `<p class="prefix owner">[${receiverUser.prefix.title.split('')[0]}]</p>`
    //     } else if (receiverUser.rank === 'admin') {
    //     prefixHTML = `<p class="prefix admin">[${receiverUser.prefix.title.split('')[0]}]</p>`
    //     } else {
    //     prefixHTML = `<p class="prefix">[${receiverUser.prefix.title.split('')[0]}]</p>`;
    //     }
    // }
    const titleHTML = `${receiversUser.map(receiver => /* ADD USERS PREFIX HERE */ formatUsersPrefix(receiver) + receiver.username + formatUsersVerified(receiver)).join(', ')}`;
    node.innerHTML = 
    `
        <h2>${titleHTML}</h2>
        <h4>Start Messaging!</h4>
        <i class="fas fa-circle notification active"></i>
    `;

    node.addEventListener('click', () => { clickedConversation(node) });
    messagesList.insertBefore(node, messagesList.children[0]);
});

socket.on('istyping', username => {
    // Show typing notification
    if (username.username != messageInput.getAttribute('data-user-username')) {
        userIsTyping.style.visibility = 'visible';
        usernameTyping.innerText = username.username;
    }
});
socket.on('stoppedtyping', username => {
    // Hide typing notification
    if (username.username != messageInput.getAttribute('data-user-username')) {
        userIsTyping.style.visibility = 'hidden';
    }
});

socket.on('joinConversation', ({users}) => {
    refreshCurrentUsers(users);
});
socket.on('leaveConversation', ({users}) => {
    refreshCurrentUsers(users);
});

// Refresh currents users list
const refreshCurrentUsers = (users) => {
    usersInChat = users.map(user => user == userID ? null : usersFromDB[user]).filter(user => user != null).map(user => user.username);
    usersIdsInChat = Object.keys(usersFromDB).filter(id => {
        if (usersInChat.includes(usersFromDB[id].username)) {
            return true;
        }
    });
    const userNodes = document.querySelectorAll(`#currentUsersInChat > .user-box`);
    userNodes.forEach(userNode => {
        if (usersInChat.includes(userNode.getAttribute('data-username'))) {
            userNode.style.color = 'lightgreen';
            userNode.style.border = '1px solid lightgreen';
        } else {
            userNode.style.color = 'rgb(138, 138, 138)';
            userNode.style.border = '1px solid rgb(138, 138, 138)';
        }
        
    });
};


// Send message
function emitMessage(conversationID, message) {
    // Message = { value: '', type: 'text', sender: userID, date: Date.now() };
    socket.emit('message', {conversationID, message, usersIdsInChat});

    // to update conversations list for those not currently in conversation
    // const currentConversation = allConversations.find(conversation => conversation._id === conversationID);
    conversation.people.forEach(person => {
        socket.emit('updateConversationsWithMessage', {person, messageData: message, conversationID, usersIdsInChat});
    });
};


// ** OLD CODE **

const pushIdsToUsers = async (ids) => {
    return Promise.all(ids.map(async receiverID => {
        if (usersFromDB[receiverID]) {
            return usersFromDB[receiverID];
            
        } else {
            const getReceiverUser = await lookupUsername(receiverID);
            usersFromDB[receiverID] = getReceiverUser;
            return getReceiverUser;
        }
    }));
}

const renderTexts = (conversationIdLoading) => {
        const previousHTML = internalMessages.innerHTML;
        // Removes previous html
        internalMessages.innerHTML = '';
        // Loops through messages generating html
        // Reset saved variables
        pastMessageDate = 0;
        pastUserOrigin = '';
        const currentConversation = allConversations.find(conversation => conversation._id == conversationIdLoading);
        currentConversation.messages.forEach((message, i) => {
            let messageUserOriginHtml = '';
            if (message.sender !== userID) {
                if (pastUserOrigin != usersFromDB[message.sender].username) {
                    messageUserOriginHtml = currentConversation.people.length > 2 ? message.sender !== userID ? `<div class="who-sent-message">${usersFromDB[message.sender].username}</div>` : '' : '';
                    pastUserOrigin = usersFromDB[message.sender].username;
                }
            } else {
                pastUserOrigin = '';
            }



            let messageDateHTML = '';
            if (message.date - pastMessageDate >= 3600000) {
                const timeStringFirst = new Date(message.date).toLocaleTimeString();
                const dateSplit = timeStringFirst.split('');
                dateSplit.splice(dateSplit.length - 6, 3);
                const timeOfMessage = dateSplit.join('');
                const dateOfMessageFirst = new Date(message.date).toDateString();

                const dateOfMessage = dateOfMessageFirst + ', ' + timeOfMessage;
                messageDateHTML = `<div class="message-date">${dateOfMessage}</div>`;
                pastMessageDate = message.date;
            }


            const node = document.createElement('div');


            if (messageDateHTML !== '') {
                node.style.marginTop = '40px';
            } else if (messageUserOriginHtml !== '') {
                node.style.marginTop = '15px';
            }
            node.classList.add('text-box');
            node.setAttribute('data-text-date', message.date)
            if (message.sender === userID) {
                node.classList.add('sent-text');
            } else {
                node.classList.add('received-text');
            }
            if (message.type === 'img') {
                node.innerHTML = `
                <img src="${message.value}" class="text img" />
                <i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i>
                ${messageUserOriginHtml}
                ${messageDateHTML}
                `;
            } else {
                const newMessageValue = message.value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
                node.innerHTML = `
                <div class="text">
                    ${newMessageValue}
                    <i class="fas fa-minus-circle delete-btn ${editMode ? 'active' : ''}" data-text-date="${message.date}" data-text-type="${message.type}"></i>
                </div>
                ${messageUserOriginHtml}
                ${messageDateHTML}
                `;
                
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

        // currently in chat users
        currentUsersInChat.innerHTML = '';
        const receiversInChat = currentConversation.people.filter(user => user != userID);
        receiversInChat.forEach(user => {
            const userNode = document.createElement('div');
            userNode.classList.add('user-box');
            userNode.setAttribute('data-username', usersFromDB[user].username);
            userNode.innerText = usersFromDB[user].username;
            if (usersInChat.includes(usersFromDB[user].username)) {
                userNode.style.color = 'lightgreen';
                userNode.style.border = '1px solid lightgreen';
            } else {
                userNode.style.color = 'rgb(138, 138, 138)';
                userNode.style.border = '1px solid rgb(138, 138, 138)';
            }

            currentUsersInChat.appendChild(userNode);
        });

}

// Check for Conversations *Right when page loads*
const checkConversations = async () => {
    try {
        // checkConversationsLoading = true;
        conversationLoader.classList.add('active');
        const response = await fetch('/messages/checkconversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID,
                //conversationLoaded,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {

            // Generate html for each conversation
            messagesList.innerHTML = '';
            allConversations = resJSON.usersConversations;
            resJSON.usersConversations.forEach(async (conversation, i) => {
                let receiversID = [];
                conversation.people.forEach(person => {
                    if (person != userID) {
                        receiversID.push(person);
                    }
                });

                const receiversUser = await pushIdsToUsers(receiversID);


                const node = document.createElement('div');
                node.classList.add('conversation');
                if (conversation._id === conversationLoaded) {
                    node.classList.add('active');
                }
                node.setAttribute('data-conversation-id', conversation._id);
                node.setAttribute('data-conversation-date-active', conversation.dateActive);

                const titleHTML = `${receiversUser.map(receiver => /* ADD USERS PREFIX HERE */ formatUsersPrefix(receiver) + receiver.username + formatUsersVerified(receiver)).join(', ')}`;
                node.innerHTML = 
                `
                    <h2>${titleHTML}</h2>
                    <h4>${conversation.messages[0] ? conversation.messages[conversation.messages.length - 1].type === 'img' ? 'Image' : conversation.messages[conversation.messages.length - 1].value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;') : 'Start Messaging!'}</h4>
                    <i class="fas fa-circle notification ${conversation.seenFor.includes(userID) == true ? 'active' : ''}"></i>
                `;

                node.addEventListener('click', () => { clickedConversation(node) });
                

                messagesList.append(node);

                // Sort the conversations based on data-conversation-date-active
                [...messagesList.children].sort((a, b) => b.getAttribute('data-conversation-date-active') - a.getAttribute('data-conversation-date-active')).forEach(node => messagesList.append(node));


                if (conversationLoaded) {
                    renderTexts(conversationLoaded);
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
        
    } catch(err) {
        console.error(err);
    }    
    
    
}

// Make name of conversation clickable
messagingHeaderUser.addEventListener('click', () => {
    // const names = messagingHeaderUser.children[0].innerText.split(' ');
    // const usernamesSaved = Object.values(usersFromDB);;
    // const filtered = names.map(name => {
    //     const query = usernamesSaved.find((obj) => {
    //         return obj.username == name;
    //     });
    //     return query;
    // }).filter(user => user !== undefined);
    // if (filtered.length == 1) {
    //     window.location.href = '/account/' + filtered[0].username;
    // }
    if (conversation.people.length == 2) {
        const othersUsername = usersFromDB[conversation.people.find(person => person != userID)].username;
        window.location.href = '/account/' + othersUsername;
    }
});

const seeConversation = (conversationObj) => {
    fetch('/messages/seeconversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversation: {
                _id: conversationObj._id,
                seenFor: conversationObj.seenFor,
            },
        }),
    });
}

// Function for click on conversation - Listener added when the element is created
const clickedConversation = (conversationNode) => {
    const conversationID = conversationNode.getAttribute('data-conversation-id');
        if (conversationLoaded === conversationID) {
            messageInput.style.visibility = 'hidden';
            sendMessageBtn.style.visibility = 'hidden';
            sendImgBtn.style.visibility = 'hidden';
            messagingHeader.style.visibility = 'hidden';
            currentUsersInChat.style.visibility = 'hidden';
            socket.emit('leaveConversation', { conversationID, userID });
            conversationLoaded = '';
            let tempConversations = document.querySelectorAll('.conversation');
            tempConversations.forEach(conversation2 => {
                conversation2.classList.remove('active');
            });
            internalMessages.innerHTML = '';

            // checkConversations();
            // renderTexts(conversationID);
        } else {
            conversation = allConversations.find(conversation => conversation._id === conversationID);
            seeConversation(conversation);
            conversationNode.children[2].classList.remove('active');
            messageInput.style.visibility = 'visible';
            sendMessageBtn.style.visibility = 'visible';
            sendImgBtn.style.visibility = 'visible';
            messagingHeader.style.visibility = 'visible';
            currentUsersInChat.style.visibility = 'visible';
            socket.emit('leaveConversation', { conversationID: conversationLoaded, userID });
            socket.emit('joinConversation', { conversationID, userID });
            conversationLoaded = conversationID;

            let tempConversations = document.querySelectorAll('.conversation');
            tempConversations.forEach(conversation2 => {
                conversation2.classList.remove('active');
            });
            tempConversations.forEach(conversation1 => {
                if (conversation1.getAttribute('data-conversation-id') == conversationID) {
                    conversation1.classList.add('active');

                    // Set header user
                    messagingHeaderUser.innerHTML = conversation1.children[0].outerHTML;
                }
            }); 
            // checkConversations();
            renderTexts(conversationID);
        }
}


// Add conversation

const clearString = (string) => string.replace(/,/ig, ' ').replace(/\s+/g, ' ').trim();

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
        const cleanString = clearString(addConversationInput.value);
        const receivers = cleanString.split(' ');
        addConversationSubmit.innerText = 'Loading...';
        addConversationDiv.classList.remove('active');
        const response = await fetch('/messages/addconversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID,
                receivers,
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
            const receiversUser = resJSON.receivers;
            const node = document.createElement('div');
            node.classList.add('conversation');
            node.setAttribute('data-conversation-id', resJSON.conversationID);
            // let prefixHTML = ``;
            // if (receiverUser.prefix.title) {
            //     if (receiverUser.rank === 'owner') {
            //     prefixHTML = `<p class="prefix owner">[${receiverUser.prefix.title.split('')[0]}]</p>`
            //     } else if (receiverUser.rank === 'admin') {
            //     prefixHTML = `<p class="prefix admin">[${receiverUser.prefix.title.split('')[0]}]</p>`
            //     } else {
            //     prefixHTML = `<p class="prefix">[${receiverUser.prefix.title.split('')[0]}]</p>`;
            //     }
            // }
            const titleHTML = `${receiversUser.map(receiver => /* ADD USERS PREFIX HERE */ formatUsersPrefix(receiver) + receiver.username + formatUsersVerified(receiver)).join(', ')}`;
            node.innerHTML = 
            `
            <h2>${titleHTML}</h2>
            <h4>Start Messaging!</h4>
            <i class="fas fa-circle notification active"></i>
            `;

            node.addEventListener('click', () => { clickedConversation(node) });
            messagesList.insertBefore(node, messagesList.firstChild);

            addConversationSubmit.innerText = 'Add';
            addConversationInput.value = '';
            resJSON.receivers.forEach(receiver => {
                const senders = [resJSON.sender, ...receiversUser];
                // remove receiver from senders
                senders.splice(senders.indexOf(receiver), 1);
                socket.emit('addedConvo', { receiver: receiver._id, conversationID: resJSON.conversationID, senders, });
            });
        } else if (resJSON.status === 'error') {
            myAlert(resJSON.message);
            addConversationSubmit.innerText = 'Add';

        } else {
            window.location.href = '/login';
        }    
    }
       
}

// Add conversation search for user
addConversationInput.addEventListener('input', async (e) => {
    try {
      if (e.target.value) {
        const cleanString = clearString(addConversationInput.value);
        const response = await fetch('/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: cleanString.split(' ')[cleanString.split(' ').length - 1],
            userID,
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
    const cleanString = clearString(addConversationInput.value);
    const inputArray = cleanString.split(' ');
    inputArray[inputArray.length - 1] = username;
    addConversationInput.value = inputArray.join(', ');
    addConversationInput.select();
}
  
// Send message
messageInput.addEventListener('keyup', (e) => {
    // Listen for action keys
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
    // Emit to tell users when typing
    if (e.target.value) {
        socket.emit('istyping', { conversationID: conversationLoaded, username: e.target.getAttribute('data-user-username')});
    } else {
        socket.emit('stoppedtyping', { conversationID: conversationLoaded, username: e.target.getAttribute('data-user-username')});
    }

});

sendMessageBtn.addEventListener('click', () => {
    if (conversationLoaded) {
        sendMessage(conversationLoaded, userID, messageInput.value);
    }
});

const sendMessage = async (conversationID, senderID, message) => {
    messageInput.value = '';
    lastSentMessages.unshift(message);

    emitMessage(conversationID, { value: message, type: 'text', sender: senderID, date: Date.now() });

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
                const MAX_LENGTH = 1080;
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
                sendImg(conversationLoaded, userID, encodedSrc, sendImgFile.files[0].name);
            }
        }
    }
})

const sendImg = async (conversationID, senderID, encodedSrc, fileName) => {

    // Send img to db
    // Convert dataURI to blob
    const byteString = atob(encodedSrc.split(',')[1]);

    // separate out the mime component
    const mimeString = encodedSrc.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);

    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    // give blob file name
    const blob =  new Blob([ab], {
      type: mimeString,
    });

    // Send url to DB
    let formData = new FormData()
    formData.append('file', blob);
    formData.append('filename', fileName);

    const options = {
        method: 'POST',

        body: formData,
    }
    // LOADING...
    const res = await fetch('/messages/saveimage', options);
    const resJSON = await res.json();
    if (resJSON.status == 'success') {
        // Actually send img
        emitMessage(conversationID, { value: resJSON.imgURL, type: 'img', sender: senderID, date: Date.now() });
    } else {
        myAlert(resJSON.status);
    }
    
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

}

// Animate dots for when someone is typing
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let currentDot = 0;
let dotSpeed =  250;
const dot1 = document.getElementById('dot1');
const dot2 = document.getElementById('dot2');
const dot3 = document.getElementById('dot3');

const animateDots = async () => {
    if (currentDot == 0) {
        await sleep(dotSpeed);
        dot1.style.display = 'inline-block';
        currentDot++;
        animateDots();
    } else if (currentDot == 1) {
        await sleep(dotSpeed);
        dot2.style.display = 'inline-block';
        currentDot++;
        animateDots();
    } else if (currentDot == 2) {
        await sleep(dotSpeed);
        dot3.style.display = 'inline-block';
        currentDot++;
        animateDots();
    } else if (currentDot == 3) {
        await sleep(dotSpeed + 300);
        currentDot = 0;
        dot1.style.display = 'none';
        dot2.style.display = 'none';
        dot3.style.display = 'none';
        animateDots();
    }
}
animateDots();

checkConversations();