const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = [];
let hostId = null;
let roundIndex = -1;
const MAX_ROUNDS = 20;
const ROUND_TIME = 7000;
let currentShape = null;
let clickData = [];

function randomShape(id) { /* génération */ }
function calculatePoints(order, shape) { /* scoring */ }
function startRound() {
...
}
function endGame() {
io.emit('gameEnded', players);
}

io.on('connection', socket => {
socket.on('setPseudo', pseudo => { ... });

socket.on('startGame', () => { if (socket.id === hostId) startRound(); });

socket.on('playerClick', data => { /* enregistrement du clic et passage de round */ });

socket.on('disconnect', () => { /* gestion déconnexion + host */ });
});

server.listen(PORT, () => console.log(`Server on port ${PORT}`));
