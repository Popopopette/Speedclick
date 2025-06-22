let pseudo = "";
while (!pseudo) {
  pseudo = prompt("Entrez votre pseudo :");
}

const socket = io();
socket.emit("setPseudo", pseudo);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentShape = null;
let players = [];
let clickEffects = [];

let lastMouseX = 0;
let lastMouseY = 0;
const clickSound = new Audio('Impact_Speedclick.mp3');

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  lastMouseX = e.clientX - rect.left;
  lastMouseY = e.clientY - rect.top;
  socket.emit("mouseMove", { x: lastMouseX, y: lastMouseY });
});

canvas.addEventListener("click", e => {
  if (!currentShape) return;
  const dx = lastMouseX - currentShape.x;
  const dy = lastMouseY - currentShape.y;
  if (dx * dx + dy * dy <= currentShape.size * currentShape.size) {
    socket.emit("playerClick");
  }
});

socket.on("clickAccepted", () => {
  clickSound.currentTime = 0;
  clickSound.play();
  clickEffects.push({ x: lastMouseX, y: lastMouseY, radius: 10, alpha: 1 });
});

socket.on("newShape", shape => currentShape = shape);
socket.on("playersUpdate", data => players = data);
socket.on("updateTimer", time => document.getElementById("timer").innerText = "Temps : " + time);
socket.on("updateLeaderboard", scores => {
  document.getElementById("leaderboard").innerHTML = "<h3>Classement</h3>" +
    scores.map((s, i) => `${i+1}. ${s.pseudo} (${s.score})`).join("<br>");
});

socket.on("startGame", () => {
  document.getElementById("lobby").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("timer").style.display = "block";
  document.getElementById("leaderboard").style.display = "block";
  requestAnimationFrame(draw);
});

const chat = document.getElementById("chat");
document.getElementById("chatForm").onsubmit = e => {
  e.preventDefault();
  const val = document.getElementById("chatInput").value;
  if (val) socket.emit("chatMessage", val);
  document.getElementById("chatInput").value = "";
};

socket.on("chatMessage", ({ pseudo, message }) => {
  chat.innerHTML += `<div><b>${pseudo}</b>: ${message}</div>`;
  chat.scrollTop = chat.scrollHeight;
});

socket.on("lobbyUpdate", ({ players, hostId }) => {
  document.getElementById("playersList").innerHTML = "<h3>Joueurs :</h3>" +
    players.map(p => `<div>${p.pseudo}</div>`).join("");
  if (socket.id === hostId) document.getElementById("startBtn").style.display = "inline-block";
});

document.getElementById("startBtn").onclick = () => socket.emit("startGame");

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (currentShape) {
    ctx.beginPath();
    ctx.fillStyle = currentShape.color;
    ctx.arc(currentShape.x, currentShape.y, currentShape.size, 0, Math.PI * 2);
    ctx.fill();
  }
  players.forEach(p => {
    if (p.id !== socket.id) {
      ctx.beginPath();
      ctx.fillStyle = "black";
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(p.pseudo, p.x + 8, p.y);
    }
  });
  clickEffects.forEach((fx, i) => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0,0,0,${fx.alpha})`;
    ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
    ctx.stroke();
    fx.radius += 2;
    fx.alpha -= 0.05;
    if (fx.alpha <= 0) clickEffects.splice(i, 1);
  });
  requestAnimationFrame(draw);
}
