

window.onload = main;

const types = {
  WALL: 1,
  HEXAGON: 2,
  TRIANGLE: 3,
  SQUARE: 4,
  CIRCLE: 5,
  TRACE: 6
};

const moves = {
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4,
  DASH: 5,
  PASSWALL: 6,
  BLOCK: 7
};

const specialMoves = [
  null,
  null,
  null,
  moves.DASH,
  moves.PASSWALL,
  moves.BLOCK,
  null
];

const themeColor = [
  null,
  null,
  '#3498db',
  '#f1c40f',
  '#e67e22',
  '#e74c3c',
  null
]

const maxOffset = 5;

const fps = 60;

const cellWidth = 100;

let primus;
let c, ctx;
let type, specialMove;
let state = {};

function drawEqTriangle(cx, cy, offset){
  let h = (cellWidth-2*offset)/Math.sqrt(2);
      
  ctx.fillStyle = '#f1c40f';
  
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI * offset/maxOffset);
  
  ctx.translate(-(h / 2), -(h / 2));
  ctx.fillRect(0,0, h, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

}

function draw(e) {
  let o = e.offset.x;
  let x = e.x;
  let y = e.y;
  switch(e.type) {
    case types.WALL:
      ctx.fillStyle = '#34495e';
      ctx.fillRect(x*cellWidth+o, y*cellWidth+o, cellWidth-2*o, cellWidth-2*o);
      break;
    case types.HEXAGON:
      ctx.fillStyle = '#3498db';
      ctx.fillRect(x*cellWidth+o, y*cellWidth+o, cellWidth-2*o, cellWidth-2*o);
      break;
    case types.TRIANGLE:
      drawEqTriangle(x*cellWidth+cellWidth/2, y*cellWidth+cellWidth/2, o);
      break;
    case types.SQUARE:
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x*cellWidth+o, y*cellWidth+o, cellWidth-2*o, cellWidth-2*o);
      break;
    case types.CIRCLE:
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(x*cellWidth+cellWidth/2,y*cellWidth+cellWidth/2,cellWidth/2-o,0,2*Math.PI);
      ctx.fill();
      ctx.closePath();
      break;
    case types.TRACE:
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(x*cellWidth+cellWidth/2,y*cellWidth+cellWidth/2,cellWidth*(Math.abs(e.lifetime)/fps),0,2*Math.PI);
      ctx.fill();
      ctx.closePath();
    default: break;
  }
}

function background() {
  // ctx.fillStyle = "#2c3e50";
  // ctx.fillRect(0,0,c.width,c.height);

  ctx.clearRect(0, 0, c.width, c.height);
}

function main() {
  c = document.getElementById('main');
  c.width = 1200;
  c.height = 1000;
  ctx = c.getContext('2d');

  background();
  ctx.font="50px Raleway";
  ctx.fillText("Join a room", c.width/2-100, c.height/2-25);

  primus = Primus.connect('ws://192.168.1.2:8080');
  
  
  
  primus.on('update', function (data) {
    if (!data) return;

    if (data.cooldown !== state.cooldown) cooldownEl.innerHTML = data.cooldown+'';
    state = data;

    background();
    state.entities.forEach(draw);
  });

  primus.on('end', _ => {
    background();
    ctx.font="50px Raleway";
    ctx.fillText("You are dead!!!", c.width/2-100, c.height/2-25);
  })

  Mousetrap.bind('a', _ => primus.emit('makeMove', { move: moves.LEFT }));
  Mousetrap.bind('w', _ => primus.emit('makeMove', { move: moves.UP }));
  Mousetrap.bind('d', _ => primus.emit('makeMove', { move: moves.RIGHT }));
  Mousetrap.bind('s', _ => primus.emit('makeMove', { move: moves.DOWN }));

  Mousetrap.bind('shift+a', _ => primus.emit('makeMove', { move: specialMove, direction: moves.LEFT }));
  Mousetrap.bind('shift+w', _ => primus.emit('makeMove', { move: specialMove, direction: moves.UP }));
  Mousetrap.bind('shift+d', _ => primus.emit('makeMove', { move: specialMove, direction: moves.RIGHT }));
  Mousetrap.bind('shift+s', _ => primus.emit('makeMove', { move: specialMove, direction: moves.DOWN }));
  joinEl.onclick = _ => {
    primus.end();
    primus.open();
    primus.emit('joinGame', { room: roomEl.value, type: types[typeEl.value] });
    type = types[typeEl.value];
    specialMove = specialMoves[type];
  }
}