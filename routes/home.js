const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Post = require('../models/Post');

// Home route - see posts from those that you're following
router.get('/', async (req, res) => {
  try {
    if (req.query.k) {
      const user = await User.findById(req.query.k);
      const allUsers = await User.find();
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
        res.render('home', { user, postsFollowing, allUsers });
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

//Delete user
router.post('/deleteuser', async (req, res) => {
  try {
    const admin = await User.findById(req.body.userID);
    const user = await User.findById(req.body.userId);
    if (admin.rank == 'owner' || admin.rank == 'admin') {
      if (admin.status == 'online' || admin.devices.includes(req.body.device)) {
        const deleteAllPosts = await Post.deleteMany({ 'author._id': user._id });
        const deleteIdsFromFollowing = await User.updateMany({
          $pull: { following: user._id },
        });
        const deleteUser = await User.deleteOne({ _id: user._id });
        res.json({
          status: 'success',
          username: user.username,
        })
      } else {
        res.json({
          status: 'unseccessful',
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
})

// Promote user
router.post('/promote', async (req, res) => {
  try {
    const admin = await User.findById(req.body.userID);
    const user = await User.findById(req.body.userId);
    if (admin.rank == 'owner' || admin.rank == 'admin') {
      if (admin.status == 'online' && admin.devices.includes(req.body.device)) {
        if (user.rank == 'user') {
          const promoteUser = await User.findByIdAndUpdate(user._id, { rank: 'admin' }, { useFindAndModify: false });
          const saveUser = await promoteUser.save();
          res.json({
            status: 'success',
            username: user.username,
            promoteOrDemote: 'promote',
          });
        } else if (user.rank == 'admin') {
          const demoteUser = await User.findByIdAndUpdate(user._id, { rank: 'user'}, { useFindAndModify: false });
          const saveUser = await demoteUser.save();
          res.json({
            status: 'success',
            username: user.username,
            promoteOrDemote: 'demote',
          });
        }
      } else {
        res.json({
          status: 'unseccessful',
        });
      }
    }
  } catch(err) {
    console.error(err);
  }
})

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
    } else {
      res.json({
        status: 'unseccesful',
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
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
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
    } else {
      res.json({
        status: 'unsuccessful',
      });
    }
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
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
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
    } else {
      res.json({
        status: 'unseccessful',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Unlike post
router.post('/unlikepost', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
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
    } else {
      res.json({
        status: 'unseccessful',
      });
    }
  } catch (err) {
    console.error(err);
    res.send('error');
  }
});

module.exports = router;
