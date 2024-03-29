const express = require('express');
// const { update } = require('../models/Conversation');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');
const push = require('web-push');
const webPushPublicKey = 'BMYNc0LpoUTcG2Qwg9tHgXDDrPGqYovkmEKDcHeJ_CQZA5X7P_UE5jZrYBsEDK_JgrMMCvE0RhjDvQPzKN-JPI0';
const webPushPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY;

push.setVapidDetails('mailto:help@socialentapp.com', webPushPublicKey, webPushPrivateKey);

const { getStorage, ref, deleteObject, uploadBytes } = require('firebase/storage');
const storage = getStorage();
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 10,

  },
}).single("file");

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
            // const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());

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
            // const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());

                return res.json({user});


    } catch(err) {
        console.error(err);
    }
    
});

function authToken(req, res, next) {
    const token = req.cookies['auth-token'];
    if (token == null) return res.redirect('/login?rd=messages');
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
            if (conversation.seenFor.includes(user._id)) {
                const setSeen = await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({'seenFor': firebase_admin.firestore.FieldValue.arrayRemove(user._id)});
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
        // remove duplicates from req.body.receivers
        let receivers = [...new Set(req.body.receivers)];
        receivers = receivers.filter(receiver => receiver !== user.username);

        if (receivers.length != 0) {
            // const receiver = await User.findOne({ username: req.body.receiver });
            let noUserExist = '';
            receivers = await Promise.all(receivers.map( async receiver => {
                if (receiver) {
                    const find = (await db.collection('users').where('username', '==', receiver).get()).docs[0];
                    return find ? find.data() : noUserExist = receiver;
                }
            }));
            if (noUserExist) return res.json({status: 'error', message: `'${noUserExist}' is not a valid user, please correct your spelling and try again!`});
            // let receiver = (await db.collection('users').where('username', '==', req.body.receiver).get()).docs[0];
            // Check if receiver exists
            if (receivers) {
                const people = [user._id, ...receivers.map(receiver => receiver._id)];
                const convoID = Date.now().toString(16) + Math.random().toString(16).slice(2);
                const convoData = {
                    _id: convoID,
                    people,
                    messages: [],
                    seenFor: receivers.map(receiver => receiver._id),
                    dateActive: Date.now(),
                };
                await db.collection('conversations').doc(`${user.username}, ${receivers[0].username}${receivers.length > 1 ? ', and more...' : ''} ${convoID}`).set(convoData);

                const conversationID = convoData._id;
                res.json({
                    status: 'success',
                    receivers: receivers,
                    sender: user,
                    conversationID,
                });    

            }  else {
                res.json({
                    status: 'no-user',
                });
            }  
            
        } else {
            res.json({
                status: 'error',
                message: 'Must have at least 1 receiver',
            });
        }  
            

    } catch(err) {
        console.error(err);
    }
});

