const express = require('express');
const app = express();
// const mongoose = require('mongoose');
require('dotenv').config();

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

// View Engine
app.set('view engine', 'ejs');

// Index Route
app.get('/', (req, res) => {
  res.render('index');
});

// Device verification
app.post('/deviceverification', async (req, res) => {
  try {
    // const user = await User.findById(req.query.k);
    const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].data();
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

app.get('/proxy', (req, res) => {
  res.render('proxy');
})

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
app.use('/agreements', agreementsRoute);

const forgotpasswordRoute = require('./routes/forgotpassword');
app.use('/forgotpassword', forgotpasswordRoute);

const bookRoute = require('./routes/book');
app.use('/book', bookRoute);

// // Testing purposes
// app.get('/test', async (req, res) => {
//   res.render('test');
//   // res.sendFile(`${__dirname}/public/images/SocialentLogo.png`);
//   // try {
//   //   (await db.collection('users').get()).docs.forEach( async doc => {
//   //     await doc.ref.update('ips', []);
//   //   });

//   //   res.send('done');
//   // } catch(err) {
//   //   console.error(err);
//   // }
// });
// app.post('/test', async (req, res) => {
//   console.log(req.body);
// })


// DB connection
// mongoose.connect(
//   process.env.DB_CONNECTION,
//   { useNewUrlParser: true, useUnifiedTopology: true },
//   () => {
//     console.log('Connected to DB');
//   }
// );



// PORT
app.listen(process.env.PORT || 80, () => {
  console.log('Listening...');
});
