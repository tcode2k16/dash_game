let directions = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};
    
let dFunc = [
  (x, y) => ({ x, y: y - 1 }),
  (x, y) => ({ x: x + 1, y }),
  (x, y) => ({ x, y: y + 1 }),
  (x, y) => ({ x: x - 1, y })
];

let w = 12;
let h = 10;
let map = Array(h).fill(0).map(_ => Array(w).fill(0));

function turnXY(x, y, turn, d) {
  let nD = d + turn;
  if (nD >= 4) nD -= 4;
  let { x: nX, y: nY } = dFunc[nD](x,y);
  return {
    x: nX, y: nY,
    d: nD
  };
}

function empty(x, y) {
  let counter = 0;
  for (let aX = -1; aX <= 1; aX++) {
    for (let aY = -1; aY <= 1; aY++) {
      let nX = x + aX;
      let nY = y + aY;
      if (nX < 0 || nX >= w || nY < 0 || nY >= h) continue;
      if (map[nY][nX] === 1) counter++;
    }
  }
  
  return counter < 2;
      

}

function branch(l, x, y, d) {
  if (x < 0 || x >= w || y < 0 || y >= h || l <= 0) return;
  if (!empty(x, y)) return;
  map[y][x] = 1;
  console.log(map);
  let turn = Math.floor(Math.random()*3)+1;
  let { x: nX, y: nY, d: nD } = turnXY(x, y, turn, d);
  branch(l - 1, nX, nY, nD);
}

let t = 30;

for (let i = 0; i < t; i++)
  branch(Math.floor(Math.random()*10)+10, Math.floor(Math.random()*w), Math.floor(Math.random()*h), Math.floor(Math.random()*4));

console.log(JSON.stringify(map));