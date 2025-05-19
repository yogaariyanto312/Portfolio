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


