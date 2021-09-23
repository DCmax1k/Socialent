const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

function authToken(req, res, next) {
    const token = req.cookies['auth-token'] || req.body.auth_token;
    if (token == null) return res.redirect('/login?rd=edpuzzle');
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.redirect('/login?rd=edpuzzle');
        req.user = user;
        next();
    });
}

router.get('/', authToken, (req, res) => {
    res.render('edpuzzle');
});


const scrapeDataFrom = async (scrapeID) => {
    // FIRST FROM URL: https://edpuzzle.com/api/v3/assignments/(code from url); data.teacherAssignments[0].contentID; then can get info from https://edpuzzle.com/api/v3/media/CONTENTID
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Login to ADMIN ACCOUNT
    await page.goto('https://www.edpuzzle.com');

  
    await page.click('.hidden-md.hidden-lg.fQ1t4fqKVH._3Zz5F9H2IZ');

    await page.click('._2w1-BNW32w._33wl7jxuFe._2oebyc6eFr._1NXfAQegcd._2TT-CHq6hp');

    await page.click('._33wl7jxuFe._1hmVhe2bx_._1NXfAQegcd._3Fkf7tortz');

    await page.type('#username', 'misunderstoodkillah@gmail.com');
    await page.type('#password', 'edpuzzlehack');
    await page.click('button[type=submit]');

    // wait for page to load
    await page.waitForNavigation( { waitUntil: 'networkidle2' } );

    // GET DATA FROM SCRAPE

    // FIRST FIND CONTENT ID
    await page.goto('https://edpuzzle.com/api/v3/assignments/' + scrapeID, {
        waitUntil: 'networkidle2'
    });

    const html = await page.evaluate(() => {
        return document.body.children[0].innerHTML;
    });
    const body = JSON.parse(html);
    if (body.error) return console.error(body.error);
    const contentID = body.teacherAssignments[0].contentId;

    // GET SCRAPE DATA WITH NEW ID
    await page.goto('https://edpuzzle.com/api/v3/media/' + contentID, {
        waitUntil: 'networkidle2',
    });

    const newhtml = await page.evaluate(() => {
        return document.body.children[0].innerHTML;
    });
    const data = JSON.parse(newhtml);
    
    
    await browser.close();

    return {
        questions: data.questions.sort((a, b) => a.time - b.time),
        title: data.title,
        img: data.thumbnailURL,
    }
}


router.post('/getdata', authToken, async (req, res) => {
    try {
        const data = await scrapeDataFrom(req.body.id);
        res.json({
            success: true,
            data,
        })
    } catch(err) {
        console.error(err);
    }
});

module.exports = router;

