let pseudo = "";
while (!pseudo) {
  pseudo = prompt("Entrez votre pseudo :");
}

const socket = io();
socket.emit("setPseudo", pseudo);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const emojiList = ["🧤", "🗡️", "⚔️", "🔥", "🎯"];
const myEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
let players = [];
let currentShape = null;
let clickEffects = [];

let mouseX = 0, mouseY = 0;

const clickSound = new Audio('Impact_Speedclick.mp3');

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  socket.emit("mouseMove", { x: mouseX, y: mouseY });
});

canvas.addEventListener("click", () => {
  if (!currentShape) return;

  const dx = mouseX - currentShape.x;
  const dy = mouseY - currentShape.y;

  const isHit =
    (currentShape.shape === "circle" && dx * dx + dy * dy <= currentShape.size * currentShape.size) ||
    (currentShape.shape === "square" && Math.abs(dx) <= currentShape.size && Math.abs(dy) <= currentShape.size) ||
    (currentShape.shape === "diamond" && Math.abs(dx) + Math.abs(dy) <= currentShape.size);

  if (isHit) {
    socket.emit("playerClick");
  }
});

socket.on("clickAccepted", () => {
  clickSound.currentTime = 0;
  clickSound.play();
  clickEffects.push({ x: mouseX, y: mouseY, radius: 5, alpha: 1 });
});

socket.on("newShape", (shape) => {
  currentShape = shape;
});

socket.on("playersUpdate", (data) => {
  players = data;
});

socket.on("updateLeaderboard", (scores) => {
  const leaderboard = document.getElementById("leaderboard");
  leaderboard.style.display = "block";
  leaderboard.innerHTML =
    "<h3>Classement</h3>" +
    scores
      .map((p, i) => `${i + 1}. ${p.pseudo} (${p.score})`)
      .join("<br>");
});

socket.on("startGame", () => {
  document.getElementById("lobby").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("leaderboard").style.display = "block";
  requestAnimationFrame(draw);
});

document.getElementById("chatForm").onsubmit = (e) => {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  if (input.value) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
};

socket.on("chatMessage", ({ pseudo, message }) => {
  const chat = document.getElementById("chat");
  chat.innerHTML += `<div><b>${pseudo}</b>: ${message}</div>`;
  chat.scrollTop = chat.scrollHeight;
});

socket.on("lobbyUpdate", ({ players: pList, hostId }) => {
  const list = document.getElementById("playersList");
  list.innerHTML = "<h3>Joueurs</h3>" + pList.map((p) => `<div>${p.pseudo}</div>`).join("");
  if (socket.id === hostId) {
    document.getElementById("startBtn").style.display = "inline-block";
  }
});

document.getElementById("startBtn").onclick = () => {
  socket.emit("startGame");
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentShape) {
    ctx.fillStyle = currentShape.color;

    if (currentShape.shape === "circle") {
      ctx.beginPath();
      ctx.arc(currentShape.x, currentShape.y, currentShape.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentShape.shape === "square") {
      ctx.fillRect(currentShape.x - currentShape.size, currentShape.y - currentShape.size, currentShape.size * 2, currentShape.size * 2);
    } else if (currentShape.shape === "diamond") {
      ctx.beginPath();
      ctx.moveTo(currentShape.x, currentShape.y - currentShape.size);
      ctx.lineTo(currentShape.x + currentShape.size, currentShape.y);
      ctx.lineTo(currentShape.x, currentShape.y + currentShape.size);
      ctx.lineTo(currentShape.x - currentShape.size, currentShape.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Dessin des pointeurs des autres joueurs
  players.forEach((p) => {
    if (p.id !== socket.id) {
      ctx.font = "20px sans-serif";
      ctx.fillText(p.emoji || "❓", p.x, p.y);
    }
  });

  // Ton pointeur
  ctx.font = "20px sans-serif";
  ctx.fillText(myEmoji, mouseX, mouseY);

  // Effets visuels de clics
  clickEffects = clickEffects.filter((fx) => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 0, 0, ${fx.alpha})`;
    ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI * 2);
    ctx.stroke();
    fx.radius += 2;
    fx.alpha -= 0.05;
    return fx.alpha > 0;
  });

  requestAnimationFrame(draw);
}
