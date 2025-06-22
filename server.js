const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log("Speedclick server running on port", PORT);
});

app.use(express.static(path.join(__dirname, "public")));

const shapes = ["circle", "square", "diamond"];
const colors = ["blue", "green", "red", "yellow"];
const emojis = ["🧤", "🗡️", "⚔️", "🔥", "🎯"];

let players = [];
let currentShape = null;
let hostId = null;
let clickData = [];
let roundIndex = 0;

io.on("connection", socket => {
  console.log("New player connected:", socket.id);

  const player = {
    id: socket.id,
    pseudo: "Anonyme",
    score: 0,
    x: 0,
    y: 0,
    emoji: emojis[Math.floor(Math.random() * emojis.length)]
  };

  players.push(player);
  if (!hostId) hostId = socket.id;
  emitLobby();

  socket.on("setPseudo", name => {
    const p = players.find(p => p.id === socket.id);
    if (p) p.pseudo = name;
  });

  socket.on("mouseMove", pos => {
    const p = players.find(p => p.id === socket.id);
    if (p) {
      p.x = pos.x;
      p.y = pos.y;
    }
  });

  socket.on("chatMessage", message => {
    const p = players.find(p => p.id === socket.id);
    if (p) {
      io.emit("chatMessage", { pseudo: p.pseudo, message });
    }
  });

  socket.on("playerClick", () => {
    if (currentShape && !clickData.find(d => d.id === socket.id)) {
      clickData.push({ id: socket.id, timestamp: Date.now() });
      socket.emit("clickAccepted");
    }
  });

  socket.on("startGame", () => {
    if (socket.id === hostId) {
      startGame();
    }
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    if (socket.id === hostId) hostId = players[0]?.id || null;
    emitLobby();
  });
});

function emitLobby() {
  io.emit("lobbyUpdate", { players, hostId });
}

function startGame() {
  roundIndex = 0;
  nextRound();
  io.emit("startGame");
}

function nextRound() {
  if (roundIndex >= 20) return;
  roundIndex++;
  clickData = [];

  currentShape = {
    x: Math.random() * 700 + 50,
    y: Math.random() * 500 + 50,
    size: Math.floor(Math.random() * 20) + 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)]
  };

  io.emit("newShape", currentShape);

  setTimeout(() => {
    applyScores();
    io.emit("playersUpdate", players);
    io.emit("updateLeaderboard", players.slice().sort((a, b) => b.score - a.score));
    setTimeout(nextRound, 1000);
  }, 3000);
}

function applyScores() {
  clickData.sort((a, b) => a.timestamp - b.timestamp);
  clickData.forEach((click, index) => {
    const player = players.find(p => p.id === click.id);
    if (!player) return;

    let points = Math.max(5 - index, 0); // position bonus
    if (currentShape.color === "blue") points += 2;
    if (currentShape.color === "red") points = -points;
    if (currentShape.size < 20) points += 1;

    player.score += points;
  });
}
