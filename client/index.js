

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
  DASH: 5
};
const fps = 60;

const cellWidth = 100;

let primus;
let c, ctx;
let type = types.TRIANGLE;

function draw(e) {
  switch(e.type) {
    case types.WALL:
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(e.x*cellWidth, e.y*cellWidth, cellWidth, cellWidth);
      break;
    case types.HEXAGON:
      ctx.fillStyle = '#3498db';
      ctx.fillRect(e.x*cellWidth, e.y*cellWidth, cellWidth, cellWidth);
      break;
    case types.TRIANGLE:
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(e.x*cellWidth, e.y*cellWidth, cellWidth, cellWidth);
      break;
    case types.TRACE:
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(e.x*cellWidth+cellWidth/2,e.y*cellWidth+cellWidth/2,cellWidth*(Math.abs(e.lifetime)/fps),0,2*Math.PI);
      ctx.fill();
    default: break;
  }
}


function main() {
  c = document.getElementById('main');
  c.width = 600;
  c.height = 500;
  ctx = c.getContext('2d');

  primus = Primus.connect('ws://192.168.1.2:8080');
  
  primus.emit('joinGame', { room: 'test', type: types.TRIANGLE });
  
  primus.on('update', function (entities) {
    if (!entities) return;
    // console.log(entities);
    ctx.clearRect(0, 0, c.width, c.height);
    entities.forEach(draw);
  });

  Mousetrap.bind('a', _ => primus.emit('makeMove', { move: moves.LEFT }));
  Mousetrap.bind('w', _ => primus.emit('makeMove', { move: moves.UP }));
  Mousetrap.bind('d', _ => primus.emit('makeMove', { move: moves.RIGHT }));
  Mousetrap.bind('s', _ => primus.emit('makeMove', { move: moves.DOWN }));

  Mousetrap.bind('shift+a', _ => primus.emit('makeMove', { move: moves.DASH, direction: moves.LEFT }));
  Mousetrap.bind('shift+w', _ => primus.emit('makeMove', { move: moves.DASH, direction: moves.UP }));
  Mousetrap.bind('shift+d', _ => primus.emit('makeMove', { move: moves.DASH, direction: moves.RIGHT }));
  Mousetrap.bind('shift+s', _ => primus.emit('makeMove', { move: moves.DASH, direction: moves.DOWN }));

}