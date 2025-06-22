const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let currentShape = null;
let hasClicked = false;

socket.on('newShape', shape => {
  hasClicked = false;
  currentShape = shape;
  drawShape();
});

canvas.addEventListener('click', (e) => {
  if (!currentShape || hasClicked) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isInsideShape(x, y, currentShape)) {
    hasClicked = true;
    socket.emit('playerClick', { time: Date.now() });
  }
});

function drawShape() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!currentShape) return;
  ctx.fillStyle = currentShape.color;

  const { x, y, size, type } = currentShape;
  if (type === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  } else if (type === 'square') {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  } else if (type === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
  }
}

function isInsideShape(x, y, shape) {
  const dx = x - shape.x;
  const dy = y - shape.y;
  if (shape.type === 'circle') {
    return dx * dx + dy * dy <= shape.size * shape.size;
  } else if (shape.type === 'square') {
    return Math.abs(dx) <= shape.size / 2 && Math.abs(dy) <= shape.size / 2;
  } else if (shape.type === 'diamond') {
    return (Math.abs(dx) + Math.abs(dy)) <= shape.size;
  }
  return false;
}

// Chat handling
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    socket.emit('chatMessage', chatInput.value);
    chatInput.value = '';
  }
});

socket.on('chatMessage', ({ id, text }) => {
  const msg = document.createElement('div');
  msg.textContent = id + ': ' + text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});
