const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

// const User = require('../models/User');
// const Post = require('../models/Post');

// Home route - see posts from those that you're following
router.get('/', async (req, res) => {
  try {
    if (req.query.k) {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].data();
      // const posts = await Post.find({active: true});
      const posts = (await db.collection('posts').where('active', '==', true).get()).docs.map(doc => doc.data());
      const postsFollowing = [];
      posts.forEach((post) => {
        if (
          user.following.includes(post.author._id) ||
          JSON.stringify(post.author._id) === JSON.stringify(user._id)
        ) {
          postsFollowing.push(post);
        }
      });
      postsFollowing.sort((a,b) => a.date-b.date);
      if (user.status === 'online' && (user.rank === 'admin' || user.rank === 'owner')) {
        // const allUsers = await User.find();
        const allUsers = (await db.collection('users').get()).docs.map(doc => doc.data()).sort((a, b) => a.dateJoined - b.dateJoined);
        res.render('home', { user, postsFollowing, allUsers });
      } else if (user.status === 'online') {
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

// Admin delete post
router.post('/admindeletepost', async (req, res) => {
  try {
    //const admin = await User.findById(req.body.admin);
    const admin = (await db.collection('users').where('_id', '==', req.body.admin).get()).docs[0].data();
    // const user = await User.findById(req.body.user);
    const user = (await db.collection('users').where('_id', '==', req.body.user).get()).docs[0].data();
    //const post = await Post.findById(req.body.postID);
    const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
    if (((user.rank === 'owner' && admin.rank === 'owner') || (admin.rank === 'owner' && user.rank === 'admin') || (admin.rank === 'admin' && user.rank !== 'owner') || (user.rank === 'user' && (admin.rank === 'owner' || admin.rank === 'admin'))) && admin.devices.includes(req.body.device)) {
      // Doesn't actually delete post, but rather disables it
      // const deletePost = await Post.findByIdAndDelete(post._id);
      // const disablePost = await Post.findByIdAndUpdate(post._id, { active: false }, { useFindAndModify: false });
      const disablePost = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('active', false);
      //const savePost = await disablePost.save();
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
    // const user = await User.findById(req.body.authorID);
    const user = (await db.collection('users').where('_id', '==', req.body.authorID).get()).docs[0].data();
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
    // const admin = await User.findById(req.body.adminID);
    const admin = (await db.collection('users').where('_id', '==', req.body.adminID).get()).docs[0].data();
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (admin.status === 'online' && admin.devices.includes(req.body.device)) {
      if (admin.rank === 'admin' || admin.rank === 'owner') {
        // const updateUser = await User.findByIdAndUpdate(user._id, { $push: { warnings: [ req.body.warning, true ]}}, { useFindAndModify: false });
        // const saveUser = await updateUser.save();
        const updateUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('warnings', [...user.warnings, { active: true, text: req.body.warning}]);
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
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
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
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const warnings = user.warnings;
      warnings[req.body.index].active = false;
      // const updateUser = await User.findByIdAndUpdate(user._id, { $set: { warnings }}, { useFindAndModify: false });
      // const saveUser = await updateUser.save();
      const updateUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('warnings', warnings);
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
    // const admin = await User.findById(req.body.userID);
    // const user = await User.findById(req.body.userId);
    const user = (await db.collection('users').where('_id', '==', req.body.userId).get()).docs[0].data();
    const admin = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
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
    // const admin = await User.findById(req.body.userID);
    const admin = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    // const user = await User.findById(req.body.userId);
    const user = (await db.collection('users').where('_id', '==', req.body.userId).get()).docs[0].data();
    if (admin.rank == 'owner' || admin.rank == 'admin') {
      if (admin.status == 'online' && admin.devices.includes(req.body.device)) {
        if (user.rank == 'user') {
          // const promoteUser = await User.findByIdAndUpdate(user._id, { rank: 'admin' }, { useFindAndModify: false });
          // const saveUser = await promoteUser.save();
          // const setPrefix = await User.findByIdAndUpdate(user._id, { 'prefix.title': 'Admin' }, { useFindAndModify: false });
          // const savePrefix = await setPrefix.save();
          const promoteUser = await (await db.collection('users').where('_id', '==', user_id).get()).docs[0].ref.update('rank', 'admin');
          const setPrefix = await (await db.collection('users').where('_id', '==', user_id).get()).docs[0].ref.update('prefix.title', 'Admin');
          res.json({
            status: 'success',
            username: user.username,
            promoteOrDemote: 'promote',
          });
        } else if (user.rank == 'admin') {
          // const demoteUser = await User.findByIdAndUpdate(user._id, { rank: 'user'}, { useFindAndModify: false });
          // const saveUser = await demoteUser.save();
          // const setPrefix = await User.findByIdAndUpdate(user._id, { 'prefix.title': '' }, { useFindAndModify: false });
          // const savePrefix = await setPrefix.save();
          const demoteUser = await (await db.collection('users').where('_id', '==', user_id).get()).docs[0].ref.update('rank', 'user');
          const setPrefix = await (await db.collection('users').where('_id', '==', user_id).get()).docs[0].ref.update('prefix.title', '');
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
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    // const post = await Post.findById(req.body.postID);
    const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device) && JSON.stringify(post.author._id) === JSON.stringify(user._id)) {
      // const deletePost = await Post.deleteOne({ _id: req.body.postID });
      const deletePost = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.delete();
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
    const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
    // const post = await Post.findById(req.body.postID);
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const updatePost = await Post.findByIdAndUpdate(post._id,{$push: { comments: [user.username, req.body.comment, req.body.date] },},{ useFindAndModify: false });
      // const savePost = await updatePost.save();
      const updatePost = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('comments', [ ...post.comments, { date: req.body.date, username: user.username, value: req.body.comment}]);
      res.json({
        status: 'successful',
        comment: [user.username, req.body.comment, req.body.date],
        length: post.comments.length + 1,
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
    // const user = await User.findById(req.body.id);
    const user = (await db.collection('users').where('_id', '==', req.body.id).get()).docs[0].data();
    if (user.status === 'online') {
      // const changeStatus = await User.findByIdAndUpdate(user._id,{$set: { status: 'offline' },},{ useFindAndModify: false });
      // const save = await changeStatus.save();
      const changeStatus = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('status', 'offline');
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
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const post = await Post.findById(req.body.postID);
      const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
      if (!post.likes.includes(user._id)) {
        // const pushLike = await Post.findByIdAndUpdate(post._id,{$push: { likes: user._id },},{ useFindAndModify: false });
        // const save = await pushLike.save();
        const pustLike = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('likes', [...post.likes, user._id]);
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
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const post = await Post.findById(req.body.postID);
      const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
      if (post.likes.includes(user._id)) {
        const likesArr = post.likes;
        const newLikesArr = [];
        likesArr.forEach((usersId) => {
          if (usersId != user._id) {
            newLikesArr.push(usersId);
          }
        });
        // const updateLikes = await Post.findByIdAndUpdate(post._id,{ $set: { likes: newLikesArr } },{ useFindAndModify: false });
        // const save = await updateLikes.save();
        const updateLikes = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('likes', newLikesArr);
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
