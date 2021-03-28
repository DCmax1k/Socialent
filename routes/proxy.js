const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const absolutify = require('absolutify');
const fetch = require('node-fetch');

router.get('/window', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        res.send('No url!');
    } else {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url);
            let document = await page.evaluate(() => document.documentElement.outerHTML);
            document = absolutify(document, `/proxy/window/?url=${url}`)
            return res.send(document);
        } catch(err) {
            console.error(err);
        }
        

    }

});

router.post('/checksite', async (req, res) => {
    try {
        const url = req.body.url;
        const blockedsites = ['youtube', 'porn', 'google'];
        if (blockedsites.some(v => url.indexOf(v) >= 0)) {
            res.json({
                status: 'blocked',
            });
        } else {
            let newURL = url;
            if (!newURL.includes('http')) {
                let arr = [newURL];
                arr.unshift('http://');
                newURL = arr.join('');
            }
            const encoded = Buffer.from(newURL, 'binary').toString('base64')
            res.json({
                status: 'success',
                fullURL: `https://proxy-socialent.herokuapp.com/prox/?url=${encoded}`,
            });
        }
    } catch(err) {
        console.error(err);
    }
})


module.exports = router;

