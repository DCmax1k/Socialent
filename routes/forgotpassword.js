const express = require('express');
const router = express.Router();
const firebase = require('firebase-admin');
const db = firebase.firestore();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get('/', (req, res) => {
    res.render('forgotpassword');
});

router.post('/sendemail', async (req, res) => {
    try {
        const checkUser = (await db.collection('users').where('emailData.email', '==', req.body.email).get()).docs;
        if (checkUser.length > 0) {
            const user = checkUser[0].data();
            const code = Math.floor(Math.random() * 900000 + 100000);
            const updateUsersCode = await (await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.update('emailData.emailCode', code);
            // Send Email
            /* const msg = {
                to: user.emailData.email,
                from: 'noreplydevapp@gmail.com',
                subject: 'Reset Password',
                html: 
                `
                <h1>Socialent: Reset Password</h1>
                <hr />
                <h2>${user.username}</h2>
                <br />
                Your 6 digit code is: ${code}
                <br />
                <hr />
                <br />
                If you do not know why you reveived this email, please ignore it.
                `,
            };
            const sendMail = await sgMail.send(msg);
            
            */
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'noreplydevapp@gmail.com',
                    //pass: 'llewdlac',        
                    pass: 'avxyrwztucrulqgu',        
                },
                tls: {
                    rejectUnauthorized: false,
                }
            })

            const mailOptions = {
                from: 'noreply@socialentapp.com',
                to: user.emailData.email,
                subject: 'Reset Password',
                html: `
                <h1>Socialent: Reset Password</h1>
                <hr />
                <h2>${user.username}</h2>
                <br />
                Your 6 digit code is: ${code}
                <br />
                <hr />
                <br />
                If you do not know why you reveived this email, please ignore it.
                `,
            };
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) return console.error(err);
            });
            
           res.json({
                status: 'success',
            });
        } else {
            res.json({
                status: 'No user with that email!',
            });
        }

    } catch(err) {
        console.error(err);
    }
});

router.post('/verifycode',  async (req, res) => {
    try {
        const checkUser = (await db.collection('users').where('emailData.email', '==', req.body.email).get()).docs;
        if (checkUser.length > 0) {
            if (req.body.code == checkUser[0].data().emailData.emailCode) {
                res.json({
                    status: 'success',
                });
            } else {
                res.json({
                    status: 'Wrong code! Be sure to copy the 6 digit code exactly.'
                })
            }
        } else {
            res.json({
                status: 'Something went wrong!',
            });
        }
    } catch(err) {
        console.error(err);
    }
});

router.post('/resetpassword',  async (req, res) => {
    try {
        const checkUser = (await db.collection('users').where('emailData.email', '==', req.body.email).get()).docs;
        if (checkUser.length > 0) {
            if (req.body.code == checkUser[0].data().emailData.emailCode) {
                if (req.body.password.length < 8) {
                    res.json({
                        status: 'Password must be at least 8 characters long!',
                    });
                } else if (req.body.password !== req.body.confirmPassword) {
                    res.json({
                        status: 'The confirm password input does not match the first input. They must match!',
                    });
                } else {
                    const hashedPassword = await bcrypt.hash(req.body.confirmPassword, 10);
                    const updatePassword = await checkUser[0].ref.update('password', hashedPassword);
                    const changeCode = await checkUser[0].ref.update('emailData.emailCode', Date.now().toString(16));
                    res.json({
                        status: 'success',
                    });
                }
            } else {
                res.json({
                    status: 'Wrong code! Be sure to copy the 6 digit code exactly.'
                })
            }
        } else {
            res.json({
                status: 'Something went wrong!',
            });
        }
    } catch(err) {
        console.error(err);
    }
});


module.exports = router;

