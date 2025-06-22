const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = [];

io.on('connection', socket => {
console.log('User connected:', socket.id);

socket.on('setPseudo', pseudo => {
players.push({ id: socket.id, pseudo, score: 0 });
io.emit('playersUpdate', players);
});

socket.on('chatMessage', message => {
const player = players.find(p => p.id === socket.id);
const pseudo = player ? player.pseudo : 'Anonyme';
io.emit('chatMessage', { pseudo, message });
});

socket.on('playerClicked', data => {
// Data attendue : { shapeId, timestamp }
// À implémenter : gestion des clics, points, etc.
// Pour l'exemple, on transmet juste l'info à tous
io.emit('playerClicked', {
id: socket.id,
pseudo: (players.find(p => p.id === socket.id) || {}).pseudo || 'Anonyme',
shapeId: data.shapeId,
timestamp: data.timestamp
});
});

socket.on('disconnect', () => {
console.log('User disconnected:', socket.id);
players = players.filter(p => p.id !== socket.id);
io.emit('playersUpdate', players);
});
});

http.listen(PORT, () => {
console.log(`Speedclick server running on http://localhost:${PORT}`);
});
