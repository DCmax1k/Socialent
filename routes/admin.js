const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

router.get('/', authToken, (req, res) => {
    res.send(`Welcome ${req.user.name}`);
});

function authToken(req, res, next) {
    const token = req.cookies['auth-token'];
    if (token == null) return res.sendStatus(403);
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
    })
}


module.exports = router;