const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

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
      if (req.query.k) {
        // const user = await User.findById(req.query.k);
        const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].data();
        if (user.status === 'online') {
          let likedpost = false;
          post.likes.includes(user._id)
            ? (likedpost = true)
            : (likedpost = false);
          res.render('post', { post, user, account, likedpost, loggedin: true });
        } else {
          res.redirect('/login');
        }
      } else {
        res.render('post', { post, account, loggedin: false });
      }  
    } else {
      res.send('This post is no longer available!')
    }
    
  } catch (err) {
    console.error(err);
  }
});

// Like post
router.post('/likepost', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
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
    } else {
      res.json({
        status: 'offline',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// unlike post
router.post('/unlikepost', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
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
    } else {
      res.json({
        status: 'offline',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Add comment
router.post('/addcomment', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const post = await Post.findById(req.body.postID);
      const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
      // const updateComments = await Post.findByIdAndUpdate(post._id,{$push: { comments: [user.username, req.body.comment, req.body.date] },},{ useFindAndModify: false });
      // const save = await updateComments.save();
      const updateComments = (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('comments', [...post.comments, {username: user.username, date: req.body.date, value: req.body.comment}]);
      res.json({
        status: 'successful',
        username: user.username,
        comment: req.body.comment,
        date: req.body.date,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
