const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const publicIp = require('public-ip');
const jwt = require('jsonwebtoken');

// const User = require('../models/User');

router.get('/', (req, res) => {
  res.render('signup');
});

// Create user
router.post('/', async (req, res) => {
  try {
    // const findUserUsername = await User.find({username: req.body.username,});
    const findUserUsername = (await db.collection('users').where('username', '==', req.body.username).get()).docs.map(doc => doc.data());
    if (findUserUsername.length !== 0) {
      res.json({
        response: 'username taken',
      });
    } else {
      const newID = Date.now().toString(16) + Math.random().toString(16).slice(2);
      const currentIP = await publicIp.v4();
      const createUserData = {
        _id: newID,
        emailData: { email: req.body.email, verified: false },
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        score: 0,
        prefix: { title: ''},
        status: 'online',
        rank: 'user',
        profileImg: 'none',
        description: '',
        following: [],
        warnings: [],
        dateJoined: Date.now(),
        lastOnline: Date.now(),
        ips: [currentIP],
      };
      const createUser = await db.collection('users').doc(createUserData.username).set(createUserData);
      const accessToken = jwt.sign({_id: newID, username: createUserData.username, name: createUserData.name}, process.env.ACCESS_SECRET, { expiresIn: '1d'});
      res.cookie('auth-token', accessToken).json({
        response: 'account created',
        id: newID,
        username: req.body.username,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
