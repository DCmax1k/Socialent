const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

// const puppeteer = require('puppeteer');

function authToken(req, res, next) {
    const token = req.cookies['auth-token'] || req.body.auth_token;
    if (token == null) return res.redirect('/login?rd=edpuzzle');
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.redirect('/login?rd=edpuzzle');
        req.user = user;
        next();
    });
}

router.get('/', authToken, async (req, res) => {
    const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    if (user.addons.includes('edpuzzle')) {
        res.render('extras/edpuzzle');
    } else {
        res.render('extras/needVerify');
    }
});

module.exports = router;

