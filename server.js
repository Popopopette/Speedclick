const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let players = [];
let currentClicks = [];
let currentShape = null;
let roundTime = 7000; // 7 seconds per round
let shapeTimer;

function generateShape() {
const types = ['circle', 'square', 'diamond'];
const colors = ['red', 'blue', 'green', 'yellow'];
return {
type: types[Math.floor(Math.random() * types.length)],
color: colors[Math.floor(Math.random() * colors.length)],
size: Math.floor(Math.random() * 30) + 20,
x: Math.floor(Math.random() * 700) + 50,
y: Math.floor(Math.random() * 500) + 50,
};
}

function calculatePoints(order, shape) {
const base = 100 - order * 20;
let bonus = 0;
if (shape.color === 'blue') bonus += 50;
if (shape.color === 'red') bonus -= 50;
if (shape.size < 30) bonus += 30;
return Math.max(base + bonus, 0);
}

function broadcastNewShape() {
clearTimeout(shapeTimer);
currentShape = generateShape();
currentClicks = [];
io.emit('newShape', { shape: currentShape, players });

shapeTimer = setTimeout(() => {
distributePoints();
}, roundTime);
}

function distributePoints() {
currentClicks.sort((a, b) => a.time - b.time);
currentClicks.forEach((click, index) => {
const player = players.find(p => p.id === click.id);
if (player) {
player.score += calculatePoints(index, currentShape);
}
});
io.emit('updateScores', players);
broadcastNewShape();
}

io.on('connection', (socket) => {
console.log(`User connected: ${socket.id}`);

socket.on('setPseudo', pseudo => {
players.push({ id: socket.id, pseudo, score: 0 });
socket.emit('playersList', players);
if (!currentShape) broadcastNewShape();
});

socket.on('playerClick', (data) => {
if (!currentClicks.find(c => c.id === socket.id)) {
currentClicks.push({ id: socket.id, time: data.time });

if (currentClicks.length === players.length) {
distributePoints();
}
}
});

socket.on('chatMessage', msg => {
const sender = players.find(p => p.id === socket.id);
io.emit('chatMessage', { pseudo: sender?.pseudo || socket.id, text: msg });
});

socket.on('disconnect', () => {
players = players.filter(p => p.id !== socket.id);
console.log(`User disconnected: ${socket.id}`);
io.emit('updateScores', players);
});
});

server.listen(3000, () => {
console.log('Speedclick server running on http://localhost:3000');
});
