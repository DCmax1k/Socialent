const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Post = require('../models/Post');

// Get route
router.get('/', async (req, res) => {
  try {
    if (req.query.k) {
      const user = await User.findById(req.query.k);
      if (user.status === 'online') {
        res.render('create', { user });
      }
    } else {
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
  }
});

// Create post
router.post('/createpost', async (req, res) => {
  try {
    const user = await User.findById(req.body.userID);
    const createPost = await new Post({
      author: {
        _id: user._id,
        username: user.username,
        profileImg: user.profileImg,
      },
      img: req.body.url,
      description: req.body.description,
    });
    const savePost = await createPost.save();
    res.json({
      status: 'successful',
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
