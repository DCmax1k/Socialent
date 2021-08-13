const express = require('express');
const app = express();

const server = require('http').createServer(app);
module.exports = server;

// const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const publicIp = require('public-ip');
const bcrypt = require('bcrypt');

const admin = require("firebase-admin");

// const serviceAccount = require("./serviceAccountKey.json");
const serviceAccount = {
  type: process.env.FB_TYPE,
  project_id: process.env.FB_PROJECT_ID,
  private_key_id: process.env.FB_PRIVATE_KEY_ID,
  private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FB_CLIENT_EMAIL,
  client_id: process.env.FB_CLIENT_ID,
  auth_uri: process.env.FB_AUTH_URI,
  token_uri: process.env.FB_TOEKN_URI,
  auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FB_CLIENT_X509_CERT_URL
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// Models
// const User = require('./models/User');
// const Post = require('./models/Post');
// const Conversation = require('./models/Conversation');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

// View Engine
app.set('view engine', 'ejs');

// Index Route
app.get('/', authHomeToken, async (req, res) => {
  const user = await (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
  res.redirect(`/home`);
});

app.get('/proxy', (req, res) => {
  res.render('proxy');
});

function authHomeToken(req, res, next) {
  if (req.hostname.includes('heroku')) return res.redirect('https://www.socialentapp.com');
  const token = req.cookies['auth-token'] || req.body.auth_token;
  if (token == null) return res.clearCookie('auth-token').render('index');
  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) return res.clearCookie('auth-token').render('index');
    req.user = user;
    next();
  })
}

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

const { messagesRoute } = require('./routes/messages');
app.use('/messages', messagesRoute);

const agreementsRoute = require('./routes/agreements');
app.use('/agreements', agreementsRoute);

const forgotpasswordRoute = require('./routes/forgotpassword');
app.use('/forgotpassword', forgotpasswordRoute);

const { adminRoute } = require('./routes/admin');
app.use('/admin', adminRoute);

const socketio = require('./utils/socketio');
app.use(socketio);

// Listener for successful payed transactions
app.post('/stripe/webhook', express.raw({type: 'application/json'}), async (request, response) => {
  const event = request.body;

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('payment succeeded');
      const paymentIntent = event.data.object;

      const user = (await db.collection('users').where('_id', '==', paymentIntent.metadata.userID).get()).docs[0].data();
      if (paymentIntent.metadata.product === 'tokens') {
        let currentTokens = user.tokens;
        if (paymentIntent.amount == 99) {
          currentTokens = currentTokens + 8;
        } else if (paymentIntent.amount == 499) {
          currentTokens = currentTokens + 50;
        } else if (paymentIntent.amount == 999) {
          currentTokens = currentTokens + 120;
        } else if (paymentIntent.amount == 1999) {
          currentTokens = currentTokens + 250;
        }
        (await db.collection('users').where('_id', '==', paymentIntent.metadata.userID).get()).docs[0].ref.update('tokens', currentTokens);
      }
      
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod was attached to a Customer!');
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.json({received: true});
});

// Testing purposes
// app.get('/test', async (req, res) => {
//   // res.sendFile(`${__dirname}/public/images/SocialentLogo.png`);
//   try {
//     // (await db.collection('users').get()).docs.forEach( async doc => {
//       try {
//         await doc.ref.update({tokens: 0});
//       } catch(err) {
//         console.error(err);
//       }
      
//     });
//     res.send('done');

//   } catch(err) {
//     console.error(err);
//   }
// });  


// DB connection
// mongoose.connect(
//   process.env.DB_CONNECTION,
//   { useNewUrlParser: true, useUnifiedTopology: true },
//   () => {
//     console.log('Connected to DB');
//   }
// );


// PORT
server.listen(process.env.PORT || 80, () => {
  console.log('Listening...');
});
