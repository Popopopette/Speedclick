const socket = io();
let pseudo = prompt("Pseudo :") || "Anon";
socket.emit('setPseudo', pseudo);

const lobby = document.getElementById('lobby');
const startBtn = document.getElementById('startBtn');
const listDiv = document.getElementById('playersList');
// Canvas, timer, leaderboard, chat...

socket.on('lobbyUpdate', data => { /* mise à jour joueurs + rôle host */ });
socket.on('newShape', ({shape, round}) => { /* affiche forme + timer */ });
socket.on('gameEnded', players => { /* affiche score final */ });

startBtn.onclick = () => socket.emit('startGame');

// gestion du clic canvas
canvas.addEventListener('click', e => socket.emit('playerClick', { ... }));

// chat
chatForm.addEventListener('submit', e => { /* envoi chat */ });
