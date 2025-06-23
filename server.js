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
let gameMode = 'classic';
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

function calculateClassicPoints(order, shape) {
  if (order === 0) return shape.color === 'red' ? -5 : 5;
  if (order === 1) return shape.color === 'red' ? -4 : 4;
  if (order === 2) return shape.color === 'red' ? -3 : 3;
  if (order === 3) return shape.color === 'red' ? -2 : 2;
  if (order === 4) return shape.color === 'red' ? -1 : 1;
  return 0; // Aucun point attribué au-delà du 5e clic
}

function calculateBattlePoints(order, shape) {
  if (order === 0) return 0;  // 1er = aucune perte
  let loss = 0;
  if (order === 1) loss = 1;
  else if (order === 2) loss = 2;
  else if (order === 3) loss = 3;
  else loss = 3;

  if (shape.color === 'red') loss *= 2;
  return -loss;
}

function startRound() {
  roundIndex++;
  if (gameMode === 'classic' && roundIndex >= 20) return endGame();

  clickData = [];
  currentShape = randomShape(`round-${roundIndex}`);
  io.emit('newShape', { shape: currentShape, round: roundIndex + 1 });

  setTimeout(() => {
 if (gameMode === 'battle') {
  const activePlayers = players.filter(p => p.score > 0);
  const nonClickers = activePlayers.filter(p => !clickData.some(c => c.id === p.id))
                                   .map(p => ({ id: p.id, timestamp: Infinity }));
  clickData.push(...nonClickers);
}
    clickData.sort((a, b) => a.timestamp - b.timestamp);

    clickData.forEach((entry, index) => {
      const player = players.find(p => p.id === entry.id);
      if (!player) return;

      let delta = 0;
      if (gameMode === 'classic') {
        delta = calculateClassicPoints(index, currentShape);
      } else if (gameMode === 'battle') {
        delta = calculateBattlePoints(index, currentShape);
      }

      player.score += delta;

      if (gameMode === 'battle' && player.score <= 0) {
        player.score = 0; // Pas de négatif
      }
    });

    if (gameMode === 'battle') {
      const survivors = players.filter(p => p.score > 0);
      if (survivors.length <= 1) return endGame();
    }

    io.emit('scoreUpdate', players);
    startRound();
  }, ROUND_TIME);
}

function endGame() {
  io.emit('gameEnded', players);
  roundIndex = -1;
  currentShape = null;
  clickData = [];
  players.forEach(p => {
    p.score = gameMode === 'battle' ? 20 : 0;
  });
}

io.on('connection', socket => {
  socket.on('setPseudo', pseudo => {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    players.push({
      id: socket.id,
      pseudo,
      icon,
      score: gameMode === 'battle' ? 20 : 0,
      x: 0,
      y: 0
    });
    if (!hostId) hostId = socket.id;
    io.emit('lobbyUpdate', { players, hostId });
  });

  socket.on('startGame', mode => {
    if (socket.id !== hostId) return;
    gameMode = mode === 'battle' ? 'battle' : 'classic';
    players.forEach(p => {
      p.score = gameMode === 'battle' ? 20 : 0;
    });
    io.emit('countdown');
    setTimeout(() => startRound(), 4000);
  });

  socket.on('playerClick', () => {
    if (roundIndex >= 0 && !clickData.some(c => c.id === socket.id)) {
      clickData.push({ id: socket.id, timestamp: Date.now() });
    }
  });

  socket.on('mouseMove', ({ x, y }) => {
    const player = players.find(p => p.id === socket.id);
    if (player && (gameMode === 'classic' || player.score > 0)) {
      player.x = x;
      player.y = y;
    }

    io.emit('pointerUpdate', players
      .filter(p => gameMode === 'classic' || p.score > 0)
      .map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        icon: p.icon,
        pseudo: p.pseudo
      }))
    );
  });

  socket.on('chatMessage', message => {
    const sender = players.find(p => p.id === socket.id);
    const pseudo = sender ? sender.pseudo : 'Anonyme';
    io.emit('chatMessage', { pseudo, message });
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    if (socket.id === hostId) {
      hostId = players.length ? players[0].id : null;
    }
    io.emit('lobbyUpdate', { players, hostId });
  });
});

server.listen(PORT, () => console.log(`Server on port ${PORT}`));
