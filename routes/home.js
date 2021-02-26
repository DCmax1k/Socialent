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
      const posts = await Post.find({active: true});
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

// Admin delete post
router.post('/admindeletepost', async (req, res) => {
  try {
    const admin = await User.findById(req.body.admin);
    const user = await User.findById(req.body.user);
    const post = await Post.findById(req.body.postID);
    if (((user.rank === 'owner' && admin.rank === 'owner') || (admin.rank === 'owner' && user.rank === 'admin') || (admin.rank === 'admin' && user.rank !== 'owner') || (user.rank === 'user' && (admin.rank === 'owner' || admin.rank === 'admin'))) && admin.devices.includes(req.body.device)) {
      // Doesn't actually delete post, but rather disables it
      // const deletePost = await Post.findByIdAndDelete(post._id);
      const disablePost = await Post.findByIdAndUpdate(post._id, { active: false }, { useFindAndModify: false });
      const savePost = await disablePost.save();
      res.json({
        status: 'success',
        postID: post._id,
      })
    }
  } catch(err) {
    console.error(err);
  }
});

// Check user rank
router.post('/checkuserrank', async (req, res) => {
  try {
    const user = await User.findById(req.body.authorID);
    res.json({
      status: 'success',
      rank: user.rank,
    });
  } catch(err) {
    console.error(err);
  }
});

// Warn a user
router.post('/warn', async (req, res) => {
  try {
    const admin = await User.findById(req.body.adminID);
    const user = await User.findById(req.body.userID);
    if (admin.status === 'online' && admin.devices.includes(req.body.device)) {
      if (admin.rank === 'admin' || admin.rank === 'owner') {
        const updateUser = await User.findByIdAndUpdate(user._id, { $push: { warnings: [ req.body.warning, true ]}}, { useFindAndModify: false });
        const saveUser = await updateUser.save();
        res.json({
          status: 'success',
          username: user.username,
        });
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

// Check for warnings
router.post('/checkwarnings', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      res.json({
        status: 'success',
        warnings: user.warnings,
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

// Dismiss warning
router.post('/dismisswarn', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const warnings = user.warnings;
      warnings[req.body.index][1] = false;
      const updateUser = await User.findByIdAndUpdate(user._id, { $set: { warnings }}, { useFindAndModify: false });
      const saveUser = await updateUser.save();
      res.json({
        status: 'success',
      });
    }
  } catch(err) {
    console.error(err);
  }
});

const deleteUser = require('../globalFunctions/deleteAccount');

//Delete user from admin
router.post('/deleteuser', async (req, res) => {
  try {
    const admin = await User.findById(req.body.userID);
    const user = await User.findById(req.body.userId);
    if (admin.rank == 'owner' || admin.rank == 'admin') {
      if (admin.status == 'online' || admin.devices.includes(req.body.device)) {
        const deleteTheUser = await deleteUser(user._id);
        if (deleteTheUser === 'success') {
          res.json({
            status: 'success',
            username: user.username,
          });
        }
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
          const setPrefix = await User.findByIdAndUpdate(user._id, { 'prefix.title': 'Admin' }, { useFindAndModify: false });
          const savePrefix = await setPrefix.save();
          res.json({
            status: 'success',
            username: user.username,
            promoteOrDemote: 'promote',
          });
        } else if (user.rank == 'admin') {
          const demoteUser = await User.findByIdAndUpdate(user._id, { rank: 'user'}, { useFindAndModify: false });
          const saveUser = await demoteUser.save();
          const setPrefix = await User.findByIdAndUpdate(user._id, { 'prefix.title': '' }, { useFindAndModify: false });
          const savePrefix = await setPrefix.save();
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
    const post = await Post.findById(req.body.postID);
    if (user.status === 'online' && user.devices.includes(req.body.device) && JSON.stringify(post.author._id) === JSON.stringify(user._id)) {
      // Doesn't actually delete post, but rather disables it
      const deletePost = await Post.deleteOne({ _id: req.body.postID });
      // const disablePost = await Post.findByIdAndUpdate(post._id, { active: false }, { useFindAndModify: false });
      // const savePost = await disablePost.save();
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
