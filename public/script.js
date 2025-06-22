const socket = io();

let pseudo = "";
let icon = "";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const lobby = document.getElementById('lobby');
const startBtn = document.getElementById('startBtn');
const playersList = document.getElementById('playersList');
const timer = document.getElementById('timer');
const leaderboard = document.getElementById('leaderboard');
const chatDiv = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const iconSelect = document.getElementById('iconSelect');
const iconChoice = document.getElementById('iconChoice');
const enterGame = document.getElementById('enterGame');

let currentShape = null;
let pointers = [];

enterGame.onclick = () => {
  pseudo = prompt("Entrez votre pseudo :") || "Anonyme";
  icon = iconChoice.value;
  console.log("Pseudo:", pseudo, "Icon:", icon);
  socket.emit('setPseudoAndIcon', { pseudo, icon });
  iconSelect.style.display = 'none';
};

socket.on('lobbyUpdate', ({ players, hostId }) => {
  playersList.innerHTML = '<h3>Joueurs connectés :</h3>' +
    players.map(p => `<div>${p.pseudo}</div>`).join('');
  if (socket.id === hostId) startBtn.style.display = 'inline-block';
  lobby.style.display = 'block';
});

startBtn.onclick = () => socket.emit('startGame');

socket.on('newShape', ({ shape, round }) => {
  lobby.style.display = 'none';
  canvas.style.display = 'block';
  timer.style.display = 'block';
  leaderboard.style.display = 'block';

  currentShape = shape;
  drawEverything();
  timer.innerText = `Forme ${round}/20`;

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 7000);
});

socket.on('scoreUpdate', players => {
  leaderboard.innerHTML = '<h3>Classement</h3>' +
    players.sort((a,b) => b.score - a.score).map(p => `<div>${p.pseudo} : ${p.score}</div>`).join('');
});

socket.on('gameEnded', players => {
  alert("🎉 Partie terminée !");
  leaderboard.innerHTML += '<h4>Fin de partie</h4>';
});

canvas.addEventListener('click', e => {
  if (!currentShape) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const dx = x - currentShape.x, dy = y - currentShape.y;
  const inShape = dx*dx + dy*dy <= currentShape.size*currentShape.size;
  if (inShape) socket.emit('playerClick');
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  socket.emit('mouseMove', { x, y });
});

function drawEverything() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (currentShape) {
    ctx.fillStyle = currentShape.color;
    if (currentShape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(currentShape.x, currentShape.y, currentShape.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(currentShape.x, currentShape.y, currentShape.size, currentShape.size);
    }
  }

  pointers.forEach(p => {
    ctx.font = "20px Arial";
    ctx.fillText(p.icon, p.x, p.y);
  });

  requestAnimationFrame(drawEverything);
}

socket.on('pointerUpdate', data => {
  pointers = data.filter(p => p.id !== socket.id);
});

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit('chatMessage', msg);
  chatInput.value = '';
});

socket.on('chatMessage', ({ pseudo, message }) => {
  const line = document.createElement('div');
  line.innerHTML = `<b>${pseudo}</b> : ${message}`;
  chatDiv.appendChild(line);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});
