const express = require('express');
const router = express.Router();
// const nodemailer = require('nodemailer');
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// const { google } = require('googleapis');
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;
// const REDIRECT_URI = process.env.REDIRECT_URI;
// const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});



// const User = require('../models/User');
// const Post = require('../models/Post');

const deleteUser = require('../globalFunctions/deleteAccount');

// Get Route
router.get('/:username', async (req, res) => {
  try {

    const account = (await db.collection('users').where('username', '==', req.params.username).get()).docs[0].data();
    const oriAccountsPosts = (await db.collection('posts').where('author._id', '==', account._id).get()).docs.map(doc => doc.data());
    const accountsFollowers = (await db.collection('users').where('following', 'array-contains', account._id).get()).docs.map(doc => doc.data()).sort((a,b) => b.score-a.score);
    const oriAccountsFollowing = (await db.collection('users').get()).docs.map(doc => doc.data());
    const accountsFollowing = oriAccountsFollowing.filter(acc => {
      if (account.following.includes(acc._id)) {
        return acc;
      }
    }).sort((a,b) => b.score-a.score);
    const accountsPosts = oriAccountsPosts.filter(post => {
      if (post.active) {
        return post;
      }
    }).sort((a,b) => a.date-b.date);
    // const account = await User.findOne({ username: req.params.username });
    // const accountsPosts = await Post.find({ 'author._id': account._id, active: true });
    // const accountsFollowers = await User.find({following: account._id});

    // const accountsFollowers = [];
    // allUsers.forEach((allUser) => {
    //   if (allUser.following.includes(account._id)) {
    //     accountsFollowers.push(allUser._id);
    //   }
    // });
    if (req.query.k) {
      // const user = await User.findById(req.query.k);
      const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].data();
      if (user.status === 'online') {
        // Set Last Online
        const setLastOnline = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('lastOnline', Date.now());
        res.render('account', {
          user,
          account,
          accountsFollowers,
          accountsFollowing,
          accountsPosts,
          loggedin: true,
        });
      } else {
        res.redirect('/login');
      }
    } else {
      res.render('account', {
        user: null,
        account,
        accountsFollowers,
        accountsFollowing,
        accountsPosts,
        loggedin: false,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Set users prefix
router.post('/setusersprefix', async (req, res) => {
  try {
    // const admin = await User.findById(req.body.userID);
    // const user = await User.findOne({username: req.body.accountUsername});
    const admin = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    const user = (await db.collection('users').where('username', '==', req.body.accountUsername).get()).docs[0].data();
    if (((user.rank === 'owner' && admin.rank === 'owner') || (admin.rank === 'owner' && user.rank === 'admin') || (admin.rank === 'admin' && user.rank !== 'owner') || (user.rank === 'user' && (admin.rank === 'owner' || admin.rank === 'admin'))) && admin.devices.includes(req.body.device)) {
      // const updateUser = await User.findByIdAndUpdate(user._id, { 'prefix.title': req.body.usersPrefix }, { useFindAndModify: false });
      // const saveUser = await updateUser.save();
      const updateUser = await (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].ref.update('prefix.title', req.body.usersPrefix);
      res.json({
        status: 'success',
        prefix: req.body.usersPrefix,
        prefixActive: user.prefix.active,
        usersRank: user.rank,
      });
    } else {
      res.json({
        status: 'not admin',
      });
    }
  } catch(err) {
    console.error(err);
  }
})

// Change Profile Img
router.post('/changeimg', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();

    if (user.status === 'online' && user.devices.includes(req.body.device)) {

      // Update profile pic
      // const updateProfileImg = await User.findByIdAndUpdate( user._id, { profileImg: req.body.imgURL, }, { useFindAndModify: false });
      // const saveUser = await updateProfileImg.save();
      const updateProfileImg = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('profileImg', req.body.imgURL);

      // Update posts with new pic
      // const updatePosts = await Post.updateMany( {'author._id': user._id}, {'author.profileImg': req.body.imgURL});
      const updatePosts = (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
        try {
          const updateDoc = await doc.ref.update('author.profileImg', req.body.imgURL);
        } catch(err) {
          console.error(err);
        }
      });

      res.json({
        status: 'success',
      });
    } else {
      res.json({
        status: 'error',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Delete Account
// router.post('/deleteaccount', async (req, res) => {
//   try {
//     const user = await User.findById(req.body.userID);
//     if (user.status === 'online' && user.devices.includes(req.body.device)) {
//       const deleteAllPosts = await Post.deleteMany({ 'author._id': user._id });
//       const deleteIdsFromFollowing = await User.updateMany({
//         $pull: { following: user._id },
//       });
//       const deleteUser = await User.deleteOne({ _id: user._id });
//       res.json({
//         status: 'success',
//       });
//     } else {
//       res.json({
//         status: 'unseccessful',
//       });
//     }
//   } catch (err) {
//     console.error(err);
//   }
// });

// Delete account using global funciton
router.post('/deleteaccount', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      const deleteTheUser = await deleteUser(user._id);
      if (deleteTheUser === 'success') {
        res.json({
          status: 'success',
        })
      }
    }
  } catch(err) {
    console.error(err);
  }
})

// Follow
router.post('/followprofile', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const account = await User.findById(req.body.accountID);
      const account = (await db.collection('users').where('_id', '==', req.body.accountID).get()).docs[0].data();
      if (!user.following.includes(account._id)) {
        // Follow
        // const updateFollowing = await User.findByIdAndUpdate(
        //   user._id,
        //   { $push: { following: account._id } },
        //   { useFindAndModify: false }
        // );
        // const saveFollowing = await updateFollowing.save();
        const followingArray = user.following;
        followingArray.push(account._id);
        const updateFollowing = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('following', followingArray);
        res.json({
          status: 'success',
          which: 'now following',
        });
      } else {
        // Unfollow
        const followingArr = user.following;
        const index = followingArr.indexOf(account._id);
        followingArr.splice(index, 1);
        // const updateFollowing = await User.findByIdAndUpdate(
        //   user._id,
        //   { following: followingArr },
        //   { useFindAndModify: false }
        // );
        // const saveFollowing = await updateFollowing.save();
        const updateFollowing = await  (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('following', followingArr);
        res.json({
          status: 'success',
          which: 'not following',
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// Edit profile

// Check email verification
router.post('/editprofile/verifyemail/checkverification', async (req, res) => {
  try {
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    //const user = await User.findById(req.body.userID);
    res.json({
      verified: user.emailData.verified,
    });
  } catch (err) {
    console.error(err);
  }
});

// Verify Email - send email
router.post('/editprofile/verifyemail', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      let verifyEmailCode = JSON.stringify(Math.random())
        .split('')
        .slice(2)
        .join('');
      // const updateEmailCode = await User.findByIdAndUpdate(user._id,{'emailData.emailCode': verifyEmailCode,},{ useFindAndModify: false });
      // const saveUser = await updateEmailCode.save();
      const updateEmailCode = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('emailData.emailCode', verifyEmailCode);

      // MAIL 
      // Email Transporter
      // const accessToken = await oAuth2Client.getAccessToken();
      // const transporter = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     type: 'OAuth2',
      //     user: 'noreplydevapp@gmail.com',
      //     clientId: CLIENT_ID,
      //     clientSecret: CLIENT_SECRET,
      //     refreshToken: REFRESH_TOKEN,
      //     accessToken: accessToken,

      //   },
      // });
      // const mailOptions = {
      //   from: 'Socialent',
      //   to: user.emailData.email,
      //   subject: 'Verify Email',
      //   html: `
      //   <h1>Socialent: Verify Email</h1>
      //   <hr />
      //   <h2>${user.username}</h2>
      //   <br />
      //   Please click <a href="${process.env.DOMAIN}/account/editprofile/verifyemail/${user._id}?ec=${verifyEmailCode}" >here</a>, or copy this URL: ${process.env.DOMAIN}/account/editprofile/verifyemail/${user._id}?ec=${verifyEmailCode} : to verify your email!
      //   <br />
      //   <hr />
      //   <br />
      //   If you do not know why you reveived this email, please ignore it.
      //   `,
      // };
      // transporter.sendMail(mailOptions, (err, data) => {
      //   if (err) console.error(err);
      // });
      const msg = {
        to: user.emailData.email,
        from: 'noreplydevapp@gmail.com',
        subject: 'Verify Email',
        html: 
        `
        <h1>Socialent: Verify Email</h1>
        <hr />
        <h2>${user.username}</h2>
        <br />
        Please click <a href="${process.env.DOMAIN}/account/editprofile/verifyemail/${user._id}?ec=${verifyEmailCode}" >here</a>, or copy this URL: ${process.env.DOMAIN}/account/editprofile/verifyemail/${user._id}?ec=${verifyEmailCode} : to verify your email!
        <br />
        <hr />
        <br />
        If you do not know why you reveived this email, please ignore it.
        `,
      }
      const sendMail = await sgMail.send(msg);

      res.json({
        status: 'sent email',
        email: user.emailData.email,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Verify Email - from email
router.get('/editprofile/verifyemail/:userId', async (req, res) => {
  try {
    // const user = await User.findById(req.params.userId);
    const user = (await db.collection('users').where('_id', '==', req.params.userId).get()).docs[0].data();
    if (user.emailData.emailCode === req.query.ec) {
      // const updateUser = await User.findByIdAndUpdate(user._id,{ 'emailData.verified': true },{ useFindAndModify: false });
      // const saveUser = await updateUser.save();
      const updateUser = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('emailData.verified', true);
      res.send(`Successfully verified the email ${user.emailData.email}!`);
    }
  } catch (err) {
    console.error(err);
  }
});

// Change Password
router.post('/editprofile/changepassword', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      if (req.body.currentPassword === user.password) {
        // const updatePassword = await User.findByIdAndUpdate(user._id,{password: req.body.newPassword,},{ useFindAndModify: false });
        // const saveUser = await updatePassword.save();
        const updatePassword = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('password', req.body.newPassword);
        res.json({
          status: 'success',
        });
      } else {
        res.json({
          status: 'incorrect password',
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// Change name
router.post('/editprofile/changename', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const updateName = await User.findByIdAndUpdate(user._id,{name: req.body.name,},{ useFindAndModify: false });
      // const saveUser = await updateName.save();
      const updateName = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('name', req.body.name);
      res.json({
        status: 'success',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Change email
router.post('/editprofile/changeemail', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const updateEmail = await User.findByIdAndUpdate(user._id,{'emailData.email': req.body.email,},{ useFindAndModify: false });
      // const saveUser = await updateEmail.save();
      const updateEmail = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('emailData.email', req.body.email);
      // const updateVerified = await User.findByIdAndUpdate(user._id,{ 'emailData.verified': false },{ useFindAndModify: false });
      // const saveVerified = await updateVerified.save();
      const updateVerified = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('emailData.verified', false);
      res.json({
        status: 'success',
      });
    }
  } catch (err) {
    console.error(err);
  }
});

// Update Bio
router.post('/editprofile/updatebio', async (req, res) => {
  try {
    // const user = await User.findById(req.body.userID);
    const user = (await db.collection('users').where('_id', '==', req.body.userID).get()).docs[0].data();
    if (user.status === 'online' && user.devices.includes(req.body.device)) {
      // const update = await User.findByIdAndUpdate(user._id,{ description: req.body.bio },{ useFindAndModify: false });
      // const save = await update.save();
      const updateBio = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('description', req.body.bio);
      res.json({
        status: 'successful',
        bio: req.body.bio,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
