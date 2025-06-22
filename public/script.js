const socket = io();

let pseudo = prompt("Entrez votre pseudo :") || "Anonyme";
socket.emit('setPseudo', pseudo);

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

const clickSound = new Audio("Impact_Speedclick.mp3");
const beepSound = new Audio("beep.mp3");

let currentShape = null;
let pointers = [];
let isEliminated = false;

socket.on('lobbyUpdate', ({ players, hostId }) => {
  playersList.innerHTML = '<h3>Joueurs connectés :</h3>' +
    players.map(p => `<div>${p.pseudo}</div>`).join('');
  if (socket.id === hostId) startBtn.style.display = 'inline-block';
  lobby.style.display = 'block';
});

startBtn.onclick = () => {
  const mode = gameModeSelect.value;
  socket.emit('startGame', mode);
};

socket.on('countdown', () => {
  const countdownDiv = document.createElement('div');
  countdownDiv.id = 'countdown';
  countdownDiv.style.position = 'absolute';
  countdownDiv.style.top = '40%';
  countdownDiv.style.left = '50%';
  countdownDiv.style.transform = 'translate(-50%, -50%)';
  countdownDiv.style.fontSize = '80px';
  countdownDiv.style.fontWeight = 'bold';
  countdownDiv.style.zIndex = '9999';
  document.body.appendChild(countdownDiv);

  let count = 3;
  const interval = setInterval(() => {
    if (count > 0) {
      countdownDiv.textContent = count;
      beepSound.currentTime = 0;
      beepSound.play();
      count--;
    } else if (count === 0) {
      countdownDiv.textContent = "GO!";
      count--;
    } else {
      clearInterval(interval);
      countdownDiv.remove();
    }
  }, 1000);
});

socket.on('newShape', ({ shape, round }) => {
  if (isEliminated) return;
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

socket.on('eliminated', () => {
  isEliminated = true;
  canvas.style.display = 'none';
  timer.style.display = 'none';
  alert("❌ Vous avez été éliminé !");
});

canvas.addEventListener('click', e => {
  if (!currentShape || isEliminated) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const dx = x - currentShape.x, dy = y - currentShape.y;
  const inShape = dx*dx + dy*dy <= currentShape.size*currentShape.size;
  if (inShape) {
    socket.emit('playerClick');
    clickSound.currentTime = 0;
    clickSound.play();
  }
});

canvas.addEventListener('mousemove', e => {
  if (isEliminated) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  socket.emit('mouseMove', { x, y });
});

socket.on('chatMessage', ({ pseudo, message }) => {
  const line = document.createElement('div');
  line.innerHTML = `<b>${pseudo}</b> : ${message}`;
  chatDiv.appendChild(line);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit('chatMessage', msg);
  chatInput.value = '';
});
