const express = require('express');
// const { update } = require('../models/Conversation');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');

const server = require('../server.js');
const socketio = require('socket.io');
const io = socketio(server);

io.on('connection', (socket) => {
    console.log('user connected');
    // Join own personal user room to listen for new conversations
    socket.on('joinUserRoom', ({ userID }) => {
        socket.join(userID);
    });
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
      socket.join(conversationID);


    });

    // Leave conversation
    socket.on('leaveConversation', ({conversationID}) => {
      console.log('Left conversation ' + conversationID);
      socket.leave(conversationID);
    });

    // Get sent message, log to DB, and send back to correct chat room
    socket.on('message', ({conversationID, message}) => {
        sendMessage(conversationID, message);
        io.to(conversationID).emit('message', {message, conversationID});
    });
    socket.on('updateConversationsWithMessage', ({person, messageData, conversationID}) => {
        io.to(person).emit('updateConversationsWithMessage', {messageData, conversationID});
    });

    // Get delete message request, delete message from DB, and send info to chat room
    socket.on('deleteMessage', ({conversationID, textDate, userID}) => {
        deleteMessage(conversationID, textDate, userID);
        io.to(conversationID).emit('deleteMessage', textDate);
    });

    // Send created conversation to user
    socket.on('addedConvo', ({receiver, conversationID, sender}) => {

        io.to(receiver._id).emit('addedConvo', {sender, conversationID});
    })
  
});

// GET Route
router.get('/', authToken, async (req, res) => {
    try {
            // const user = await User.findById(req.query.k);
            const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
            // const usersConversations = [];
            // (await Conversation.find({})).forEach(conversation => {
            //     if (conversation.people.includes(user._id)) {
            //         usersConversations.push(conversation);
            //     }
            // });
            // Set Last Online
            const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());

                if (req.body.fromApp) return res.json({user});
                res.render('messages', { user })

    } catch(err) {
        console.error(err);
    }
    
});
router.post('/getfromapp', postAuthToken, async (req, res) => {
    try {
            // const user = await User.findById(req.query.k);
            const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
            // const usersConversations = [];
            // (await Conversation.find({})).forEach(conversation => {
            //     if (conversation.people.includes(user._id)) {
            //         usersConversations.push(conversation);
            //     }
            // });
            // Set Last Online
            const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());

                return res.json({user});


    } catch(err) {
        console.error(err);
    }
    
});

function authToken(req, res, next) {
    const token = req.cookies['auth-token'];
    if (token == null) return res.redirect('/login');
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    })
}

// ALL POST REQUEST AUTHORIZATION
function postAuthToken(req, res, next) {
    const token = req.cookies['auth-token'] || req.body.auth_token;
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }

// Load Conversation
router.post('/loadconversation', postAuthToken, async (req, res) => {
    try {
        // const user = await User.findById(req.body.userID);
        const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

            // const conversation = await Conversation.findById(req.body.conversationID);
            const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationID).get()).docs[0].data();
            // const allMessages = conversation.messages;
            // allMessages.forEach(message => {
            //     if (message.seen === 'unread' && JSON.stringify(message.sender) !== JSON.stringify(user._id)) {
            //         message.seen = 'read';
            //     }
            // });
            // const updateMessages = await Conversation.findByIdAndUpdate(conversation._id, { messages: allMessages }, { useFindAndModify: false });
            if (conversation.seenFor === user._id) {
                const setSeen = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0];
                if (setSeen) { setSeen.ref.update('seen', 'read')};
            }
            
            // Crop messages
            if (conversation.messages.length > 55) {
                const croppedMessages = conversation.messages.splice(conversation.messages.length - 50, 50)
                res.json({
                    status: 'success',
                    messages: croppedMessages,
                });
            } else {
                res.json({
                    status: 'success',
                    messages: conversation.messages,
                });
            }

    } catch(err) {
        console.error(err);
    }
});

// ADD conversation
router.post('/addconversation', postAuthToken, async (req, res) => {
    try {
        // const user = await User.findById(req.body.userID);
        const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

            if (req.body.receiver) {
                // const receiver = await User.findOne({ username: req.body.receiver });
                let receiver = (await db.collection('users').where('username', '==', req.body.receiver).get()).docs[0];
                // Check if receiver exists
                if (receiver) {
                       receiver = receiver.data();
                       if (receiver._id !== user._id) {
                       // Check to see if they already have a conversation
                        // const check1 = await Conversation.find({people: [user._id, receiver._id]});
                        // const check2 = await Conversation.find({people: [receiver._id, user._id]});
                        const check1 = (await db.collection('conversations').where('people', '==', [user._id, receiver._id]).get()).docs.map(doc => doc.data());
                        const check2 = (await db.collection('conversations').where('people', '==', [receiver._id, user._id]).get()).docs.map(doc => doc.data());
                        if (check1.length == 0 && check2.length == 0) {

                                // const createConversation = await new Conversation({people: [user._id, receiver._id],messages: [],});
                                // const saveConversation = await createConversation.save();
                                const convoData = {
                                    _id: Date.now().toString(16) + Math.random().toString(16).slice(2),
                                    people: [user._id, receiver._id],
                                    messages: [],
                                    seen: 'read',
                                    seenFor: user._id,
                                    dateActive: Date.now(),
                                };
                                const createConversation = await db.collection('conversations').doc(`${user.username}, ${receiver.username}`).set(convoData);

                                const conversationID = convoData._id;
                                res.json({
                                    status: 'success',
                                    receiver: receiver,
                                    sender: user,
                                    conversationID,
                                });    
                        } else {
                            res.json({
                                status: 'already-convo',
                            });
                        }  
                    
                     
                } else {
                    res.json({
                        status: 'yourself',
                    });
                }     
                }  else {
                    res.json({
                        status: 'no-user',
                    });
                }  
                
            }
            

    } catch(err) {
        console.error(err);
    }
});

