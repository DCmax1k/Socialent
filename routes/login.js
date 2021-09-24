const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


// const User = require('../models/User');

// Login page
router.get('/', authLoginToken, async (req, res) => {
  const user = await (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
  res.redirect(`/home?k=${user._id}`);
});

// Login request
router.post('/', async (req, res) => {
  // const findUsername = await User.findOne({ username: req.body.username });
  const findUsername = (await db.collection('users').where('username', '==', req.body.username).get()).docs.map(doc => doc.data())[0];
  if (findUsername) {
    // if (findUsername.password === req.body.password) {
      if (await bcrypt.compare(req.body.password, findUsername.password)) {
      // Set Last Online
      // const setLastOnline = await (await db.collection('users').where('_id', '==', findUsername._id).get()).docs[0].ref.update('lastOnline', Date.now());
      // Set JSON Web Token
      const accessToken = jwt.sign({_id: findUsername._id, username: findUsername.username, name: findUsername.name}, process.env.ACCESS_SECRET, { expiresIn: '1d'});
      res.cookie('auth-token', accessToken, { sameSite: 'none', secure: true }).json({
        response: 'logged in',
        auth_token: accessToken,
        id: findUsername._id,
        user: findUsername,
      });
    } else {
      res.json({
        response: 'wrong password',
      });
    }
  } else {
    res.json({
      response: 'wrong username',
    });
  }
});

// Login request from mobile app
router.post('/fromapp', async (req, res) => {
  // const findUsername = await User.findOne({ username: req.body.username });
  const findUsername = (await db.collection('users').where('username', '==', req.body.username).get()).docs.map(doc => doc.data())[0];
  if (findUsername) {
    // if (findUsername.password === req.body.password) {
      if (await bcrypt.compare(req.body.password, findUsername.password)) {
      // Set Last Online
      const setLastOnline = await (await db.collection('users').where('_id', '==', findUsername._id).get()).docs[0].ref.update('lastOnline', Date.now());
      // Set JSON Web Token
      const accessToken = jwt.sign({_id: findUsername._id, username: findUsername.username, name: findUsername.name}, process.env.ACCESS_SECRET);
      res.cookie('auth-token', accessToken).json({
        response: 'logged in',
        auth_token: accessToken,
        id: findUsername._id,
        user: findUsername,
      });
    } else {
      res.json({
        response: 'wrong password',
      });
    }
  } else {
    res.json({
      response: 'wrong username',
    });
  }
});

function authLoginToken(req, res, next) {
  const token = req.cookies['auth-token'];
  if (token == null) return res.render('login');
  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) return res.render('login');
    req.user = user;
    next();
  })
}

module.exports = router;
