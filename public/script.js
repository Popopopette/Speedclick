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

let currentShape = null;

// LOBBY
socket.on('lobbyUpdate', ({ players, hostId }) => {
playersList.innerHTML = '<h3>Joueurs connectés :</h3>' + players.map(p => `<div>${p.pseudo}</div>`).join('');
if (socket.id === hostId) startBtn.style.display = 'inline-block';
});

startBtn.onclick = () => socket.emit('startGame');

// NOUVELLE FORME
socket.on('newShape', ({ shape, round }) => {
lobby.style.display = 'none';
canvas.style.display = 'block';
timer.style.display = 'block';
leaderboard.style.display = 'block';

currentShape = shape;
drawShape(shape);
timer.innerText = `Forme ${round}/20`;

setTimeout(() => {
ctx.clearRect(0, 0, canvas.width, canvas.height);
}, 7000);
});

// SCORES
socket.on('scoreUpdate', players => {
leaderboard.innerHTML = '<h3>Classement</h3>' +
players.sort((a,b) => b.score - a.score).map(p => `<div>${p.pseudo} : ${p.score}</div>`).join('');
});

// FIN
socket.on('gameEnded', players => {
alert("Partie terminée !");
leaderboard.innerHTML += '<h4>Fin de partie</h4>';
});

// CLIC SUR FORME
canvas.addEventListener('click', e => {
if (!currentShape) return;
const rect = canvas.getBoundingClientRect();
const x = e.clientX - rect.left, y = e.clientY - rect.top;

const dx = x - currentShape.x, dy = y - currentShape.y;
const inShape = dx*dx + dy*dy <= currentShape.size*currentShape.size;
if (inShape) socket.emit('playerClick');
});

// DESSIN
function drawShape(shape) {
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = shape.color;
if (shape.type === 'circle') {
ctx.beginPath();
ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
ctx.fill();
} else {
ctx.fillRect(shape.x, shape.y, shape.size, shape.size);
}
}

// CHAT (à compléter si besoin)
chatForm.addEventListener('submit', e => {
e.preventDefault();
const msg = chatInput.value.trim();
if (!msg) return;
chatDiv.innerHTML += `<div><b>${pseudo}</b>: ${msg}</div>`;
chatInput.value = '';
});
