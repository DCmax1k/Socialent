const express = require('express');
const router = express.Router();
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

router.get('/', async (req, res) => {
    try {
        if (req.query.k) {
            const user = (await db.collection('users').where('_id', '==', req.query.k).get()).docs[0].data();
            if (user.rank === 'owner' || user.rank === 'admin') {
                res.render('book');
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        } 
    } catch(err) {
        console.error(err);
    }
    
});


module.exports = router;
