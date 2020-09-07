const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');

router.get('/', (req, res) => {
  res.render('signup');
});

// Create user
router.post('/', async (req, res) => {
  try {
    const findUserUsername = await User.find({
      username: req.body.username,
    });
    if (findUserUsername.length !== 0) {
      res.json({
        response: 'username taken',
      });
    } else {
      const createUser = await new User({
        emailData: { email: req.body.email, verified: false },
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
        devices: [req.body.device],
      });
      const saveUser = await createUser.save();
      res.json({
        response: 'account created',
        id: saveUser._id,
        username: saveUser.username,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
