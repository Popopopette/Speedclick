let pseudo = "";
while (!pseudo) {
  pseudo = prompt("Entrez votre pseudo :");
}

const socket = io();
const emojiList = ["🧤", "🗡️", "⚔️", "🔥", "🎯"];
const myEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
socket.emit("registerPlayer", { pseudo, emoji: myEmoji });

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const clickSound = new Audio("Impact_Speedclick.mp3");

let players = [];
let currentShape = null;
let clickEffects = [];
let mouseX = 0, mouseY = 0;

let lastMoveSent = 0;

canvas.addEventListener("mousemove", e => {
  const now = Date.now();
  if (now - lastMoveSent > 33) {  // 30 FPS max
    lastMoveSent = now;
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    socket.emit("mouseMove", { x: mouseX, y: mouseY });
  }
});

canvas.addEventListener("click", () => {
  if (!currentShape) return;
  const dx = mouseX - currentShape.x;
  const dy = mouseY - currentShape.y;
  const hit =
    (currentShape.shape === "circle" && dx * dx + dy * dy <= currentShape.size ** 2) ||
    (currentShape.shape === "square" && Math.abs(dx) <= currentShape.size && Math.abs(dy) <= currentShape.size) ||
    (currentShape.shape === "diamond" && Math.abs(dx) + Math.abs(dy) <= currentShape.size);

  if (hit) socket.emit("playerClick");
});

socket.on("clickAccepted", () => {
  clickSound.currentTime = 0;
  clickSound.play();
  clickEffects.push({ x: mouseX, y: mouseY, radius: 5, alpha: 1 });
});

socket.on("newShape", s => currentShape = s);
socket.on("playersUpdate", p => players = p);
socket.on("startGame", () => {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("leaderboard").style.display = "block";
  canvas.style.display = "block";
  requestAnimationFrame(draw);
});

socket.on("updateLeaderboard", scores => {
  const board = document.getElementById("leaderboard");
  board.innerHTML = "<h3>Classement</h3>" +
    scores.map((p, i) => `${i + 1}. ${p.pseudo} (${p.score})`).join("<br>");
});

document.getElementById("chatForm").onsubmit = e => {
  e.preventDefault();
  const val = document.getElementById("chatInput").value;
  if (val) socket.emit("chatMessage", val);
  document.getElementById("chatInput").value = "";
};

socket.on("chatMessage", ({ pseudo, message }) => {
  const chat = document.getElementById("chat");
  chat.innerHTML += `<div><b>${pseudo}</b>: ${message}</div>`;
  chat.scrollTop = chat.scrollHeight;
});

socket.on("lobbyUpdate", ({ players: list, hostId }) => {
  document.getElementById("playersList").innerHTML =
    "<h3>Joueurs</h3>" + list.map(p => `<div>${p.pseudo}</div>`).join("");
  if (socket.id === hostId) {
    document.getElementById("startBtn").style.display = "inline-block";
  }
});

document.getElementById("startBtn").onclick = () => socket.emit("startGame");

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentShape) {
    ctx.fillStyle = currentShape.color;
    if (currentShape.shape === "circle") {
      ctx.beginPath();
      ctx.arc(currentShape.x, currentShape.y, currentShape.size, 0, 2 * Math.PI);
      ctx.fill();
    } else if (currentShape.shape === "square") {
      ctx.fillRect(currentShape.x - currentShape.size, currentShape.y - currentShape.size, 2 * currentShape.size, 2 * currentShape.size);
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

  players.forEach(p => {
    if (p.id !== socket.id) {
      ctx.font = "20px sans-serif";
      ctx.fillText(p.emoji || "❓", p.x, p.y);
    }
  });

  ctx.font = "20px sans-serif";
  ctx.fillText(myEmoji, mouseX, mouseY);

  clickEffects = clickEffects.filter(fx => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0,0,0,${fx.alpha})`;
    ctx.arc(fx.x, fx.y, fx.radius, 0, 2 * Math.PI);
    ctx.stroke();
    fx.radius += 2;
    fx.alpha -= 0.05;
    return fx.alpha > 0;
  });

  requestAnimationFrame(draw);
}
