const form = document.querySelector("form");
const formCopy = document.querySelector("form");
const container = document.querySelector(".container");
const wrapper = document.querySelector(".wrapper");
const title = document.querySelector("h1");
const MAX_TIME = 30;
let userAnswers = {};
let currentStep = 0;
let finishedTopic = false;
let timeout = false;
let id = null;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const { nickname } = Object.fromEntries(data.entries());
  localStorage.setItem("nickname", nickname);
  wrapper.removeChild(form);

  renderTopics();
  //   for (let [key, value] of data.entries()) {
  //     console.log("key,value", key, value);
  //   }
});

// CREATING LIST TOPICS VIEWS
function renderTopics() {
  currentStep = 0;
  window.scrollTo(0, 0);
  const topicWrapper = elementCreator("div", ["topics-wrapper"]);
  TRIVIA_DATA.forEach((topic) => {
    const topicClasses = ["topic"];
    if (
      Object.prototype.toString.call(userAnswers[`topic${topic.id}`]) ===
      "[object Object]"
    ) {
      topicClasses.push("topic-selected");
    }
    const topicEl = elementCreator(
      "div",
      topicClasses,
      topic.topicName,
      "click",
      () => {
        userAnswers["topicData"] = topic;
        const topicsPlayed = Object.keys(userAnswers);
        const playingTopic = `topic${topic.id}`;
        finishedTopic = topicsPlayed.includes(playingTopic);
        if (!finishedTopic) {
          userAnswers[playingTopic] = {};
        }
        renderQuestions();
      }
    );
    topicWrapper.appendChild(topicEl);
  });
  wrapper.appendChild(topicWrapper);
  title.textContent = `HELLO ${localStorage.getItem(
    "nickname"
  )}, Select a TOPIC`;
}

function renderQuestions() {
  const topicWrapper = document.querySelector(".topics-wrapper");
  wrapper.removeChild(topicWrapper);
  //   creating child nodes
  const divQuestionWrapper = elementCreator("div", ["question-wrapper"]);
  const divContainerButtons = elementCreator("div", ["actions-buttons"]);

  const stepButtonPrevious = elementCreator(
    "button",
    ["button-styles", "previous-button"],
    "back",
    "click",
    () => {
      if (currentStep > 0) {
        currentStep--;
        divQuestionWrapper.insertBefore(
          renderOneQuestion(divQuestionWrapper),
          divContainerButtons
        );
        selectedAnswerHandler(currentStep);
        updatePreviousButtonAttribute();
        updateNextButtonAttribute();
        displayCounterDown();
      }
    }
  );
  const stepButtonNext = elementCreator(
    "button",
    ["button-styles", "next-button"],
    "Next",
    "click",
    () => {
      nextQuestion();
    }
  );

  if (finishedTopic) {
    divContainerButtons.appendChild(stepButtonPrevious);
    divContainerButtons.appendChild(stepButtonNext);
  }

  divQuestionWrapper.appendChild(divContainerButtons);

  //   render first time
  divQuestionWrapper.insertBefore(
    renderOneQuestion(divQuestionWrapper),
    divContainerButtons
  );
  wrapper.appendChild(divQuestionWrapper);
  selectedAnswerHandler();

  updatePreviousButtonAttribute();

  displayCounterDown();
  title.textContent = "Select an answer";
}

function updatePreviousButtonAttribute() {
  if (finishedTopic) {
    if (currentStep === 0) {
      document.querySelector(".previous-button").setAttribute("disabled", true);
    } else {
      document.querySelector(".previous-button").removeAttribute("disabled");
    }
  }
}

function updateNextButtonAttribute() {
  if (finishedTopic) {
    if (currentStep === userAnswers["topicData"].questions.length - 1) {
      document.querySelector(".next-button").textContent = "Finish";
    } else {
      document.querySelector(".next-button").textContent = "Next";
    }
  }
}

function checkSelectedAnswer() {
  const playingTopicId = userAnswers["topicData"].id;
  const selectedTopic = userAnswers[`topic${playingTopicId}`];
  const answer = selectedTopic[`question${currentStep}`];
  if (
    answer !== null ||
    answer !== undefined ||
    selectedTopic[`question${currentStep}_timeout`] === true
  ) {
    return true;
  } else {
    return false;
  }
}

function renderOneQuestion(divQuestionWrapper) {
  timeout = false;
  const questionObject = userAnswers["topicData"].questions[currentStep];
  const questionBody = document.querySelector(".question-body");
  questionBody && divQuestionWrapper.removeChild(questionBody);
  const divQuestionBody = elementCreator("div", ["question-body"]);

  divQuestionBody.appendChild(
    elementCreator("h1", ["question-title"], questionObject.question)
  );
  divQuestionBody.appendChild(getAnswers(questionObject.answers));
  return divQuestionBody;
}

function displayCounterDown() {
  if (!finishedTopic) {
    let time = MAX_TIME;
    clearInterval(id);
    document.querySelector(".countdown").style.display = "block";
    document.querySelector(".countdown").classList.remove("countdown-animated");

    const counterElement = document.querySelector(".countdown");
    counterElement.textContent = time;
    id = setInterval(() => {
      time = time - 1;
      counterElement.textContent = time;
      if (time === 10) {
        document
          .querySelector(".countdown")
          .classList.add("countdown-animated");
      }
      if (time <= 0) {
        userAnswers[`topic${userAnswers["topicData"].id}`][
          `question${currentStep}_timeout`
        ] = true;
        timeout = true;
        clearInterval(id);
        nextQuestion();
      }
    }, 1000);
  }
}

