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
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const push = require('web-push');
const webPushPublicKey = 'BMYNc0LpoUTcG2Qwg9tHgXDDrPGqYovkmEKDcHeJ_CQZA5X7P_UE5jZrYBsEDK_JgrMMCvE0RhjDvQPzKN-JPI0';
const webPushPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY;

push.setVapidDetails('mailto:help@socialentapp.com', webPushPublicKey, webPushPrivateKey);


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
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');

const firebaseConfig = {
    apiKey: "AIzaSyBszobI7x_nesYhVx8DiAyQLfr8u0ylLis",
    authDomain: "socialent-f94ff.firebaseapp.com",
    projectId: "socialent-f94ff",
    storageBucket: "socialent-f94ff.appspot.com",
    messagingSenderId: "428560403379",
    appId: "1:428560403379:web:152fd51eada728a4fe99c6",
    measurementId: "G-DREZVEN0ME"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);


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

let sitemap;
app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');

    if (sitemap) {
        res.send(sitemap);
        return;
    }

    try {
      const allUsers = (await db.collection('users').get()).docs.map(doc => { return doc.data(); });
      const users = allUsers.map( user => `/account/${user.username}`);

      const smStream = new SitemapStream({ hostname: 'https://www.socialentapp.com/' });
      const pipeline = smStream.pipe(createGzip());

      smStream.write({ url: '/login'});
      smStream.write({ url: '/signup'});
      smStream.write({ url: '/agreements/termsofuse'});
      smStream.write({ url: '/agreements/privacypolicy'});
      smStream.write({ url: '/forgotpassword'});

      // Add each article URL to the stream
      users.forEach((item) => {
          // Update as required
          smStream.write({ url: item });
      });

      // cache the response
      streamToPromise(pipeline).then(sm => sitemap = sm);
      
      smStream.end();

      // Show errors and response
      pipeline.pipe(res).on('error', (e) => {throw e});
    } catch (e) {
        console.log(e);
    }
});


// Index Route
app.get('/', /*authHomeToken,*/ async (req, res) => {
  // const user = await (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
  // res.redirect(`/home`);
  res.render('index');
});

app.get('/proxy', authToken, async (req, res) => {
  const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    if (user.verified) {
        res.render('extras/proxy', { user: req.user });
    } else {
        res.render('extras/needVerify');
    }
});

app.get('/downloadimage', authToken, async (req, res) => {
  res.render('extras/downloadimage');
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

function authToken(req, res, next) {
  const token = req.cookies['auth-token'] || req.body.auth_token;
  if (token == null) return res.redirect('/login');
  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
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

const kahootRoute = require('./routes/extras/kahoot');
app.use('/kahoot', kahootRoute);

const edpuzzleRoute = require('./routes/extras/edpuzzle');
app.use('/edpuzzle', edpuzzleRoute);

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

app.post('/subscribe', authToken, async (req, res) => {
  try {
    const { sub } = req.body;
    await (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].ref.update('subscription', sub);
    res.json({
      success: true,
    });
  } catch(err) {
    console.error(err);
  }
});

// const puppeteer = require('puppeteer');

// TESTING PURPOSES
// app.get('/test', authToken, async (req, res) => {
//   const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
//   push.sendNotification(user.subscription, 'test payload');
//   res.render('testing');
//   // try {
//   //   // (await db.collection('users').get()).docs.forEach( async doc => {
//   //     try {
//   //       await doc.ref.update({tokens: 0});
//   //     } catch(err) {
//   //       console.error(err);
//   //     }
      
//   //   // });
//   //   res.send('done');

//   // } catch(err) {
//   //   console.error(err);
//   // }
// });




// PORT
server.listen(process.env.PORT || 80, () => {
  console.log('Listening...');
});