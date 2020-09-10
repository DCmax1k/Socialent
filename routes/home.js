const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Post = require('../models/Post');

// Home route - see posts from those that you're following
router.get('/', async (req, res) => {
  try {
    if (req.query.k) {
      const user = await User.findById(req.query.k);
      const posts = await Post.find();
      const postsFollowing = [];
      posts.forEach((post) => {
        if (
          user.following.includes(post.author._id) ||
          JSON.stringify(post.author._id) === JSON.stringify(user._id)
        ) {
          postsFollowing.push(post);
        }
      });
      if (user.status === 'online') {
        res.render('home', { user, postsFollowing });
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
  }
});

// Delet post
router.post('/deletepost', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const post = await Post.deleteOne({ _id: req.body.postID });
      res.json({
        status: 'successful',
        username: user.username,
        _id: user._id,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Add comment
router.post('/addcomment', async (req, res) => {
  try {
    const post = await Post.findById(req.body.postID);
    const user = await User.findById(req.body.userID);
    const updatePost = await Post.findByIdAndUpdate(
      post._id,
      {
        $push: { comments: [user.username, req.body.comment, req.body.date] },
      },
      { useFindAndModify: false }
    );
    const savePost = await updatePost.save();
    res.json({
      status: 'successful',
      comment: [user.username, req.body.comment, req.body.date],
      length: savePost.comments.length + 1,
    });
  } catch (err) {
    console.error(err);
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const user = await User.findById(req.body.id);
    if (user.status === 'online') {
      const changeStatus = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { status: 'offline' },
        },
        { useFindAndModify: false }
      );
      const save = await changeStatus.save();
      res.json({
        status: 'logged out',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Like post
router.post('/likepost', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    const post = await Post.findById(req.body.postID);
    if (!post.likes.includes(user._id)) {
      const pushLike = await Post.findByIdAndUpdate(
        post._id,
        {
          $push: { likes: user._id },
        },
        { useFindAndModify: false }
      );
      const save = await pushLike.save();
      res.json({
        status: 'liked',
      });
    }
  } catch (err) {
    console.error(err);
    res.send('error');
  }
});

// Unlike post
router.post('/unlikepost', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    const post = await Post.findById(req.body.postID);
    if (post.likes.includes(user._id)) {
      const likesArr = post.likes;
      const newLikesArr = [];
      likesArr.forEach((usersId) => {
        if (usersId != user._id) {
          newLikesArr.push(usersId);
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
      });
    }
  } catch (err) {
    console.error(err);
    res.send('error');
  }
});

module.exports = router;
