const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

// const request = require('request');

// const kahoot = require("kahoot.js-api");

// const savedKahootData = {};
// const fetchKahootData = async (uuid) => {
//   request(`https://create.kahoot.it/rest/kahoots/${uuid}/card/?includeKahoot=true`, (error, response, html) => {
//     if (!error && response.statusCode == 200) {
//       const body = JSON.parse(html);

//       const questions = body.kahoot.questions.map((que, f) => {
//         let indexCorrect = 0;
//         let answerCorrect = '';
//         que.choices.forEach((choi, i) => {
//           if (choi.correct) {
//             indexCorrect = i
//             answerCorrect = choi.answer;
//           };
//         });
//         return {
//           index: f,
//           indexCorrect,
//           answerCorrect,
//         };
//       });
//       const finalObj = {
//         uuid: body.kahoot.uuid,
//         questions,
//       };

//       savedKahootData[body.kahoot.uuid] = finalObj;
//       // console.log(finalObj);
//     }
//   });
// };

function authToken(req, res, next) {
  const token = req.cookies['auth-token'] || req.body.auth_token;
  if (token == null) return res.redirect('/login?rd=kahoot');
  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
      if (err) return res.redirect('/login?rd=kahoot');
      req.user = user;
      next();
  });
}

router.get('/', authToken, async (req, res) => {
  const user = (await db.collection('users').where('_id', '==', req.user._id).get()).docs[0].data();
    if (user.addons.includes('kahoot')) {
        res.render('extras/kahoot');
    } else {
        res.render('extras/needVerify');
    }
});

// router.post('/joingame', authToken, async (req, res) => {
//   try {
//     let uuid = '';
//     if (req.body.uuid) {
//       uuid = req.body.uuid;
//       if (!savedKahootData[uuid]) {
//         fetchKahootData(req.body.uuid);
//       }
//     }
//     const delay = parseInt(req.body.delay);
//     let pin = req.body.pin;
//     let bots = parseInt(req.body.bots);
//     if (bots > 100) bots = 100;
//     if (bots > 0) {
//       for (var i = 1; i <= req.body.bots; i++) {
//         const client = new kahoot();
//         client.uuid = uuid;
//         const botName = req.body.name + (i == 1 ? '' : i);
         
//         client.on("Joined", () => {
//           // console.log("I joined the Kahoot!");
//         });
//         client.on("QuizStart", () => {
//           // console.log("The quiz has started!");
//         });
//         client.on("QuestionStart", question => {
//           if (savedKahootData[client.uuid]) {
//             const currectAnswerIndex = savedKahootData[client.uuid].questions[question.questionIndex].indexCorrect;
//             console.log('QUESTION, ', question);
//             // Wait for delay
//             setTimeout(() => {
//               question.answer(currectAnswerIndex);
//             }, (Math.random() * delay) * 1000);
//           } else {
//             const amountOfQuestions = question.numberOfChoices;
//             // Wait for delay
//             setTimeout(() => {
//               question.answer(question.answer(Math.floor(Math.random() * amountOfQuestions)));
//             }, (Math.random() * delay) * 1000);
//             // console.log('No saved Data');
            
//           }
//         });
//         client.on("QuizEnd", () => {
//           // console.log("The quiz has ended.");
//         });
//         client.join(pin, botName);
//       }
//     } else {
//       return res.json({
//         status: 'Number of bots is undefined!',
//       });
//     }
//     res.json({
//       status: 'DONE!',
//     });
//   } catch(err) {
//     console.error(err);
//   }
// });

// router.post('/searchuuid', authToken, async (req, res) => {
//   // https://create.kahoot.it/rest/kahoots/?query=sports
//   try {
//     const query = req.body.query;
//     request(`https://create.kahoot.it/rest/kahoots/?query=${query}`, (error, response, html) => {
//       if (!error && response.statusCode == 200) {
//         const body = JSON.parse(html);
//         const kahoots = body.entities.map(kahoot => {
//           //console.log(kahoot);
//           return {
//             uuid: kahoot.card.uuid,
//             title: kahoot.card.title,
//             description: kahoot.card.description,
//             numberOfQuestions: kahoot.card.number_of_questions,
//             cover: kahoot.card.cover,
//             author: kahoot.card.creator_username,
//           };
//         });
//         res.json({
//           kahoots,
//           status: 'success',
//         });
//       }
//     });
//   } catch(err) {
//     console.error(err);
//   }
// });

module.exports = router;