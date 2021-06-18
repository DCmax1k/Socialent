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
      if (user.status === 'online') {
        res.render('search', { user });
      } else {
        res.redirect('/login');
      }
  } catch (err) {
    console.error(err);
  }
});
router.post('/getfromapp', postAuthToken, async (req, res) => {
  try {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
      if (user.status === 'online') {
        return res.json({user});
      } else {
        return res.json({status: 'unseccessful'});
      }
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
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    if (user.status === 'online') {
      // Search for account by username
      const dupeDataUsernames = [];
      const searchUsername = (await db.collection('users').get()).docs.map(userDoc => userDoc.data()).filter((account) => {
        if (
          account.username.toLowerCase().includes(req.body.value.toLowerCase())
        ) {
          dupeDataUsernames.push(account.username);
          return account;
        }
      });
      // Search for account by name
      const searchName = (await db.collection('users').get()).docs.map(userDoc => userDoc.data()).filter((account) => {
        if (account.name.toLowerCase().includes(req.body.value.toLowerCase()) && !dupeDataUsernames.includes(account.username)) {
          return account;
        }
      });

      const usersFound = [...searchUsername, ...searchName];
      usersFound.sort((a, b) => {
        return a.score - b.score;
      });
      
      res.json({
        searchedAccounts: usersFound,
        status: 'success',
      });
    } else {
      res.json({
        status: 'wrong user',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
