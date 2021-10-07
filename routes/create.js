const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');

const { getStorage, ref, uploadBytes } = require('firebase/storage');
const storage = getStorage();
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 10,

  },
}).single("file");

// const User = require('../models/User');
// const Post = require('../models/Post');

// Get route
router.get('/', authToken, async (req, res) => {
  try {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      
        res.render('create', { user });

  } catch (err) {
    console.error(err);
  }
});
router.post('/getfromapp', postAuthToken, async (req, res) => {
  try {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      

        return res.json({user});
      
  } catch (err) {
    console.error(err);
  }
});

function authToken(req, res, next) {
  const token = req.cookies['auth-token'];
  if (token == null) return res.redirect('/login?rd=create');
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

// Create post
router.post('/createpost', [postAuthToken, upload], async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

    const usersID = user._id;

    if (req.file.mimetype.includes('image') || req.file.mimetype.includes('video')) {
      const fileType = req.file.mimetype.split('/')[0];
      const fileName = JSON.parse(JSON.stringify(req.body)).filename;
      const uploadsRef = ref(storage, 'posts');
      const savePath = `${usersID}/` + fileName + '-' + req.file.size;
      const fileRef = ref(uploadsRef, savePath);
      const metadata = {
        contentType: req.file.mimetype,
      };
      await uploadBytes(fileRef, req.file.buffer, metadata);
      console.log('Uploaded a blob or file!');
      const url = `https://firebasestorage.googleapis.com/v0/b/socialent-f94ff.appspot.com/o/posts%2F${usersID}%2F${fileName}-${req.file.size}?alt=media`;

      const newPostData = {
        _id: Date.now().toString(16) + Math.random().toString(16).slice(2),
        author: {
          _id: user._id,
          username: user.username,
          profileImg: user.profileImg,
          verified: user.verified,
          rank: user.rank,
          prefix: {
            title: user.prefix.title,
          },
        },
        url: url,
        urlType: fileType,
        description: JSON.parse(JSON.stringify(req.body)).description,
        active: true,
        comments: [],
        date: Date.now(),
        likes: [],
      };
      await db.collection('posts').doc(newPostData._id).set(newPostData);
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
      await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('score', usersScore);
      res.json({
        status: 'successful',
      });
    } else {
      res.status(500).json({
        status: 'error',
        errors: 'File type not supported',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
