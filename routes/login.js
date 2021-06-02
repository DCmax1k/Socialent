const { render } = require('ejs');
const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const jwt = require('jsonwebtoken');


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
    if (findUsername.password === req.body.password) {
      let oneSameDevice = false;
      findUsername.devices.forEach((device) => {
        if (device === req.body.device) {
          oneSameDevice = true;
        }
      });
      if (!oneSameDevice) {
        const currentDevices = findUsername.devices;
        currentDevices.push(req.body.device);
        // const updateDevices = await User.findByIdAndUpdate(findUsername._id,{$set: { devices: currentDevices },},{ useFindAndModify: false });
        // const saveDevices = await updateDevices.save();
        const updateDevices = await (await db.collection('users').where('_id', '==', findUsername._id).get()).docs[0].ref.update('devices', currentDevices);
      }
      if (findUsername.status != 'online') {
        // const changeStatus = await User.findByIdAndUpdate(findUsername._id,{$set: { status: 'online' },},{ useFindAndModify: false });
        // const saveUser = await changeStatus.save();
        const changeStatus = await (await db.collection('users').where('_id', '==', findUsername._id).get()).docs[0].ref.update('status', 'online');
      }
      // Set Last Online
      const setLastOnline = await (await db.collection('users').where('_id', '==', findUsername._id).get()).docs[0].ref.update('lastOnline', Date.now());
      // Set JSON Web Token
      const accessToken = jwt.sign({_id: findUsername._id}, process.env.ACCESS_SECRET, { expiresIn: '1d'});
      res.cookie('auth-token', accessToken).json({
        response: 'logged in',
        id: findUsername._id,
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
