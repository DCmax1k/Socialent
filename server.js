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
const JSONTransport = require('nodemailer/lib/json-transport');
app.use('/agreements', agreementsRoute);

// Testing purposes

// app.get('/test', async (req, res) => {
//   try {

//     // const refDoc = (await db.collection('users').doc('DCmax1k').get()).data();

//     // const account = (await db.collection('users').where('emailData.email', '==', 'dylan.caldwell35@gmail.com').get()).docs[0].ref.update('username', 'DCmax1k');
//     // const updateAccount = await (await account.get()).update('username', 'lololol');

//     // const accountsFollowers = (await db.collection('users').where('following', 'array-contains', '5f3cb80565f16405540c6de3').get()).docs.map(doc => doc.data());

//     // const createAccount = (await db.collection('users').add({
//     //   username: 'testing', 
//     //   date: 'hithere sir',
//     // }));

//     // const lastMessage = (await db.collection('conversations').where('_id', '==', '602680d2d63c190017bf2be1').get()).docs[0].data().messages[730];
//     // const lastMessage = (await Conversation.findById('602680d2d63c190017bf2be1')).messages[730];

//     const testing = (await db.collection('conversations').where('people', '==', 'asldfkasjdf').get()).docs.map(doc => doc.data());

//     res.send(testing);
//   } catch(err) {
//     console.error(err);
//   }
// });

// app.get('/copyusers', async (req, res) => {
//   try {
//     const users = await User.find();
//     users.forEach(async user => {
//       try {
//         const userid1 = JSON.stringify(user._id).split('');
//         userid1.pop();
//         userid1.shift();
//         userid1.join('');
//         const userid = userid1.join('');
//         const usersWarnings = user.warnings.map(warning => { return { text: warning[0], active: warning[1] }})
//         const userData = {
//           _id: userid,
//           score: user.score,
//           emailData: {
//             email: user.emailData.email,
//             verified: user.emailData.verified || false,
//             emailCode: user.emailData.emailCode || 0000,
//           },
//           name: user.name,
//           username: user.username,
//           prefix: user.prefix || '',
//           password: user.password,
//           devices: user.devices || [],
//           status: user.status || 'online',
//           rank: user.rank,
//           profileImg: user.profileImg,
//           description: user.description || '',
//           following: user.following,
//           warnings: usersWarnings,
//           dateJoined: Date.now(),
//         };
//         const setUser = await db.collection('users').doc(userData.username).set(userData);
//       } catch(err) {    
//         console.error(err);
//       }
//     })
//     res.send('donedone');
//   } catch(err) {
//     console.error(err);
//   }
// });

// app.get('/copyposts', async (req, res) => {
//   try {
//     const posts = await Post.find();
//     posts.forEach(async post => {
//       try {
//         const postid1 = JSON.stringify(post._id).split('');
//         postid1.pop();
//         postid1.shift();
//         const postid = postid1.join('');
//         const authorid1 = JSON.stringify(post.author._id).split('');
//         authorid1.pop();
//         authorid1.shift();
//         const authorid = authorid1.join('');
//         const postsComments = post.comments.map(comment => {return {username: comment[0], value: comment[1], date: comment[2]}});
//         const postData = {
//           _id: postid,
//           active: post.active,
//           author: {
//             _id: authorid,
//             profileImg: post.author.profileImg,
//             username: post.author.username,
//           },
//           url: post.url,
//           urlType: post.urlType,
//           description: post.description,
//           likes: post.likes,
//           comments: postsComments,
//           date: post.date,
//         };
//         const setPost = await db.collection('posts').doc(postData._id).set(postData);
//       } catch(err) {    
//         console.error(err);
//       }
//     })
//     res.send('donedone');
//   } catch(err) {
//     console.error(err);
//   }
// });

// app.get('/copyconvos', async (req, res) => {
//   try {
//     const conversations = await Conversation.find();
//     conversations.forEach(async conversation => {
//       try {
//         const conversationid1 = JSON.stringify(conversation._id).split('');
//         conversationid1.pop();
//         conversationid1.shift();
//         const conversationid = conversationid1.join('');
//         let seen = 'read';
//         let seenFor = '';
//         const conversationsMessages = conversation.messages.map(message => { 
//           const senderID = JSON.stringify(message.sender).split('');
//           senderID.pop();
//           senderID.shift();
//           const newSender = senderID.join('');
//           if (message.seen === 'unread') {
//             seen = 'unread';
//           }
//           let forSeenFor = JSON.stringify(message.sender) === conversation.people[0] ? conversation.people[1] : conversation.people[0];
//           forSeenFor = JSON.stringify(forSeenFor).split('');
//           forSeenFor.pop();
//           forSeenFor.shift();
//           seenFor = forSeenFor.join('');

//           return { sender: newSender, value: message.value, type: message.type, date: message.date}
//         });
//         const userData = {
//           _id: conversationid,
//           people: conversation.people,
//           messages: conversationsMessages,
//           dateActive: conversation.dateActive,
//           seen,
//           seenFor,
//         };
//         const person1 = (await db.collection('users').where('_id', '==', userData.people[0]).get()).docs[0].data().username;
//         const person2 = (await db.collection('users').where('_id', '==', userData.people[1]).get()).docs[0].data().username;
//         const setUser = await db.collection('conversations').doc(`${person1}, ${person2}`).set(userData);
//       } catch(err) {    
//         console.error(err);
//       }
//     })
//     res.send('donedone');
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
app.listen(process.env.PORT || 3000, () => {
  console.log('Listening...');
});
