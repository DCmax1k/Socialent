const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const firebase_admin = require('firebase_admin');
const db = firebase_admin.firestore();

const User = require('../models/User');

router.get('/', (req, res) => {
  res.render('signup');
});

// Create user
router.post('/', async (req, res) => {
  try {
    // const findUserUsername = await User.find({username: req.body.username,});
    const findUserUsername = (await db.collection('users').where('username', '==', req.body.username).get()).docs.map(doc => doc.ref.data());
    if (findUserUsername.length !== 0) {
      res.json({
        response: 'username taken',
      });
    } else {
//       const createUser = await new User({
//         emailData: { email: req.body.email, verified: false },
//         name: req.body.name,
//         username: req.body.username,
//         password: req.body.password,
//         devices: [req.body.device],
//       });
//       const saveUser = await createUser.save();
      // const newID = 
      const createUserData = {
//        _id: newID,
        emailData: { email: req.body.email, verified: false },
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        devices: [req.body.device],
      };
      const createUser = (await db.collection('users').add(createUserData))
      res.json({
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
