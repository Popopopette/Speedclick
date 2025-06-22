const socket = io();

let pseudo = prompt("Entrez votre pseudo :");
if (!pseudo) pseudo = "Anonyme";
socket.emit('setPseudo', pseudo);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const chatDiv = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

let players = [];
let shapes = [];
let clickedPlayers = new Set();
let currentShape = null;
let shapeIdCounter = 0;

// Chat events
socket.on('chatMessage', ({ pseudo, message }) => {
const p = document.createElement('p');
p.textContent = `${pseudo}: ${message}`;
chatDiv.appendChild(p);
chatDiv.scrollTop = chatDiv.scrollHeight;
});

chatForm.addEventListener('submit', e => {
e.preventDefault();
const msg = chatInput.value.trim();
if (msg.length === 0) return;
socket.emit('chatMessage', msg);
chatInput.value = '';
});

// Receive updated players list
socket.on('playersUpdate', data => {
players = data;
});

// Game logic

function randomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
return arr[randomInt(0, arr.length - 1)];
}

function createShape() {
const types = ['square', 'circle', 'diamond'];
const colors = ['red', 'blue', 'green', 'orange', 'purple'];

const size = randomInt(30, 80);
const color = randomChoice(colors);
const type = randomChoice(types);

const x = randomInt(size, canvas.width - size);
const y = randomInt(size, canvas.height - size);

shapeIdCounter++;
return { id: shapeIdCounter, x, y, size, color, type };
}

function drawShape(shape) {
ctx.fillStyle = shape.color;
ctx.beginPath();
switch (shape.type) {
case 'square':
ctx.fillRect(shape.x - shape.size / 2, shape.y - shape.size / 2, shape.size, shape.size);
break;
case 'circle':
ctx.arc(shape.x, shape.y, shape.size / 2, 0, Math.PI * 2);
ctx.fill();
break;
case 'diamond':
ctx.moveTo(shape.x, shape.y - shape.size / 2);
ctx.lineTo(shape.x + shape.size / 2, shape.y);
ctx.lineTo(shape.x, shape.y + shape.size / 2);
ctx.lineTo(shape.x - shape.size / 2, shape.y);
ctx.closePath();
ctx.fill();
break;
}
}

function clearCanvas() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function shapeContainsPoint(shape, px, py) {
switch (shape.type) {
case 'square':
return (px >= shape.x - shape.size / 2 && px <= shape.x + shape.size / 2 &&
py >= shape.y - shape.size / 2 && py <= shape.y + shape.size / 2);
case 'circle':
const dx = px - shape.x;
const dy = py - shape.y;
return (dx * dx + dy * dy) <= (shape.size / 2) * (shape.size / 2);
case 'diamond':
// Approximate diamond as rotated square
const rx = Math.abs(px - shape.x);
const ry = Math.abs(py - shape.y);
return (rx + ry) <= shape.size / 2;
default:
return false;
}
}

function startRound() {
clickedPlayers.clear();
currentShape = createShape();
clearCanvas();
drawShape(currentShape);
}

canvas.addEventListener('click', e => {
if (!currentShape) return;
const rect = canvas.getBoundingClientRect();
const clickX = e.clientX - rect.left;
const clickY = e.clientY - rect.top;

if (shapeContainsPoint(currentShape, clickX, clickY)) {
if (!clickedPlayers.has(pseudo)) {
clickedPlayers.add(pseudo);
const timestamp = Date.now();
socket.emit('playerClicked', { shapeId: currentShape.id, timestamp });
console.log(`Clicked shape ${currentShape.id} at ${timestamp}`);

// Optionnel : afficher un petit retour visuel
ctx.strokeStyle = 'black';
ctx.lineWidth = 3;
ctx.strokeRect(currentShape.x - currentShape.size / 2, currentShape.y - currentShape.size / 2, currentShape.size, currentShape.size);
}
}
});

// Quand tous les joueurs ont cliqué, on peut lancer la prochaine forme
socket.on('playersUpdate', players => {
if (currentShape && clickedPlayers.size >= players.length && players.length > 0) {
startRound();
}
});

// Démarrer la première forme après un court délai
setTimeout(() => {
startRound();
}, 1000);
