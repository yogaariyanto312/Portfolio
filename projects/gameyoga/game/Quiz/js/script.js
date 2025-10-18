//All variables within the code
var startButton = document.querySelector('#start');
var messageDisplay = document.querySelector('#message');
var results = document.getElementById('result');
var quizDiv = document.getElementById('quiz');
var quiz = document.getElementById('questionPlaceholder');
var score = 0;
var questionCounter = 0;
var userName;
var answers;

//Array containing the questions to be asked
var questions = [
  {
    question: 'HTML dibuat oleh tim berners-lee, seorang ahli??',
    answers: ['fisika', 'budaya', 'networking', 'network scurity', 'musik'],
    correctAnswer: 0,
  },

  {
    question: '#**# merupakan karakter yang terdapat pada type data?',
    answers: ['text', 'point', 'password', 'submit', 'radio'],
    correctAnswer: 2,
  },
  {
    question: 'apa yang singkatan dari html',
    answers: ['Hyper Text Markup', 'cascading style sheet', 'hypertext preprocessor', 'javascrip'],
    correctAnswer: 0,
  },
  {
    question: 'Perintah yang digunakan untuk mengkosongkan kolom pada HTML adalah...',
    answers: ['br6', 'submit', '&nbsp', 'tr', '&nsp'],
    correctAnswer: 2,
  },
  {
    question: 'perintah untuk mengganti baris pada HTML apa hayo',
    answers: ['tr', 'br', 'td', 'p', 'insert'],
    correctAnswer: 1,
  },
  {
    question: 'Hitunglah hasil dari -12 x (18 + (-27)) adalah',
    answers: ['108', '-216', '-108', '216', '256'],
    correctAnswer: 0,
  },
  {
    question: 'Hasil dari (2 + 7)2 - 82 adalah',
    answers: ['-17', '17', '22', '11', '-11'],
    correctAnswer: 1,
  },
  {
    question: 'Hasil dari 40 x 12 : (153 - 113) adalah',
    answers: ['14', '11', '13', '10', '12'],
    correctAnswer: 4,
  },
  {
    question: 'Perbandingan uang Tini dan Tono adalah 5 : 3 apabila selisih uang mereka Rp 12.000,00 maka uang Tono adalah',
    answers: ['Rp 48.000,00', 'Rp 20.000,00', 'Rp 6.000,00', 'Rp 18.000,00', 'RP 20.000,00'],
    correctAnswer: 3,
  },
  {
    question: 'Perbandingan banyak buah semangka dengan banyak buah melon adalah 5 : 3. Jika jumlah dua buah 72 biji, maka berapakah selisih antara buah semangka dengan buah melon?',
    answers: ['45 buah', '21 buah', '18 buah', '27 buah', '31 buah'],
    orrectAnswer: 2,
  },
];

//Add listener waiting on the user to press the start button
startButton.addEventListener('click', function () {
  var user = document.getElementById('userName').value;
  if (user != '') {
    //set the name and score and display the first question
    userName = user;
    quizDiv.style.display = 'block';
    document.getElementById('user').style.display = 'none';
    document.getElementById('name').innerHTML = 'Name: ' + userName;
    document.getElementById('score').innerHTML = 'Score: ' + score + '/20';
    nextQuestion();
  } else {
    //Display an alert if the user has not entered a name
    alert('masukin nama dulu anjim!');
  }
});

//Create the buttons that will hold answers to the question.
function createAnswerButton(index) {
  var buttons = "<div id='container'>";
  var item;
  var input = '';
  //Create 4 questions
  for (var i = 0; i < questions[index].answers.length; i++) {
    item = "<div class='answer'>";
    input = '<p id="text" name="answer" value=' + i + ' />';
    input += questions[index].answers[i];
    item = item + input + '</div>';
    buttons = buttons + item;
  }
  return buttons;
}

//Creates and returns the div that contains the questions and the answer selections
function createQuestion(index) {
  var questionDiv = "<div id='question'></div>";
  var header = '<h2>SOAL ' + (index + 1) + ':</h2>';
  questionDiv = questionDiv + header;
  var question = '<p >' + questions[index].question;
  questionDiv = questionDiv + question;
  var buttons = createAnswerButton(index);
  questionDiv = questionDiv + buttons;
  return questionDiv;
}

// Displays next question to the user
function nextQuestion() {
  //Remove the previous question
  if (document.getElementById('question')) {
    document.getElementById('question').remove();
  }

  //Displays the next question to the user
  if (questionCounter < questions.length) {
    var nextQuestion = createQuestion(questionCounter);
    quiz.innerHTML = nextQuestion;
    setUpListener();
    //Dislay the result to the user as no more questions left
  } else {
    quizDiv.style.display = 'none';
    results.style.display = 'block';
    getResults();
  }
}

//Set up a listener to wait for the users selection and check whether it is correct or not
function setUpListener() {
  answers = document.getElementsByClassName('answer');
  for (var i = 0; i < answers.length; i++) {
    answers[i].addEventListener('click', checkAnswer(i));
  }
}

//Check the users selected answer and update whether they were correct or not
function checkAnswer(i) {
  return function () {
    if (i === questions[questionCounter].correctAnswer) {
      correctAnswer();
    } else {
      incorrectAnswer();
    }
  };
}

//Updates score if the user was correct
function correctAnswer() {
  questionCounter++;
  score++;
  messageDisplay.textContent = 'anjay bener :)';
  messageDisplay.style.backgroundColor = '#cbffbb';
  document.getElementById('score').innerHTML = 'Score: ' + score + '/20';
  nextQuestion();
}

//Does not update score if user is incorrect
function incorrectAnswer() {
  messageDisplay.textContent = 'yahh salah :(';
  messageDisplay.style.backgroundColor = '#f6b2b2';
  questionCounter++;
  nextQuestion();
}

// Gets the result of the quiz and displays the appropiate medal back to the user
function getResults() {
  var result = '<h2>Score ' + score + '/20</h2>';
  if (score == 10) {
    //Gold Medal
    result += '<h4>Congratulations ' + userName + ' yee selamat anda mendapatkan mendali emas!</h4>';
    result += '<img class="medal" src="https://img.icons8.com/color/200/000000/medal2.png">';
  } else if (score > 5 && score < 20) {
    //Silver Medal
    result += '<h4>Good work ' + userName + ' selamat anda mendapatkan mendali silver!</h4>';
    result += '<img class="medal" src="https://img.icons8.com/color/200/000000/medal-second-place.png">';
  } else if (score > 1 && score < 15) {
    //Bronze Medal
    result += '<h4>Well Done ' + userName + ' anda mendapatkan mendali perunggu!</h4>';
    result += '<img class="medal" src="https://img.icons8.com/color/200/000000/medal2-third-place.png">';
  } else if (score <= 10) {
    //No Medal
    result += '<h4>tolol ' + userName + ' cupu sial ga bisa jawab huuuuuuuu!</h4>';
  }
  results.innerHTML += result;
}
