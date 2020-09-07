const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const User = require('../models/User');

// GET route
router.get('/:post', async (req, res) => {
  try {
    const post = await Post.findById(req.params.post);
    const account = await Post.findById(post.author._id);
    if (req.query.k) {
      const user = await User.findById(req.query.k);
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
  } catch (err) {
    console.error(err);
  }
});

// Like post
router.post('/likepost', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const post = await Post.findById(req.body.postID);
      if (!post.likes.includes(user._id)) {
        const updateLikes = await Post.findByIdAndUpdate(
          post._id,
          { $push: { likes: user._id } },
          { useFindAndModify: false }
        );
        const save = await updateLikes.save();
        res.json({
          status: 'liked',
          likesAmount: save.likes.length,
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
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const post = await Post.findById(req.body.postID);
      if (post.likes.includes(user._id)) {
        const newLikesArr = [];
        post.likes.forEach((like) => {
          if (like !== req.body.userID) {
            newLikesArr.push(like);
          }
        });
        const updateLikes = await Post.findByIdAndUpdate(
          post._id,
          { $set: { likes: newLikesArr } },
          { useFindAndModify: false }
        );
        const save = await updateLikes.save();

        res.json({
          status: 'unliked',
          likesAmount: save.likes.length,
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
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const post = await Post.findById(req.body.postID);
      const updateComments = await Post.findByIdAndUpdate(
        post._id,
        {
          $push: { comments: [user.username, req.body.comment, req.body.date] },
        },
        { useFindAndModify: false }
      );
      const save = await updateComments.save();
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
