const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log("Speedclick ready", PORT));
app.use(express.static(path.join(__dirname, "public")));

const shapes = ["circle", "square", "diamond"];
const colors = ["blue", "green", "red", "yellow"];

let players = [];
let hostId = null;
let currentShape = null;
let clickData = [];

io.on("connection", socket => {
  console.log("New connection:", socket.id);

  socket.on("registerPlayer", ({ pseudo, emoji }) => {
    players.push({
      id: socket.id,
      pseudo,
      emoji,
      score: 0,
      x: 0,
      y: 0
    });
    if (!hostId) hostId = socket.id;
    emitLobby();
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
    if (p) io.emit("chatMessage", { pseudo: p.pseudo, message });
  });

  socket.on("playerClick", () => {
    if (!clickData.find(c => c.id === socket.id)) {
      clickData.push({ id: socket.id, t: Date.now() });
      socket.emit("clickAccepted");
    }
  });

  socket.on("startGame", () => {
    if (socket.id === hostId) startGame();
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
  let round = 0;
  const maxRounds = 20;

  const nextRound = () => {
    if (round >= maxRounds) return;
    round++;
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
      assignPoints();
      io.emit("playersUpdate", players);
      io.emit("updateLeaderboard", players.slice().sort((a, b) => b.score - a.score));
      setTimeout(nextRound, 1000);
    }, 3000);
  };

  io.emit("startGame");
  nextRound();
}

function assignPoints() {
  clickData.sort((a, b) => a.t - b.t);
  clickData.forEach((click, index) => {
    const p = players.find(p => p.id === click.id);
    if (!p) return;
    let pts = Math.max(5 - index, 0);
    if (currentShape.color === "blue") pts += 2;
    if (currentShape.color === "red") pts = -pts;
    if (currentShape.size < 20) pts += 1;
    p.score += pts;
  });
}
