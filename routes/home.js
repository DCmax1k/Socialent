const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const publicIp = require('public-ip');
const jwt = require('jsonwebtoken');

const { getStorage, ref, deleteObject } = require('firebase/storage');
const storage = getStorage();


// const User = require('../models/User');
// const Post = require('../models/Post');

// Home route - see posts from those that you're following
router.get('/', authToken, async (req, res) => {
  try {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      // const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());
      // const currentIP = await publicIp.v4();
      // if (!user.ips ) {
      //   await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('ips', [currentIP]);
      // } else if (!user.ips.includes(currentIP)) {
      //   await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('ips', [...user.ips, currentIP]);
      // }
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
        res.render('home', { user, postsFollowing });

  } catch (err) {
    console.error(err);
  }
});
router.post('/getfromapp', postAuthToken, async (req, res) => {
  try {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      // const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());
      const currentIP = await publicIp.v4();
      if (!user.ips ) {
        await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('ips', [currentIP]);
      } else if (!user.ips.includes(currentIP)) {
        await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('ips', [...user.ips, currentIP]);
      }
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

        return res.json({user, postsFollowing});


  } catch (err) {
    console.error(err);
  }
});

function authToken(req, res, next) {
  const token = req.cookies['auth-token'];
  if (token == null) return res.redirect('/login');
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

// Edit Description of post
router.post('/editdesc', postAuthToken, async (req, res) => {
  try { 
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      if (user._id == req.body.postID) {

      const udpatePost = await (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].ref.update('description', req.body.desc);
      res.json({
        status: 'success',
      });
    }
  } catch(err) {
    console.error(err);
  }
})

// Admin delete post
router.post('/admindeletepost', postAuthToken, async (req, res) => {
  try {
    //const admin = await User.findById(req.body.admin);
    const admin = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    // const user = await User.findById(req.body.user);
    const user = (await db.collection('users').where('_id', '==', req.body.user).get()).docs[0].data();
    //const post = await Post.findById(req.body.postID);
    const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
    if (((user.rank === 'owner' && admin.rank === 'owner') || (admin.rank === 'owner' && user.rank === 'admin') || (admin.rank === 'admin' && user.rank !== 'owner') || (user.rank === 'user' && (admin.rank === 'owner' || admin.rank === 'admin')))) {
      // Doesn't actually delete post, but rather disables it
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
router.post('/checkuserrank', postAuthToken, async (req, res) => {
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

// Check for warnings
router.post('/checkwarnings', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

      res.json({
        status: 'success',
        warnings: user.warnings,
      });

  } catch(err) {
    console.error(err);
  }
});

// Dismiss warning
router.post('/dismisswarn', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

      const warnings = user.warnings;
      warnings[req.body.index].active = false;
      // const updateUser = await User.findByIdAndUpdate(user._id, { $set: { warnings }}, { useFindAndModify: false });
      // const saveUser = await updateUser.save();
      const updateUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('warnings', warnings);
      res.json({
        status: 'success',
      });

  } catch(err) {
    console.error(err);
  }
});



// Delet post
router.post('/deletepost', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    // const post = await Post.findById(req.body.postID);
    const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
    if (JSON.stringify(post.author._id) === JSON.stringify(user._id)) {

      // Delete file from storage
      if (post.url.includes('firebase')) {
        // Find file name
        const splitVersion = post.url.split('%2F');
        const fileName = splitVersion[2].slice(0, splitVersion[2].length - 10);
        const postsRef = ref(storage, `posts/${user._id}`);
        const imageRef = ref(postsRef, fileName);

        deleteObject(imageRef);
      }

      // Delete from db
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
router.post('/addcomment', postAuthToken, async (req, res) => {
  try {
    const post = (await db.collection('posts').where('_id', '==', req.body.postID).get()).docs[0].data();
    // const post = await Post.findById(req.body.postID);
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

      // const updatePost = await Post.findByIdAndUpdate(post._id,{$push: { comments: [user.username, req.body.comment, req.body.date] },},{ useFindAndModify: false });
      // const savePost = await updatePost.save();
      const updatePost = await (await db.collection('posts').where('_id', '==', post._id).get()).docs[0].ref.update('comments', [ ...post.comments, { date: req.body.date, username: user.username, value: req.body.comment}]);
      res.json({
        status: 'successful',
        comment: [user.username, req.body.comment, req.body.date],
        length: post.comments.length + 1,
      });

  } catch (err) {
    console.error(err);
  }
});

// Logout
router.post('/logout', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.id);
    const user = (await db.collection('users').where('_id', '==', req.body.id).get()).docs[0].data();

      // const changeStatus = await User.findByIdAndUpdate(user._id,{$set: { status: 'offline' },},{ useFindAndModify: false });
      // const save = await changeStatus.save();
      const changeStatus = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('status', 'offline');
      res.clearCookie('auth-token').json({
        status: 'logged out',
      });

  } catch (err) {
    console.error(err);
  }
});

// Like post
router.post('/likepost', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

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

  } catch (err) {
    console.error(err);
  }
});

// Unlike post
router.post('/unlikepost', postAuthToken, async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

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

  } catch (err) {
    console.error(err);
    res.send('error');
  }
});

module.exports = router;