// Check for conversations
router.post('/checkconversations', postAuthToken, async (req, res) => {
    try {
        // const user = await User.findById(req.body.userID);
        const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
        let conversation;
        if (req.body.conversationLoaded) {
            conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationLoaded).get()).docs[0];
            if (conversation.data().seenFor === user._id) {
                await conversation.ref.update('seen', 'read');
            }
        }
        // const usersConversations = await Conversation.find({people: user._id});
        const usersConversations = (await db.collection('conversations').where('people', 'array-contains', user._id).get()).docs.map(doc => doc.data());
        usersConversations.sort((a,b) => {
            return a.dateActive - b.dateActive;
        });
        res.json({
            status: 'success',
            usersConversations,
            userID: user._id,
            conversation: conversation ? conversation.data() : {},
        });

    } catch(err) {
        console.error(err);
    }
});

// Lookup Username
router.post('/lookupusername', postAuthToken, async (req, res) => {
    try {
      // const receiver = await User.findById(req.body.receiverID);
      const receiver = (await db.collection('users').where('_id', '==', req.body.receiverID).get()).docs[0].data();
      res.json({
        username: receiver.username,
        prefix: receiver.prefix,
        rank: receiver.rank,
      });
    } catch(err) {
      console.error(err);
    }
  })

  // Send message
  const sendMessage = async (conversationID, message) => {
    try {
      const user = (await db.collection('users').where('_id', '==', message.sender).get()).docs[0].data();
        const conversation = (await db.collection('conversations').where('_id', '==', conversationID).get()).docs[0].data();
        const messageData = message;
        const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({messages: [...conversation.messages, messageData], dateActive: message.date, seen: 'unread', seenFor: conversation.people[0] === user._id ? conversation.people[1] : conversation.people[0] });

        // Add 1 point to score
        let usersScore = user.score;
        usersScore += 1;
        // const updateScore = await User.findByIdAndUpdate(user._id, { score: usersScore }, { useFindAndModify: false });
        await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
      
    } catch(err) {
      console.error(err);
    }
  }


//   // Send img
//   router.post('/sendimg', postAuthToken, async (req, res) => {
//     try {
//       // const user = await User.findById(req.body.senderID);
//       const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

//         // const updateMessage = await Conversation.findByIdAndUpdate(req.body.conversationID, { dateActive: req.body.date, $push: { messages: {sender: user._id, value: req.body.message, type: 'img', date: req.body.date, seen: 'unread'} }}, { useFindAndModify: false });
//         const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationID).get()).docs[0].data();
//         const messageData = { sender: user._id, value: req.body.message, type: 'img', date: req.body.date };
//         const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({messages: [...conversation.messages, messageData], dateActive: req.body.date, seen: 'unread', seenFor: conversation.people[0] === user._id ? conversation.people[1] : conversation.people[0] });

//         // Add 1 point to score
//         let usersScore = user.score;
//         usersScore += 1;
//         // const updateScore = await User.findByIdAndUpdate(user._id, { score: usersScore }, { useFindAndModify: false });
//         const updateScore = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
//         // const saveScore = await updateScore.save();
//         res.json({
//             status: 'success',
//             message: req.body.message,
//         });
      
//     } catch(err) {
//       console.error(err);
//     }
//   });

  // Delete text 

  const deleteMessage = async (conversationID, textDate, userID) => {
    try {
        const user = (await db.collection('users').where('_id', '==', userID).get()).docs[0].data();
        const conversation = (await db.collection('conversations').where('_id', '==', conversationID).get()).docs[0].data();
        const messages = conversation.messages;
        // find message
        const message = messages.find(message => message.date == textDate);
        // find index of message in messages
        const index = messages.indexOf(message);
        // remove message from messages
        messages.splice(index, 1);
        const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({messages: messages, seenFor: conversation.people[0] === user._id ? conversation.people[1] : conversation.people[0] });
      
    } catch(err) {
      console.error(err);
    }
  }

//   router.post('/deletetext', postAuthToken, async (req, res) => {
//       try {
//         // const user = await User.findById(req.body.userID);
//         const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

//             // const conversation = await Conversation.findById(req.body.conversationLoaded);
//             const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationLoaded).get()).docs[0].data();
//             console.log(req.body.textDate);
//             const currentText = conversation.messages.find(message => message.date == req.body.textDate);
//             const cutIndex = conversation.messages.indexOf(currentText);
//             if (currentText.sender === user._id) {
//                 const allMessages = conversation.messages;
//                 allMessages.splice(cutIndex, 1);
//                 const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update('messages', allMessages);
//                 res.json({
//                     status: 'success',
//                 });
//             } else {
//                 res.json({
//                     status: 'wrong-user',
//                 });
//             }

//       } catch(err) {
//           console.error(err);
//       }
//   });

module.exports = router;