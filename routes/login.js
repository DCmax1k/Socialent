const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

const User = require('../models/User');

// Login page
router.get('/', async (req, res) => {
  res.render('login');
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
      res.json({
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

module.exports = router;
