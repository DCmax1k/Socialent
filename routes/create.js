const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

// const User = require('../models/User');
// const Post = require('../models/Post');

// Get route
router.get('/', async (req, res) => {
  try {
    if (req.query.k) {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].data();
      
      if (user.status === 'online') {
        res.render('create', { user });
      }
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
  }
});

// Create post
router.post('/createpost', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    const newPostData = {
        author: {
          _id: user._id,
          username: user.username,
          profileImg: user.profileImg,
        },
        url: req.body.url,
        urlType: req.body.urlType,
        description: req.body.description,
    };
    const createPost = (await db.collection('posts').add(newPostData));
    // const createPost = await new Post({
    //   author: {
    //     _id: user._id,
    //     username: user.username,
    //     profileImg: user.profileImg,
    //   },
    //   url: req.body.url,
    //   urlType: req.body.urlType,
    //   description: req.body.description,
    // });
    // const savePost = await createPost.save();
    // Add 5 points to score
    let usersScore = user.score;
    usersScore += 5;
    // const updateScore = await User.findByIdAndUpdate(user._id, { score: usersScore }, { useFindAndModify: false });
    // const saveScore = await updateScore;
    const updateScore = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
    res.json({
      status: 'successful',
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
