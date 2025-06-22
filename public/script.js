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

const emojiOptions = ["🧤", "🗡️", "🖐️", "⚡", "🔥"];
const myEmoji = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];

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
  if (
    (currentShape.shape === "circle" && dx * dx + dy * dy <= currentShape.size * currentShape.size) ||
    (currentShape.shape === "square" && Math.abs(dx) <= currentShape.size && Math.abs(dy) <= currentShape.size) ||
    (currentShape.shape === "diamond" && Math.abs(dx) + Math.abs(dy) <= currentShape.size)
  ) {
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
socket.on("updateLeaderboard", scores => {
  document.getElementById("leaderboard").innerHTML = "<h3>Classement</h3>" +
    scores.map((s, i) => `${i+1}. ${s.pseudo} (${s.score})`).join("<br>");
});

socket.on("startGame", () => {
  document.getElementById("lobby").style.display = "none";
  canvas.style.display = "block";
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

socket.on("lobbyUpdate", ({ players: pList, hostId }) => {
  document.getElementById("playersList").innerHTML = "<h3>Joueurs :</h3>" +
    pList.map(p => `<div>${p.pseudo}</div>`).join("");
  if (socket.id === hostId) document.getElementById("startBtn").style.display = "inline-block";
});

document.getElementById("startBtn").onclick = () => socket.emit("startGame");

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentShape) {
    ctx.fillStyle = currentShape.color;
    const s = currentShape.size;
    const x = currentShape.x;
    const y = currentShape.y;

    if (currentShape.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentShape.shape === "square") {
      ctx.fillRect(x - s, y - s, 2 * s, 2 * s);
    } else if (currentShape.shape === "diamond") {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
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
  ctx.fillText(myEmoji, lastMouseX, lastMouseY);

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
