const express = require('express');
const router = express.Router();

const Conversation = require('../models/Conversation');
const User = require('../models/User');

// GET Route
router.get('/', async (req, res) => {
    try {
        if (req.query.k) {
            const user = await User.findById(req.query.k);
            const usersConversations = [];
            (await Conversation.find()).forEach(conversation => {
                if (conversation.people.includes(user._id)) {
                    usersConversations.push(conversation);
                }
            });
            if (user.status == 'online') {
                res.render('messages', { user })
            } else {
             res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    } catch(err) {
        console.error(err);
    }
    
});

// Load Conversation
router.post('/loadconversation', async (req, res) => {
    try {
        const user = await User.findById(req.body.userID);
        if (user.status === 'online') {
            const conversation = await Conversation.findById(req.body.conversationID);
            res.json({
                status: 'success',
                messages: conversation.messages,
            })
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
router.post('/addconversation', async (req, res) => {
    try {
        const user = await User.findById(req.body.userID);
        if (user.status === 'online') {
            if (req.body.receiver) {
                const receiver = await User.findOne({ username: req.body.receiver });
                // Check if receiver exists
                if (receiver) {
                       if (JSON.stringify(receiver._id) !== JSON.stringify(user._id)) {
                       // Check to see if they already have a conversation
                        const check1 = await Conversation.find({people: [user._id, receiver._id]});
                        const check2 = await Conversation.find({people: [receiver._id, user._id]});
                        if (check1.length == 0 && check2.length == 0) {

                                const createConversation = await new Conversation({
                                    people: [user._id, receiver._id],
                                    messages: [],
                                });
                                const saveConversation = await createConversation.save();

                                const conversationID = createConversation._id;
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
router.post('/checkconversations', async (req, res) => {
    try {
        const user = await User.findById(req.body.userID);
        if (user.status === 'online') {
            const usersConversations = [];
            (await Conversation.find()).forEach(conversation => {
                if (conversation.people.includes(user._id)) {
                    usersConversations.push(conversation);
                }
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
router.post('/lookupusername', async (req, res) => {
    try {
      const receiver = await User.findById(req.body.receiverID);
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
  router.post('/sendmessage', async (req, res) => {
    try {
      const user = await User.findById(req.body.senderID);
      if (user.status === 'online') {
        const conversation = await Conversation.findById(req.body.conversationID);
        const updateConversation = await Conversation.findByIdAndUpdate(conversation._id, { $push: { messages: [user._id, req.body.message] }}, { useFindAndModify: false });
        const saveConversation = await updateConversation.save();
        res.json({
            status: 'success',
            message: req.body.message,
        });
      }
    } catch(err) {
      console.error(err);
    }
  })

module.exports = router;