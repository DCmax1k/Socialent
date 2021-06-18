const express = require('express');
// const { update } = require('../models/Conversation');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');

// const Conversation = require('../models/Conversation');
// const User = require('../models/User');

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
            if (user.status == 'online') {
                if (req.body.fromApp) return res.json({user});
                res.render('messages', { user })
            } else {
             res.redirect('/login');
            }
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
            if (user.status == 'online') {
                return res.json({user});

            } else {
             res.redirect('/login');
            }
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
        if (user.status === 'online') {
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
        } else {
            res.json({
                status: 'unseccessful',
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
        if (user.status === 'online') {
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
                                    receiverUsername: receiver.username,
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
            
        } else {
            res.json({
                status: 'unseccessful',
            });
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
        if (user.status === 'online') {
            if (req.body.conversationLoaded) {
                const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationLoaded).get()).docs[0];
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
            });
        } else {
            res.json({
                status: 'unseccessful',
            });
        }
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
  router.post('/sendmessage', postAuthToken, async (req, res) => {
    try {
      // const user = await User.findById(req.body.senderID);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      if (user.status === 'online') {
        // const conversation = await Conversation.findById(req.body.conversationID);
        const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationID).get()).docs[0].data();
        // currentMessages = conversation.messages;
        // currentMessages.push({ sender: user._id, value: req.body.message, type: 'text', date: req.body.date, seen: 'unread'});
        // const updateMessage = await Conversation.findByIdAndUpdate(req.body.conversationID, {dateActive: req.body.date,  messages: currentMessages }, { useFindAndModify: false });
        const messageData = { sender: user._id, value: req.body.message, type: 'text', date: req.body.date };
        const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({messages: [...conversation.messages, messageData], dateActive: req.body.date, seen: 'unread', seenFor: conversation.people[0] === user._id ? conversation.people[1] : conversation.people[0] });

        // Add 1 point to score
        let usersScore = user.score;
        usersScore += 1;
        // const updateScore = await User.findByIdAndUpdate(user._id, { score: usersScore }, { useFindAndModify: false });
        const updateScore = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
        // const saveScore = await updateScore.save();
        res.json({
            status: 'success',
            message: req.body.message,
        });
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Send img
  router.post('/sendimg', postAuthToken, async (req, res) => {
    try {
      // const user = await User.findById(req.body.senderID);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      if (user.status === 'online') {
        // const updateMessage = await Conversation.findByIdAndUpdate(req.body.conversationID, { dateActive: req.body.date, $push: { messages: {sender: user._id, value: req.body.message, type: 'img', date: req.body.date, seen: 'unread'} }}, { useFindAndModify: false });
        const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationID).get()).docs[0].data();
        const messageData = { sender: user._id, value: req.body.message, type: 'img', date: req.body.date };
        const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({messages: [...conversation.messages, messageData], dateActive: req.body.date, seen: 'unread', seenFor: conversation.people[0] === user._id ? conversation.people[1] : conversation.people[0] });

        // Add 1 point to score
        let usersScore = user.score;
        usersScore += 1;
        // const updateScore = await User.findByIdAndUpdate(user._id, { score: usersScore }, { useFindAndModify: false });
        const updateScore = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
        // const saveScore = await updateScore.save();
        res.json({
            status: 'success',
            message: req.body.message,
        });
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Delete text 
  router.post('/deletetext', postAuthToken, async (req, res) => {
      try {
        // const user = await User.findById(req.body.userID);
        const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
        if (user.status === 'online') {
            // const conversation = await Conversation.findById(req.body.conversationLoaded);
            const conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationLoaded).get()).docs[0].data();
            const currentText = conversation.messages[conversation.messages.length - req.body.textIndex];
            if (currentText.sender === user._id) {
                const allMessages = conversation.messages;
                allMessages.splice(allMessages.length - req.body.textIndex, 1);
                // const updateConversation = await Conversation.findByIdAndUpdate(conversation._id, { $set: { messages: allMessages }}, { useFindAndModify: false });
                const updateConversation = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update('messages', allMessages);
                res.json({
                    status: 'success',
                });
            } else {
                res.json({
                    status: 'wrong-user',
                });
            }
        } else {
            res.json({
                status: 'unseccessful',
            });
        }
      } catch(err) {
          console.error(err);
      }
  });

module.exports = router;