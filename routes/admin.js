const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

router.get('/', authToken, async (req, res) => {
    try {
        const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
        if (user.rank != 'admin' && user.rank != 'owner') return res.status(403).send('nice try lol')
        res.render('admin', {user});
    } catch(err) {
        console.error(err);
    }
});

function authToken(req, res, next) {
    const token = req.cookies['auth-token'];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}


module.exports = router;