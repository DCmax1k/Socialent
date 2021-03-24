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
            const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.goto(url);
            let document = await page.evaluate(() => document.documentElement.outerHTML);
            document = absolutify(document, `/proxy/window/?url=${url}`)
            return res.send(document);
        } catch(err) {
            console.error(err);
        }
        

    }

})


module.exports = router;

