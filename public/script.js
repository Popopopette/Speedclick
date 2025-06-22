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

let lastX = 0, lastY = 0;
const clickSound = new Audio('Impact_Speedclick.mp3');

const emojis = ["🧤","🗡️","⚔️","🔥","⭐"];
const myEmoji = emojis[Math.floor(Math.random()*emojis.length)];

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  lastX = e.clientX - r.left;
  lastY = e.clientY - r.top;
  socket.emit("mouseMove", {x: lastX, y: lastY});
});

canvas.addEventListener("click", () => {
  if (!currentShape) return;
  const dx = lastX - currentShape.x;
  const dy = lastY - currentShape.y;
  const hit = (
    currentShape.shape === "circle" && dx*dx+dy*dy <= currentShape.size*currentShape.size ||
    currentShape.shape === "square" && Math.abs(dx)<=currentShape.size && Math.abs(dy)<=currentShape.size ||
    currentShape.shape === "diamond" && Math.abs(dx)+Math.abs(dy) <= currentShape.size
  );
  if (hit) socket.emit("playerClick");
});

socket.on("clickAccepted", () => {
  clickSound.currentTime = 0;
  clickSound.play();
  clickEffects.push({x: lastX, y: lastY, r:10, a:1});
});

socket.on("newShape", s => currentShape = s);
socket.on("playersUpdate", p => players = p);
socket.on("updateLeaderboard", l => {
  document.getElementById("leaderboard").style.display="block";
  document.getElementById("leaderboard").innerHTML =
    "<h3>Classement</h3>" + l.map((u,i)=>(i+1)+". "+u.pseudo+" ("+u.score+")").join("<br>");
});

socket.on("startGame", () => {
  document.getElementById("lobby").style.display="none";
  canvas.style.display="block";
  requestAnimationFrame(draw);
});

document.getElementById("chatForm").onsubmit = e => {
  e.preventDefault();
  const v = document.getElementById("chatInput").value;
  if (v) { socket.emit("chatMessage", v); document.getElementById("chatInput").value=""; }
};
socket.on("chatMessage", data => {
  const d = document.getElementById("chat");
  d.innerHTML += `<div><b>${data.pseudo}</b>: ${data.message}</div>`;
  d.scrollTop = d.scrollHeight;
});

socket.on("lobbyUpdate", data => {
  document.getElementById("playersList").innerHTML =
    "<h3>Joueurs</h3>" + data.players.map(p=>p.pseudo).join("<br>");
  if (socket.id === data.hostId) document.getElementById("startBtn").style.display="inline";
});
document.getElementById("startBtn").onclick = () => socket.emit("startGame");

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (currentShape) {
    ctx.fillStyle = currentShape.color;
    ctx.beginPath();
    if (currentShape.shape==="circle") ctx.arc(currentShape.x,currentShape.y,currentShape.size,0,2*Math.PI);
    else if (currentShape.shape==="square") ctx.fillRect(currentShape.x-currentShape.size,currentShape.y-currentShape.size,2*currentShape.size,2*currentShape.size);
    else if (currentShape.shape==="diamond") {
      ctx.moveTo(currentShape.x, currentShape.y-currentShape.size);
      ctx.lineTo(currentShape.x+currentShape.size, currentShape.y);
      ctx.lineTo(currentShape.x, currentShape.y+currentShape.size);
      ctx.lineTo(currentShape.x-currentShape.size, currentShape.y);
    }
    ctx.fill();
  }
  players.forEach(p => {
    if (p.id !== socket.id) ctx.fillText(p.emoji||"?", p.x, p.y);
  });
  ctx.fillText(myEmoji, lastX, lastY);

  clickEffects = clickEffects.filter((fx,i)=>{
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0,0,0,${fx.a})`;
    ctx.arc(fx.x,fx.y,fx.r,0,2*Math.PI);
    ctx.stroke();
    fx.r+=2; fx.a-=0.05;
    return fx.a>0;
  });

  requestAnimationFrame(draw);
}
