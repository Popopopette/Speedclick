const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let pseudo = prompt("Entrez votre pseudo :") || "Anonyme";
socket.emit("setPseudo", pseudo);

let currentShape = null;
let players = [];
let clickEffects = [];

let lastMouseX = 0;
let lastMouseY = 0;

// 🔊 Son de clic (placez Impact_Speedclick.mp3 dans /public)
const clickSound = new Audio('Impact_Speedclick.mp3');

// 🎯 Détection clic (on vérifie si c'est dans la forme)
canvas.addEventListener("click", e => {
  if (!currentShape) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const dx = x - currentShape.x;
  const dy = y - currentShape.y;
  const inShape = dx * dx + dy * dy <= currentShape.size * currentShape.size;

  if (inShape) {
    socket.emit("playerClick");
  }
});

// 🖱️ Suivi position souris
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  lastMouseX = e.clientX - rect.left;
  lastMouseY = e.clientY - rect.top;
  socket.emit("mouseMove", { x: lastMouseX, y: lastMouseY });
});

// ✅ Clic validé par le serveur → jouer son + animation
socket.on("clickAccepted", () => {
  clickSound.currentTime = 0;
  clickSound.play();
  clickEffects.push({ x: lastMouseX, y: lastMouseY, radius: 10, alpha: 1 });
});

// 🧑‍🤝‍🧑 Mise à jour des joueurs et pointeurs
socket.on("playersUpdate", updatedPlayers => {
  players = updatedPlayers;
});

// 🎯 Nouvelle forme à afficher
socket.on("newShape", shape => {
  currentShape = shape;
});

// ⏱️ Timer
socket.on("updateTimer", timeLeft => {
  document.getElementById("timer").innerText = `Temps restant : ${timeLeft}s`;
});

// 🏆 Classement
socket.on("updateLeaderboard", scores => {
  const board = scores.map((s, i) => `<div>${i + 1}. ${s.pseudo} (${s.score})</div>`).join("");
  document.getElementById("leaderboard").innerHTML = `<h3>Classement :</h3>${board}`;
});

// ▶️ Démarrage de la partie
socket.on("startGame", () => {
  document.getElementById("lobby").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("timer").style.display = "block";
  document.getElementById("leaderboard").style.display = "block";
  requestAnimationFrame(drawEverything);
});

// 💬 Chat
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatDiv = document.getElementById("chat");

chatForm.addEventListener("submit", e => {
  e.preventDefault();
  if (chatInput.value) {
    socket.emit("chatMessage", chatInput.value);
    chatInput.value = "";
  }
});

socket.on("chatMessage", ({ pseudo, message }) => {
  chatDiv.innerHTML += `<div><b>${pseudo}</b> : ${message}</div>`;
  chatDiv.scrollTop = chatDiv.scrollHeight;
});

// 👥 Lobby
socket.on("lobbyUpdate", ({ players, hostId }) => {
  const list = players.map(p => `<div>${p.pseudo}</div>`).join("");
  document.getElementById("playersList").innerHTML = `<h3>Joueurs connectés :</h3>${list}`;
  if (socket.id === hostId) {
    document.getElementById("startBtn").style.display = "inline-block";
  }
  document.getElementById("lobby").style.display = "block";
});

document.getElementById("startBtn").onclick = () => {
  socket.emit("startGame");
};

// 🎨 Fonction de dessin principale
function drawEverything() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Forme active
  if (currentShape) {
    ctx.beginPath();
    ctx.fillStyle = currentShape.color;
    ctx.arc(currentShape.x, currentShape.y, currentShape.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pointeurs des autres joueurs
  players.forEach(p => {
    if (p.id !== socket.id) {
      ctx.beginPath();
      ctx.fillStyle = "black";
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "12px sans-serif";
      ctx.fillText(p.pseudo, p.x + 8, p.y);
    }
  });

  // Effets visuels de clic
  clickEffects.forEach((fx, i) => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 0, 0, ${fx.alpha})`;
    ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
    ctx.stroke();
    fx.radius += 2;
    fx.alpha -= 0.05;
    if (fx.alpha <= 0) clickEffects.splice(i, 1);
  });

  requestAnimationFrame(drawEverything);
}
