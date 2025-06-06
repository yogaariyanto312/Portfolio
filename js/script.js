// typewriter
const texts = [
   "Network Engineer.",
   "Python Developer.",
   "Electrical Engineer.",
   "Web Developer."
];

let i = 0;
let j = 0;
let currentText = "";
let isDeleting = false;
const speed = 100;

function type() {
   currentText = texts[i];
   let displayedText = isDeleting
   ? currentText.substring(0, j--)
   : currentText.substring(0, j++);
   
   document.getElementById("typewriter").innerHTML = displayedText;
   
   if (!isDeleting && j === currentText.length) {
      isDeleting = true;
      setTimeout(type, 1500);
   } else if (isDeleting && j === 0) {
      isDeleting = false;
      i = (i + 1) % texts.length;
      setTimeout(type, 100);
   } else {
      setTimeout(type, isDeleting ? speed / 1 : speed);
   }
}

type();

// end typewriter

// skill
  function showTab(tab) {
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.skills-grid').forEach(grid => grid.classList.add('hidden'));

    document.getElementById(tab).classList.remove('hidden');
    if (tab === 'tech') {
      document.querySelectorAll('.tab')[0].classList.add('active');
    } else {
      document.querySelectorAll('.tab')[1].classList.add('active');
    }
  }