router.post('/seeconversation', postAuthToken, async (req, res) => {
    try {
        const conversation = req.body.conversation;
        const user = req.user;
        if (conversation.seenFor.includes(user._id)) {
            (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({'seenFor': firebase_admin.firestore.FieldValue.arrayRemove(user._id)});
        }
        res.json({
            status: 'success',
        });
    } catch(err) {
        console.error(err);
    }
});

// Check for conversations
router.post('/checkconversations', postAuthToken, async (req, res) => {
    try {
        // const user = await User.findById(req.body.userID);
        const user = req.user;// (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
        // let conversation;
        // if (req.body.conversationLoaded) {
        //     conversation = (await db.collection('conversations').where('_id', '==', req.body.conversationLoaded).get()).docs[0];
        //     if (conversation.data().seenFor.includes(user._id)) {
        //         await (await db.collection('conversations').where('_id', '==', conversation.data()._id).get()).docs[0].ref.update({'seenFor': firebase_admin.firestore.FieldValue.arrayRemove(user._id)});
        //     }
        // }
        // const usersConversations = await Conversation.find({people: user._id});
        const usersConversations = (await db.collection('conversations').where('people', 'array-contains', user._id).get()).docs.map(doc => doc.data());
        usersConversations.sort((a,b) => {
            return a.dateActive - b.dateActive;
        });
        res.json({
            status: 'success',
            usersConversations,
            userID: user._id,
            //conversation: conversation ? conversation.data() : {},
        });

    } catch(err) {
        console.error(err);
    }
});

// Side nav bar checking for notifications
router.post('/checkmessagenotis', postAuthToken, async (req, res) => {
    try {

        // const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

        const usersConversations = (await db.collection('conversations').where('seenFor', 'array-contains', req.user._id).get()).docs.map(doc => doc.data());
        const noti = usersConversations.length > 0 ? true : false;
        res.json({
            status: 'success',
            noti,
        });

    } catch(err) {
        console.error(err);
    }
})

// Lookup Username
router.post('/lookupusername', postAuthToken, async (req, res) => {
    try {
      // const receiver = await User.findById(req.body.receiverID);
      const receiver = (await db.collection('users').where('_id', '==', req.body.receiverID).get()).docs[0].data();
      res.json({
        username: receiver.username,
        prefix: receiver.prefix,
        rank: receiver.rank,
        verified: receiver.verified,
      });
    } catch(err) {
      console.error(err);
    }
})

// Send message
const sendMessage = async (conversationID, message, usersIdsInChat) => {
    try {
        const user = (await db.collection('users').where('_id', '==', message.sender).get()).docs[0].data();
        const conversation = (await db.collection('conversations').where('_id', '==', conversationID).get()).docs[0].data();
        const messageData = message;

        // Users to notify/are not in chat
        const notifyTheseUsers = conversation.people.map(person => {
            if (person != user._id) {
                return person;
            } else {
                return null;
            }
        }).filter(personsID => usersIdsInChat.includes(personsID) ? false : true);
        await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({messages: [...conversation.messages, messageData], dateActive: message.date, seenFor: notifyTheseUsers});

        // Send NOTIFICATION to users?firebase/app stuff
        // if (notifyTheseUsers.length > 0) {
        //     notifyTheseUsers.forEach(async notiUser => {
        //         // Send noti
        //     });
        // };


        // Add 1 point to score
        let usersScore = user.score;
        usersScore += 1;
        // const updateScore = await User.findByIdAndUpdate(user._id, { score: usersScore }, { useFindAndModify: false });
        await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
        
    } catch(err) {
        console.error(err);
    }
}

// Push message to notifications
const pushMessage = async (person, message) => {
    try {
        const user = (await db.collection('users').where('_id', '==', person).get()).docs[0].data();
        const messageData = message;
        const sender = (await db.collection('users').where('_id', '==', message.sender).get()).docs[0].data();
        if (user.subscriptions.length != 0) {
            user.subscriptions.forEach(sub => {
                push.sendNotification(sub, `From ${sender.username}: ${messageData.value}`);
            });
            
        }
    } catch(err) {
        console.error(err);
    }
}

// Save image to db
router.post('/saveimage', [postAuthToken, upload], async (req, res) => {
    try {
        // Update profile pic
      if (req.file.mimetype.includes('image')) {
        const fileName = JSON.parse(JSON.stringify(req.body)).filename
        const uploadsRef = ref(storage, 'messageImages');
        const savePath = `${req.user._id}/` + fileName + '-' + req.file.size;
        const fileRef = ref(uploadsRef, savePath);
        const metadata = {
          contentType: req.file.mimetype,
        };
        await uploadBytes(fileRef, req.file.buffer, metadata);
        console.log('Uploaded a blob or file!');
        const imgURL = `https://firebasestorage.googleapis.com/v0/b/socialent-f94ff.appspot.com/o/messageImages%2F${req.user._id}%2F${fileName}-${req.file.size}?alt=media`;
  
        res.json({
          status: 'success',
          imgURL,
        });
      } else {
        res.json({
          status: 'error',
        });
      }
    } catch(err) {
        console.error(err);
    }
})

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
        const seenFor = conversation.people.map(person => {
            if (person != user._id) {
                return person;
            } else {
                return null;
            }
        });
        await (await db.collection('conversations').where('_id', '==', conversation._id).get()).docs[0].ref.update({ messages, seenFor, });

        // Delete image from db
        if (message.type == 'img' && message.value.includes('firebase')) {
            // Find file name
            const splitVersion = message.value.split('%2F');
            const fileName = splitVersion[2].slice(0, splitVersion[2].length - 10);
            const messagesRef = ref(storage, `messageImages/${user._id}`);
            const imageRef = ref(messagesRef, fileName);
      
            deleteObject(imageRef);
        }
        
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    messagesRoute: router,
    sendMessage,
    deleteMessage,
    pushMessage,
};