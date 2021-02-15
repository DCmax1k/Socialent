const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

// Models
const User = require('./models/User');
const Post = require('./models/Post');

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// View Engine
app.set('view engine', 'ejs');

// Index Route
app.get('/', (req, res) => {
  res.render('index');
});

// Device verification
app.post('/deviceverification', async (req, res) => {
  try {
    const user = await User.findById(req.query.k);
    if (!user.devices.includes(req.body.device)) {
      res.json({
        verified: false,
      });
    } else {
      res.json({
        verified: true,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Import Routes
const signupRoute = require('./routes/signup');
app.use('/signup', signupRoute);

const loginRoute = require('./routes/login');
app.use('/login', loginRoute);

const homeRoute = require('./routes/home');
app.use('/home', homeRoute);

const createRoute = require('./routes/create');
app.use('/create', createRoute);

const accountRoute = require('./routes/account');
app.use('/account', accountRoute);

const searchRoute = require('./routes/search');
app.use('/search', searchRoute);

const postRoute = require('./routes/post');
app.use('/post', postRoute);

const messagesRoute = require('./routes/messages');
app.use('/messages', messagesRoute);

const agreementsRoute = require('./routes/agreements');
app.use('/agreements', (agreementsRoute));

// DB connection
mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log('Connected to DB');
  }
);

// PORT
app.listen(process.env.PORT || 3000);
