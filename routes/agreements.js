const express = require('express');
const router = require('./signup');

router.get('/termsofuse', (req, res) => {
    res.render('terms');
});

router.get('/privacypolicy', (req, res) => {
    res.render('privacy');
});

module.exports = router;