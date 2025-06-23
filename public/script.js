const socket = io();

socket.on('connect', () => {
  const pseudo = prompt("Entrez votre pseudo :") || "Anonyme";
  socket.emit('setPseudo', pseudo);
});

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
const gameModeSelect = document.getElementById('gameModeSelect');

let currentShape = null;
let pointers = [];
let clickEffects = [];
const clickSound = new Audio("Impact_Speedclick.mp3");

startBtn.onclick = () => {
  const selectedMode = gameModeSelect.value;
  socket.emit('startGame', selectedMode);
};

socket.on('lobbyUpdate', ({ players, hostId }) => {
  playersList.innerHTML = '<h3>Joueurs connectés :</h3>' +
    players.map(p => `<div>${p.pseudo}</div>`).join('');
  if (socket.id === hostId) startBtn.style.display = 'inline-block';
  lobby.style.display = 'block';
});

socket.on('newShape', ({ shape, round }) => {
  lobby.style.display = 'none';
  canvas.style.display = 'block';
  timer.style.display = 'block';
  leaderboard.style.display = 'block';
  currentShape = shape;
  drawEverything();
  timer.innerText = `Forme ${round}`;
  setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 7000);
});

socket.on('scoreUpdate', players => {
  leaderboard.innerHTML = '<h3>Classement</h3>' +
    players.sort((a,b) => b.score - a.score)
           .map(p => `<div>${p.pseudo} : ${p.score}</div>`).join('');
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
  const inShape = dx * dx + dy * dy <= currentShape.size * currentShape.size;
  if (inShape) {
    socket.emit('playerClick');
    clickSound.currentTime = 0;
    clickSound.play();
    clickEffects.push({ x, y, radius: 10, alpha: 1 });
  }
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  socket.emit('mouseMove', { x, y });
});

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

socket.on('countdown', () => {
  const div = document.createElement('div');
  div.id = 'countdown';
  div.style.position = 'absolute';
  div.style.top = '40%';
  div.style.left = '50%';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.fontSize = '80px';
  div.style.fontWeight = 'bold';
  div.style.zIndex = '9999';
  document.body.appendChild(div);

  let count = 3;
  const interval = setInterval(() => {
    if (count > 0) {
      div.textContent = count;
      count--;
    } else if (count === 0) {
      div.textContent = "GO!";
      count--;
    } else {
      clearInterval(interval);
      div.remove();
    }
  }, 1000);
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

  clickEffects = clickEffects.filter(fx => {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 0, 0, ${fx.alpha})`;
    ctx.arc(fx.x, fx.y, fx.radius, 0, 2 * Math.PI);
    ctx.stroke();
    fx.radius += 2;
    fx.alpha -= 0.05;
    return fx.alpha > 0;
  });

  requestAnimationFrame(drawEverything);
}
