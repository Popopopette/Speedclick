const express = require('express'), http = require('http'), sio = require('socket.io'), path = require('path');
const app = express(), server = http.createServer(app), io = sio(server);
const PORT = process.env.PORT||3000;
server.listen(PORT,'0.0.0.0',()=>console.log("speedclick running",PORT));
app.use(express.static(path.join(__dirname,'public')));

const shapes=["circle","square","diamond"], colors=["blue","green","red","yellow"], emojis=["🧤","🗡️","⚔️","🔥","⭐"];
let players=[], hostId=null, currentShape=null, round=0, clickData=[];

io.on('connection', s=>{
  const emoji=emojis[Math.floor(Math.random()*emojis.length)];
  players.push({id:s.id,pseudo:"Anonyme",score:0,x:0,y:0,emoji});
  if(!hostId)hostId=s.id;
  io.emit("lobbyUpdate",{players,hostId});

  s.on("setPseudo",n=>{
    const p=players.find(u=>u.id===s.id);
    if(p)p.pseudo=n;
  });
  s.on("mouseMove",pos=>{const p=players.find(u=>u.id===s.id); if(p){p.x=pos.x; p.y=pos.y;}});
  s.on("chatMessage",m=>{const p=players.find(u=>u.id===s.id); if(p)io.emit("chatMessage",{pseudo:p.pseudo,message:m});});
  s.on("playerClick",()=>{
    if(currentShape && !clickData.find(c=>c.id===s.id)){
      clickData.push({id:s.id,t:Date.now()});
      io.to(s.id).emit("clickAccepted");
    }
  });
  s.on("startGame",()=>{
    if(s.id===hostId) runRounds();
  });
  s.on("disconnect",()=>{
    players=players.filter(u=>u.id!==s.id);
    if(s.id===hostId) hostId=players[0]?.id||null;
    io.emit("lobbyUpdate",{players,hostId});
  });
});

function runRounds(){
  round=0;
  function next(){
    if(round>=20)return;
    round++; clickData=[];
    const shape={
      shape:shapes[Math.floor(Math.random()*shapes.length)],
      color:colors[Math.floor(Math.random()*colors.length)],
      size:Math.floor(Math.random()*20)+10,
      x:Math.random()*700+50,
      y:Math.random()*500+50
    };
    currentShape=shape;
    io.emit("newShape",shape);
    setTimeout(()=>{
      calc();
      io.emit("playersUpdate",players);
      io.emit("updateLeaderboard",players.sort((a,b)=>b.score-a.score));
      setTimeout(next,1000);
    },3000);
  }
  io.emit("startGame");
  next();
}

function calc(){
  clickData.sort((a,b)=>a.t-b.t);
  clickData.forEach((c,i)=>{
    const p=players.find(u=>u.id===c.id);
    if(p){
      let pts=Math.max(5-i,0);
      if(currentShape.color==="blue") pts+=2;
      if(currentShape.color==="red") pts=-pts;
      if(currentShape.size<20)pts++;
      p.score+=pts;
    }
  });
}
