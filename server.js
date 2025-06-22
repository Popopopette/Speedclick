const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Speedclick server running on port', PORT);
});

app.use(express.static(path.join(__dirname, 'public')));

let players = [];
let hostId = null;
let currentShape = null;
let roundIndex = -1;
let clickData = [];

io.on('connection', socket => {
  console.log('User connected:', socket.id);
  players.push({ id: socket.id, pseudo: "Anonyme", score: 0, x: 0, y: 0 });

  if (!hostId) hostId = socket.id;
  updateLobby();

  socket.on("setPseudo", name => {
    const player = players.find(p => p.id === socket.id);
    if (player) player.pseudo = name;
  });

  socket.on("mouseMove", pos => {
    const p = players.find(p => p.id === socket.id);
    if (p) { p.x = pos.x; p.y = pos.y; }
  });

  socket.on("chatMessage", msg => {
    const p = players.find(p => p.id === socket.id);
    if (p) io.emit("chatMessage", { pseudo: p.pseudo, message: msg });
  });

  socket.on("playerClick", () => {
    if (roundIndex >= 0 && !clickData.find(c => c.id === socket.id)) {
      clickData.push({ id: socket.id, timestamp: Date.now() });
      io.to(socket.id).emit("clickAccepted");
    }
  });

  socket.on("startGame", () => {
    if (socket.id === hostId) startGame();
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    if (socket.id === hostId) hostId = players[0]?.id || null;
    updateLobby();
  });
});

function updateLobby() {
  io.emit("lobbyUpdate", { players, hostId });
}

function startGame() {
  let round = 0;
  let maxRounds = 20;

  const nextRound = () => {
    if (round >= maxRounds) return;
    round++;
    roundIndex++;
    clickData = [];

    const shape = {
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      size: Math.floor(Math.random() * 30) + 20,
      color: ["blue", "green", "red", "yellow"][Math.floor(Math.random() * 4)]
    };
    currentShape = shape;
    io.emit("newShape", shape);

    let time = 3;
    const interval = setInterval(() => {
      io.emit("updateTimer", time);
      if (--time < 0) {
        clearInterval(interval);
        calculatePoints();
        setTimeout(nextRound, 1000);
      }
    }, 1000);
  };

  io.emit("startGame");
  nextRound();
}

function calculatePoints() {
  clickData.sort((a, b) => a.timestamp - b.timestamp);
  clickData.forEach((c, index) => {
    const player = players.find(p => p.id === c.id);
    if (!player) return;
    let bonus = Math.max(5 - index, 0);
    if (currentShape.color === "blue") bonus += 2;
    if (currentShape.color === "red") bonus = -bonus;
    if (currentShape.size < 30) bonus += 1;
    player.score += bonus;
  });
  io.emit("updateLeaderboard", players.sort((a, b) => b.score - a.score));
  io.emit("playersUpdate", players);
}
