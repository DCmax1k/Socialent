const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

router.get('/', authToken, async (req, res) => {
    try {
        const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
        if (user.rank != 'admin' && user.rank != 'owner') return res.status(403).send('nice try lol');
        const allUsers = (await db.collection('users').get()).docs.map(doc => { return doc.data(); });
        res.render('admin', {user, allUsers});
    } catch(err) {
        console.error(err);
    }
});
router.post('/getfromapp', postAuthToken, async (req, res) => {
  try {
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      if (user.rank != 'admin' && user.rank != 'owner') return res.status(403).send('nice try lol');
      const allUsers = (await db.collection('users').get()).docs.map(doc => { return doc.data(); });
      res.json({user, allUsers});
  } catch(err) {
      console.error(err);
  }
});


function authToken(req, res, next) {
    const token = req.cookies['auth-token'];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
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

const deleteUser = require('../globalFunctions/deleteAccount');

//Delete user from admin
router.post('/deleteuser', postAuthToken, async (req, res) => {
  try {
    // const admin = await User.findById(req.body.userID);
    // const user = await User.findById(req.body.userId);
    const user = (await db.collection('users').where('_id', '==', req.body.userId).get()).docs[0].data();
    const admin = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    if (user.rank != 'owner' && admin.rank == 'owner') {
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
  } catch(err) {
    console.error(err);
  }
});

// Set users prefix
router.post('/setprefix', postAuthToken, async (req, res) => {
  try {
    // const admin = await User.findById(req.body.userID);
    // const user = await User.findOne({username: req.body.accountUsername});
    const admin = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    const user = (await db.collection('users').where('_id', '==', req.body.user).get()).docs[0].data();
    if (admin.rank == 'admin' || admin.rank == 'owner') {
      // const updateUser = await User.findByIdAndUpdate(user._id, { 'prefix.title': req.body.usersPrefix }, { useFindAndModify: false });
      // const saveUser = await updateUser.save();
      const updateUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('prefix.title', req.body.newPrefix);
      // Change prefix on all posts
      (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
        await doc.ref.update('author.prefix.title', req.body.newPrefix);
      })
      res.json({
        status: 'success',
      });
    } else {
      res.json({
        status: 'not admin',
      });
    }
  } catch(err) {
    console.error(err);
  }
})

// Promote User
router.post('/promo', postAuthToken, async (req, res) => {
  try {
    // const admin = await User.findById(req.body.userID);
    const admin = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    // const user = await User.findById(req.body.userId);
    const user = (await db.collection('users').where('_id', '==', req.body.user).get()).docs[0].data();
    if ((admin.rank == 'owner' && user.rank == 'user') || (admin.rank == 'admin' && user.rank == 'user') || (admin.rank == 'owner' && user.rank == 'admin')) {

      const promoteUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('rank', 'admin');
      // Change posts ranks
      (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
        await doc.ref.update('author.rank', 'admin');
      })
      if (!user.prefix.title) {
        const setPrefix = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('prefix.title', 'Admin');
        // Change posts titles
        (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
          await doc.ref.update('author.prefix.title', 'Admin');
        })
      }
      
      res.json({
        status: 'success',
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

// Demote User
router.post('/demo', postAuthToken, async (req, res) => {
  try {
    // const admin = await User.findById(req.body.userID);
    const admin = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    // const user = await User.findById(req.body.userId);
    const user = (await db.collection('users').where('_id', '==', req.body.user).get()).docs[0].data();
    if ((admin.rank == 'owner' && user.rank == 'user') || (admin.rank == 'admin' && user.rank == 'user') || (admin.rank == 'owner' && user.rank == 'admin')) {

      const demoteUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('rank', 'user');
      // change posts ranks
      (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
        await doc.ref.update('author.rank', 'user');
      })
      if (user.prefix.title == 'Admin') {
        const setPrefix = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('prefix.title', '');  
        // Change posts titles
        (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
          await doc.ref.update('author.prefix.title', '');
        })
      }
      
      res.json({
        status: 'success',
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

// Warn a user
router.post('/warn', postAuthToken, async (req, res) => {
    try {
      // const admin = await User.findById(req.body.adminID);
      const admin = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      // const user = await User.findById(req.body.userID);
      const user = (await db.collection('users').where('_id', '==', req.body.userId).get()).docs[0].data();
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
    } catch(err) {
      console.error(err);
    }
  })


module.exports = router;