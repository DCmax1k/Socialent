const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

const User = require('../models/User');

// GET route
router.get('/', async (req, res) => {
  try {
    if (req.query.k) {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].ref.data();
      if (user.status === 'online') {
        res.render('search', { user });
      } else {
        res.redirect('/login');
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// Searching for account route
router.post('/', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].ref.data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // Search for account by username
      const searchUsername = (await db.collection('users').get()).map(userDoc => userDoc.ref.data()).filter((account) => {
        if (
          account.username.toLowerCase().includes(req.body.value.toLowerCase())
        ) {
          return account;
        }
      });
      // Search for account by name
      const searchName = (await db.collection('users').get()).map(userDoc => userDoc.ref.data()).filter((account) => {
        if (account.name.toLowerCase().includes(req.body.value.toLowerCase())) {
          return account;
        }
      });

      const usersFound = [...searchUsername, ...searchName];
      usersFound.sort((a, b) => {
        return a.score - b.score;
      });
      const deletedDupes = [];
      usersFound.forEach((account) => {
        if (!deletedDupes.includes(JSON.stringify(account))) {
          deletedDupes.push(JSON.stringify(account));
        }
      });
      res.json({
        searchedAccounts: deletedDupes,
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
