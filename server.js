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

const icons = ['👊', '🗡️', '🧤', '⚔️', '🎯', '🪄'];

function randomShape(id) {
  const types = ['circle', 'square', 'diamond'];
  const colors = ['blue', 'red', 'green', 'yellow'];
  const size = Math.floor(Math.random() * 40) + 10;
  return {
    id,
    type: types[Math.floor(Math.random() * types.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    size,
    x: Math.floor(Math.random() * (800 - size)),
    y: Math.floor(Math.random() * (600 - size))
  };
}

function calculatePoints(order, shape) {
  let points = 0;
  if (order === 0) points = 5;
  else if (order === 1) points = 4;
  else if (order === 2) points = 3;
  else if (order === 3) points = 2;
  else if (order === 4) points = 1;
  else points = 0;
  if (shape.color === 'red') points = -points;
  return points;
}

function startRound() {
  roundIndex++;
  if (roundIndex >= MAX_ROUNDS) return endGame();
  clickData = [];
  currentShape = randomShape(`round-${roundIndex}`);
  io.emit('newShape', { shape: currentShape, round: roundIndex + 1 });

  setTimeout(() => {
    clickData.sort((a, b) => a.timestamp - b.timestamp);
    clickData.forEach((entry, index) => {
      const player = players.find(p => p.id === entry.id);
      if (player) {
        player.score += calculatePoints(index, currentShape);
      }
    });
    io.emit('scoreUpdate', players);
    startRound();
  }, ROUND_TIME);
}

function endGame() {
  io.emit('gameEnded', players);
  roundIndex = -1;
  currentShape = null;
  clickData = [];
  players.forEach(p => (p.score = 0));
}

io.on('connection', socket => {
  socket.on('setPseudo', pseudo => {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    players.push({ id: socket.id, pseudo, icon, score: 0, x: 0, y: 0 });
    if (!hostId) hostId = socket.id;
    io.emit('lobbyUpdate', { players, hostId });
  });

  socket.on('startGame', () => {
    if (socket.id === hostId) startRound();
  });

  socket.on('playerClick', () => {
    if (roundIndex >= 0 && !clickData.some(c => c.id === socket.id)) {
      clickData.push({ id: socket.id, timestamp: Date.now() });
    }
  });

  socket.on('mouseMove', ({ x, y }) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.x = x;
      player.y = y;
    }
    io.emit('pointerUpdate', players.map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      icon: p.icon,
      pseudo: p.pseudo
    })));
  });

  socket.on('chatMessage', message => {
    const sender = players.find(p => p.id === socket.id);
    const pseudo = sender ? sender.pseudo : 'Anonyme';
    io.emit('chatMessage', { pseudo, message });
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    if (socket.id === hostId) {
      hostId = players.length > 0 ? players[0].id : null;
    }
    io.emit('lobbyUpdate', { players, hostId });
  });
});

io.on('connection', socket => {
  // (...) tu gardes tout ici

  socket.on('restartGame', () => {
    if (socket.id === hostId) {
      players.forEach(p => {
        p.score = 0;
      });
      roundIndex = -1;
      currentShape = null;
      clickData = [];
      io.emit('lobbyUpdate', { players, hostId });
    }
  });
});

server.listen(PORT, () => console.log(`Server on port ${PORT}`));
