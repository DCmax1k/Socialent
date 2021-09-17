const express = require('express');
const router = express.Router();

const request = require('request');

const kahoot = require("kahoot.js-api");

const savedKahootData = {};
const fetchKahootData = async (uuid) => {
  request(`https://create.kahoot.it/rest/kahoots/${uuid}/card/?includeKahoot=true`, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const body = JSON.parse(html);

      const questions = body.kahoot.questions.map((que, f) => {
        let indexCorrect = 0;
        let answerCorrect = '';
        que.choices.forEach((choi, i) => {
          if (choi.correct) {
            indexCorrect = i
            answerCorrect = choi.answer;
          };
        });
        return {
          index: f,
          indexCorrect,
          answerCorrect,
        };
      });
      const finalObj = {
        uuid: body.kahoot.uuid,
        questions,
      };

      savedKahootData[body.kahoot.uuid] = finalObj;
      // console.log(finalObj);
    }
  });
};

router.get('/', (req, res) => {
  res.render('kahoot');
});

router.post('/joingame', async (req, res) => {
  try {
    let uuid = '';
    if (req.body.uuid) {
      uuid = req.body.uuid;
      if (!savedKahootData[uuid]) {
        fetchKahootData(req.body.uuid);
      }
    }
    let pin = req.body.pin;
    let bots = parseInt(req.body.bots);
    if (bots > 100) bots = 100;
    if (bots > 0) {
      for (var i = 1; i <= req.body.bots; i++) {
        const client = new kahoot();
        client.uuid = uuid;
        const botName = req.body.name + (i == 1 ? '' : i);
         
        client.on("Joined", () => {
          // console.log("I joined the Kahoot!");
        });
        client.on("QuizStart", () => {
          // console.log("The quiz has started!");
        });
        client.on("QuestionStart", question => {
          if (savedKahootData[client.uuid]) {
            const currectAnswerIndex = savedKahootData[client.uuid].questions[question.questionIndex].indexCorrect;
            // console.log('currectAnswerIndex, ', currectAnswerIndex);
            question.answer(currectAnswerIndex);
          } else {
            // console.log('No saved Data');
            question.answer(0);
          }
        });
        client.on("QuizEnd", () => {
          // console.log("The quiz has ended.");
        });
        client.join(pin, botName);
      }
    } else {
      return res.json({
        status: 'Number of bots is undefined!',
      });
    }
    res.json({
      status: 'DONE!',
    });
  } catch(err) {
    console.error(err);
  }
});

router.post('/searchuuid', async (req, res) => {
  // https://create.kahoot.it/rest/kahoots/?query=sports
  try {
    const query = req.body.query;
    request(`https://create.kahoot.it/rest/kahoots/?query=${query}`, (error, response, html) => {
      if (!error && response.statusCode == 200) {
        const body = JSON.parse(html);
        const kahoots = body.entities.map(kahoot => {
          return {
            uuid: kahoot.card.uuid,
            title: kahoot.card.title,
            description: kahoot.card.description,
            numberOfQuestions: kahoot.card.number_of_questions,
            cover: kahoot.card.cover,
          };
        });
        res.json({
          kahoots,
          status: 'success',
        });
      }
    });
  } catch(err) {
    console.error(err);
  }
});

module.exports = router;