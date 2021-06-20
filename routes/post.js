const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');

// const Post = require('../models/Post');
// const User = require('../models/User');

// GET route
router.get('/:post', async (req, res) => {
  try {
    // const post = await Post.findById(req.params.post);
    const post = (await db.collection('posts').where('_id', '==', req.params.post).get()).docs[0].data();
    if (post.active) {
      // const account = await Post.findById(post.author._id);
      const account = (await db.collection('users').where('_id', '==', post.author._id).get()).docs[0].data();
      const token = req.cookies['auth-token'];
      let passed = true;
      let usersID = '';
      if (token == null) passed = false;
      jwt.verify(token, process.env.ACCESS_SECRET, (err, us) => {
        if (err) return passed = false;
        usersID = us._id;
      });
      if (passed) { 
        // const user = await User.findById(req.query.k);
        const user = (await db.collection('users').where('_id', '==', usersID).get()).docs[0].data();
        let likedpost = false;
        post.likes.includes(user._id)
          ? (likedpost = true)
          : (likedpost = false);
        if (req.body.fromApp) return res.json({ post, user, account, likedpost, loggedin: true });
        res.render('post', { post, user, account, likedpost, loggedin: true });
      } else {
        return res.render('post', { post, account, loggedin: false });
      }  
    } else {
      res.send('This post is no longer available!')
    }
    
  } catch (err) {
    console.error(err);
  }
});
router.post('/:post/getfromapp', async (req, res) => {
  try {
    // const post = await Post.findById(req.params.post);
    const post = (await db.collection('posts').where('_id', '==', req.params.post).get()).docs[0].data();
    if (post.active) {
      // const account = await Post.findById(post.author._id);
      const account = (await db.collection('users').where('_id', '==', post.author._id).get()).docs[0].data();
      const token = req.cookies['auth-token'] || req.body.auth_token;
      let passed = true;
      let usersID = '';
      if (token == null) passed = false;
      jwt.verify(token, process.env.ACCESS_SECRET, (err, us) => {
        if (err) return passed = false;
        usersID = us._id;
      });
      if (passed) { 
        // const user = await User.findById(req.query.k);
        const user = (await db.collection('users').where('_id', '==', usersID).get()).docs[0].data();
        let likedpost = false;
        post.likes.includes(user._id)
          ? (likedpost = true)
          : (likedpost = false);
        return res.json({ post, user, account, likedpost, loggedin: true });
      } else {
        return res.json({status: 'unseccessful'});
      }  
    } else {
      return res.json({status: 'unseccessful'});
    }
    
  } catch (err) {
    console.error(err);
  }
});

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

// Like post
router.post('/likepost', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

      // const post = await Post.findById(req.body.postID);
      const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
      if (!post.likes.includes(user._id)) {
        // const updateLikes = await Post.findByIdAndUpdate(post._id,{ $push: { likes: user._id } },{ useFindAndModify: false });
        // const save = await updateLikes.save();
        const updateLikes = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('likes', [...post.likes, user._id]);
        res.json({
          status: 'liked',
          likesAmount: post.likes.length,
        });
      }

  } catch (err) {
    console.error(err);
  }
});

// unlike post
router.post('/unlikepost', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

      // const post = await Post.findById(req.body.postID);
      const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
      if (post.likes.includes(user._id)) {
        const newLikesArr = [];
        post.likes.forEach((like) => {
          if (like !== req.body.userID) {
            newLikesArr.push(like);
          }
        });
        // const updateLikes = await Post.findByIdAndUpdate(post._id,{ $set: { likes: newLikesArr } },{ useFindAndModify: false });
        // const save = await updateLikes.save();
        const updateLikes = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('likes', newLikesArr);
        res.json({
          status: 'unliked',
          likesAmount: post.likes.length,
        });
      }

  } catch (err) {
    console.error(err);
  }
});

// Add comment
router.post('/addcomment', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

      // const post = await Post.findById(req.body.postID);
      const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
      // const updateComments = await Post.findByIdAndUpdate(post._id,{$push: { comments: [user.username, req.body.comment, req.body.date] },},{ useFindAndModify: false });
      // const save = await updateComments.save();
      const updateComments = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('comments', [...post.comments, {username: user.username, date: req.body.date, value: req.body.comment}]);
      res.json({
        status: 'successful',
        username: user.username,
        comment: req.body.comment,
        date: req.body.date,
      });
    
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
