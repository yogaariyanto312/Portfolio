// darkmode
const toggleButton = document.getElementById("darkModeToggle");
const body = document.body;

if (localStorage.getItem("darkMode") === "enabled") {
    body.classList.add("dark-mode");
    toggleButton.textContent = "☀️";
}

toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
        toggleButton.textContent = "☀️";
    } else {
        localStorage.setItem("darkMode", "disabled");
        toggleButton.textContent = "🌙";
    }
}
);
// end darkmode

// text animation
var typed = new Typed("#perkenalan", {
    strings: ["Halo, Selamat Datang!", "Nama Saya Yoga Ariyanto", "Salam Kenal Ya.."],
    typeSpeed: 95,
    backSpeed: 60,
    loop: true
});
// end text animation

// title animation
let titleText = "Portfolio | YogaAriyanto";
let index = 0;

function scrollTitle() {
    document.title = titleText.substring(index) + titleText.substring(0, index);
    index = (index + 1) % titleText.length;
    setTimeout(scrollTitle, 100); // Kecepatan animasi (ms)
}
scrollTitle();
// end title animation

