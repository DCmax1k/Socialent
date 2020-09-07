const express = require('express');
const router = express.Router();

const User = require('../models/User');

// Login page
router.get('/', async (req, res) => {
  res.render('login');
});

// Login request
router.post('/', async (req, res) => {
  const findUsername = await User.findOne({ username: req.body.username });
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
        const updateDevices = await User.findByIdAndUpdate(
          findUsername._id,
          {
            $set: { devices: currentDevices },
          },
          { useFindAndModify: false }
        );
        const saveDevices = await updateDevices.save();
      }
      const changeStatus = await User.findByIdAndUpdate(
        findUsername._id,
        {
          $set: { status: 'online' },
        },
        { useFindAndModify: false }
      );
      const saveUser = await changeStatus.save();
      res.json({
        response: 'logged in',
        id: saveUser._id,
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
