const express = require('express');
// const { update } = require('../models/Conversation');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');

const server = require('../server');
const socketio = require('socket.io');
const io = socketio(server);

const { sendMessage, deleteMessage, pushMessage } = require('../routes/messages');
const { getRoomUsers, joinRoom, leaveRoom  } = require('./messageRooms');
const { warnUser } = require('../routes/admin');
const { signon, signoff, getUsersOnline } = require('./currentlyOnline');

io.on('connection', (socket) => {
    console.log('user connected');
    // Join own personal user room to listen for new conversations
    socket.on('joinUserRoom', ({ userID }) => {

        socket.join(userID);

        // * Currently Online Status *

        // Signon
        signon(userID);
        io.emit('currentlyOnline', {usersLength: getUsersOnline().length});
    });


    // * MESSAGES *

    // Join conversation
    socket.on('joinConversation', async ({conversationID, userID, auth_token}) => {
      console.log('Joined converstaion ' + conversationID);
      // Authorize user
      const token = socket.request.headers.cookie.split('').splice(11).join('') || auth_token;
      let verified = true;
      if (token == null) return verified = false;
      jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
          if (err) return verifed = false;
      });
      if (!verified) return;
      const conversation = (await db.collection('conversations').where('_id', '==', conversationID).get()).docs[0].data();
      if (!conversation.people.includes(userID)) return;

      // Actual join here
      socket.join(conversation._id);
      joinRoom(conversation._id, userID);

      io.to(conversationID).emit('joinConversation', {users: getRoomUsers(conversation._id)});


    });

    // Leave conversation
    socket.on('leaveConversation', ({conversationID, userID}) => {
      console.log('Left conversation ' + conversationID);
      socket.leave(conversationID);

      leaveRoom(conversationID, userID);
      io.to(conversationID).emit('leaveConversation', {users: getRoomUsers(conversationID)});
    });

    // Get sent message, log to DB, and send back to correct chat room
    socket.on('message', ({conversationID, message, usersIdsInChat}) => {
        sendMessage(conversationID, message, usersIdsInChat);
        io.to(conversationID).emit('message', {message});
    });
    socket.on('updateConversationsWithMessage', ({person, messageData, conversationID, usersIdsInChat}) => {
        io.to(person).emit('updateConversationsWithMessage', {messageData, conversationID, usersIds: usersIdsInChat});
        const usersOnline = getUsersOnline();
        if (!usersOnline.includes(person)) {
            if (messageData.sender != person) {
                pushMessage(person, messageData);
            }
        }
    });
    socket.on('updateConversationsWithDeletedMessage', ({person, messageData, conversationID}) => {
        io.to(person).emit('updateConversationsWithDeletedMessage', {messageData, conversationID});
    })

    // Get delete message request, delete message from DB, and send info to chat room
    socket.on('deleteMessage', ({conversationID, textDate, userID}) => {
        deleteMessage(conversationID, textDate, userID);
        io.to(conversationID).emit('deleteMessage', textDate);
    });

    // Send created conversation to user
    socket.on('addedConvo', ({receiver, conversationID, senders}) => {

        io.to(receiver).emit('addedConvo', {senders, conversationID});
    });

    // Show typing notification
    socket.on('istyping', ({conversationID, username}) => {
        io.to(conversationID).emit('istyping', {username});
    });

    // Hide typing notification
    socket.on('stoppedtyping', ({conversationID, username}) => {  
        io.to(conversationID).emit('stoppedtyping', {username});
    });

    // * ADMIN *

    // Warn user from admin page to home page
    socket.on('warnUser', ({adminID, userID, warning}) => {
        warnUser(adminID, userID, warning);
        io.to(userID).emit('warnUser', {warning});
    });

    //
    //

    socket.on('disconnecting', async () => {
        console.log('user disconnected');
        // Notify users that user has left the conversation
        const setIter = socket.rooms.values();
        const socketID = setIter.next().value;
        const usersID = setIter.next().value;
        const convoID = setIter.next().value;

        // Leave conversation
        if (convoID) {
            leaveRoom(convoID, usersID);
            io.to(convoID).emit('leaveConversation', {users: getRoomUsers(convoID)});
        }

        // Remove user from currently online list
        signoff(usersID);
        io.emit('currentlyOnline', {usersLength: getUsersOnline().length});
        // Set last seen in db
        if (usersID) {
            await (await db.collection('users').where('_id', '==', usersID).get()).docs[0].ref.update('lastOnline', Date.now());
        }
        

    });
});

module.exports = router;