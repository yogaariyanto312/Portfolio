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