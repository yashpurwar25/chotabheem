const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const surpriseToast = document.querySelector(".surprise-toast");
const responseArea = document.querySelector(".response-area");
let toastTimer;

function showSurprise(message) {
  surpriseToast.textContent = message;
  surpriseToast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => surpriseToast.classList.remove("visible"), 3400);
}

document.querySelectorAll("[data-surprise]").forEach((heart) => {
  heart.addEventListener("click", () => showSurprise(heart.dataset.surprise));
});

function openLetter() {
  const envelope = document.querySelector(".envelope-button");
  envelope.classList.add("is-open");
  envelope.setAttribute("aria-label", "Your little surprise is open");
  window.setTimeout(() => {
    document.querySelector("#letter").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, reducedMotion ? 0 : 520);
}

document.querySelector("[data-open-letter]").addEventListener("click", openLetter);
document.querySelector(".envelope-button").addEventListener("click", openLetter);
document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.scroll).scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  });
});

const angryMessages = [
  "That’s fair, Chhibi. I’ll give you space and listen when you’re ready.",
  "Understood. Your feelings get their own timeline.",
  "Chhibi gets all the time she needs. I’ll be here when you’re ready.",
];
let angryMessageIndex = 0;
document.querySelector("[data-still-angry]").addEventListener("click", () => {
  responseArea.classList.remove("accepted");
  responseArea.textContent = angryMessages[angryMessageIndex % angryMessages.length];
  angryMessageIndex += 1;
});

const canvas = document.querySelector(".confetti-canvas");
const context = canvas.getContext("2d");
let confettiFrame;

function launchConfetti() {
  if (reducedMotion) return;
  const scale = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  const colors = ["#d98496", "#e8b8cb", "#c5afd4", "#f2dba6", "#b7c49f", "#fff8f2"];
  const pieces = Array.from({ length: 92 }, () => ({
    x: rect.width / 2 + (Math.random() - 0.5) * 90,
    y: rect.height * 0.52 + (Math.random() - 0.5) * 28,
    vx: (Math.random() - 0.5) * 8,
    vy: -Math.random() * 8 - 2,
    gravity: 0.14 + Math.random() * 0.11,
    size: 3 + Math.random() * 5,
    spin: (Math.random() - 0.5) * 0.2,
    angle: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)],
    heart: Math.random() > 0.62,
    alpha: 1,
  }));
  cancelAnimationFrame(confettiFrame);
  const draw = () => {
    context.clearRect(0, 0, rect.width, rect.height);
    let active = false;
    pieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += piece.gravity;
      piece.angle += piece.spin;
      piece.alpha -= 0.008;
      if (piece.y < rect.height + 18 && piece.alpha > 0) active = true;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.angle);
      context.globalAlpha = Math.max(0, piece.alpha);
      context.fillStyle = piece.color;
      if (piece.heart) {
        context.font = `${piece.size * 3}px serif`;
        context.fillText("♥", -piece.size, piece.size);
      } else {
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 1.7);
      }
      context.restore();
    });
    if (active) confettiFrame = requestAnimationFrame(draw);
    else context.clearRect(0, 0, rect.width, rect.height);
  };
  draw();
}

document.querySelector("[data-forgive]").addEventListener("click", () => {
  responseArea.classList.add("accepted");
  responseArea.innerHTML = "<span class=\"response-title\">We’re okay. I’m glad.</span><p>Thanks for hearing me out, Chhibi. I’ll keep working on being a better listener.</p>";
  launchConfetti();
});

document.querySelector("[data-read-again]").addEventListener("click", () => {
  document.querySelector("#letter").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const musicButton = document.querySelector(".music-button");
const audioLabel = musicButton.querySelector(".music-label");
const musicState = musicButton.querySelector(".music-state");
let audioContext;
let musicTimer;
let noteIndex = 0;
const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 392, 349.23];

function playSoftNote() {
  if (!audioContext || audioContext.state !== "running") return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = noteIndex % 4 === 0 ? "sine" : "triangle";
  oscillator.frequency.value = notes[noteIndex % notes.length];
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.035, now + 0.09);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 1.3);
  noteIndex += 1;
  musicTimer = window.setTimeout(playSoftNote, 670);
}

musicButton.addEventListener("click", async () => {
  const isPlaying = musicButton.getAttribute("aria-pressed") === "true";
  if (isPlaying) {
    window.clearTimeout(musicTimer);
    await audioContext?.suspend();
    musicButton.setAttribute("aria-pressed", "false");
    musicButton.setAttribute("aria-label", "Play the little tune");
    audioLabel.textContent = "little tune";
    musicState.textContent = "off";
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    showSurprise("This browser can’t play the optional tune, but the note still works just fine.");
    return;
  }
  audioContext ||= new AudioContextClass();
  await audioContext.resume();
  musicButton.setAttribute("aria-pressed", "true");
  musicButton.setAttribute("aria-label", "Pause the little tune");
  audioLabel.textContent = "little tune";
  musicState.textContent = "on";
  playSoftNote();
});