//
function getAnswers(answers) {
  const div = elementCreator("div", ["answersWrapper"]);
  const divAnswer = elementCreator("div", ["answers-container"]);
  answers.forEach((answer) => {
    divAnswer.appendChild(
      elementCreator("p", ["box-answer"], answer, "click", () => {
        if (finishedTopic) return;
        saveAnswer(answer);
      })
    );
  });
  div.appendChild(divAnswer);
  return div;
}

function saveAnswer(answer) {
  const playingTopic = userAnswers["topicData"];
  const selectedTopic = userAnswers[`topic${playingTopic.id}`];
  selectedTopic[`question${currentStep}`] = answer;

  // userAnswers[`topic${userAnswers["topicData"].id}`][`question${currentStep}`] = answer
  clearInterval(id);
  selectedAnswerHandler();
  nextQuestion();
}

function nextQuestion() {
  const divQuestionWrapper = document.querySelector(".question-wrapper");
  const divContainerButtons = document.querySelector(".actions-buttons");
  if (checkSelectedAnswer() || timeout) {
    if (currentStep < userAnswers["topicData"].questions.length - 1) {
      currentStep++;
      divQuestionWrapper.insertBefore(
        renderOneQuestion(divQuestionWrapper),
        divContainerButtons
      );
      selectedAnswerHandler(currentStep);
      updatePreviousButtonAttribute();
      updateNextButtonAttribute();
      displayCounterDown();
    } else {
      // render all question and results
      renderResult();
    }
  }
}
function selectedAnswerHandler() {
  const answer =
    userAnswers[`topic${userAnswers["topicData"].id}`][
      `question${currentStep}`
    ];
  const correctAnswer =
    userAnswers["topicData"].questions[currentStep].correctAnswer;
  const answerContainer = document.querySelector(".answers-container");

  for (let el of answerContainer.children) {
    // removing p classes
    el.classList.remove("selected-answer");
    if (el.textContent === answer) {
      const className = ["selected-answer"];
      if (finishedTopic) {
        className.push(
          el.textContent === correctAnswer
            ? "correct-answer"
            : "incorrect-answer"
        );
      }
      el.classList.add(...className);
    } else {
      if (finishedTopic && el.textContent === correctAnswer) {
        el.classList.add("correct-answer");
      }
    }
  }
}

function renderResult() {
  clearInterval(id);
  document.querySelector(".countdown").style.display = "none";
  const topic = userAnswers["topicData"];
  let score = 0;
  const results = elementCreator("div", ["results-wrapper"]);

  topic.questions.forEach((q, index) => {
    const classes = ["question-result"]
    if (userAnswers[`topic${userAnswers["topicData"].id}`][`question${index}_timeout`]) {
      classes.push("question-result-timeout")
    }
    const questionElement = elementCreator("div", classes);
    const questionTitle = elementCreator("h2", [], q.question);
    questionElement.appendChild(questionTitle);
    q.answers.forEach((answer) => {
      const userAnswer =
        userAnswers[`topic${userAnswers["topicData"].id}`][`question${index}`];

      let resultsStyles = [];
      if (answer === userAnswer || answer === q.correctAnswer) {
        resultsStyles.push("correct-answer");
      }
      if (answer === userAnswer && answer !== q.correctAnswer) {
        resultsStyles.push("incorrect-answer");
      }
      if (answer === userAnswer && answer === q.correctAnswer) {
        score++;
      }

      const answerElement = elementCreator("p", resultsStyles, answer);
      questionElement.appendChild(answerElement);
    });
    results.appendChild(questionElement);
  });
  wrapper.removeChild(document.querySelector(".question-wrapper"));
  
  // score
  const scoreElement = elementCreator(
    "div",
    ["score"]
  );
  const totalQuestions = userAnswers["topicData"].questions.length
  scoreElement.innerHTML = `
  <svg viewBox="0 0 33.830989 33.830989" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle stroke="#4152ff" stroke-width="3" fill="none" cx="16.915494" cy="16.915494" r="14.915494"></circle>
    <circle stroke="#FFFFFF" stroke-width="3" stroke-dasharray="${(score/totalQuestions)*100},100 " stroke-linecap="round" fill="none" cx="16.91549431" cy="16.91549431" r="14.91549431" class="circle-chart__circle"></circle>
    <text class="text-svg" x="16.5" y="17.5">${score}/${totalQuestions}</text>
  </svg>`
  results.insertBefore(scoreElement, results.firstChild);
  const buttonPlayAgain = elementCreator(
    "button",
    ["play-again"],
    "Play Again",
    "click",
    () => {
      wrapper.removeChild(document.querySelector(".results-wrapper"));
      renderTopics();
    }
  );
  results.appendChild(buttonPlayAgain);
  wrapper.appendChild(results);
  title.textContent = "RESULTS";
}

// ["class1", "class2"]
function elementCreator(
  tagName,
  classes,
  textContent = null,
  eventType = null,
  eventHandler = null
) {
  const element = document.createElement(tagName);
  element.classList.add(...classes);
  element.textContent = textContent;
  if (typeof eventType === "string" && typeof eventHandler === "function") {
    element.addEventListener(eventType, eventHandler);
  }
  return element;
}
