const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');

// const User = require('../models/User');

// GET route
router.get('/', authToken, async (req, res) => {
  try {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();

        res.render('search', { user });

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

// Searching for account route
router.post('/', postAuthToken, async (req, res) => {
  try {

      const searchUsers = (await db.collection('users').get()).docs.map(userDoc => userDoc.data()).map((account) => {
        if (
          account.username.toLowerCase().includes(req.body.value.toLowerCase()) || account.name.toLowerCase().includes(req.body.value.toLowerCase())
        ) {
          return {
            username: account.username,
            name: account.name,
            profileImg: account.profileImg,
            verified: account.verified,
            prefix: account.prefix,
            score: account.score,
            rank: account.rank,
          };
        } else {
          return null;
        }
      }).filter(user => user !== null);
      searchUsers.sort((a, b) => {
        return a.score - b.score;
      });
      
      res.json({
        searchedAccounts: searchUsers,
        status: 'success',
      });

  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
