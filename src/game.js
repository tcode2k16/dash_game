import maps from './maps.json';
import { pickInt } from './util';
import { types, row, col, moves, fps } from './config';

const game = {
  db: {
    players: {},
    rooms: {}
  },

  getState(id) {
    if (!this.db.players[id]) return;
    let roomName = this.db.players[id];
    let room = this.db.rooms[roomName];
    let players = Object.keys(room.players).map(k => {
      let e = {...room.players[k]};
      if (e.hidden) e.type = types.HEXAGON;
      return e;
    });
    return [...room.entities, ...players];
  },

  joinGame(id, { room, type }) { 
    if (type !== types.CIRCLE &&
        type !== types.SQUARE && 
        type !== types.TRIANGLE)
        return;

    this.newRoom(room);
    this.joinRoom(room, {
      id, type
    });
  },

  newRoom(room) {
    if (this.db.rooms[room]) return;

    let map = maps[pickInt(0, maps.length)];
    let walls = map.reduce((p, row, y) => {
      let r = row.reduce((c, e, x) => {
        if (e !== 1) return c;
        return [...c, {
          x,
          y,
          type: types.WALL
        }]
      },[]);
      return [...p, ...r];
    },[]);

    this.db.rooms[room] = {
      players: {},
      entities: [...walls]
    };
  },

  joinRoom(room, { id, type }) {
    let rx, ry;

    do {
      rx = pickInt(0, row);
      ry = pickInt(0, col);
    } while (!this.freeSpace(this.db.rooms[room], { x: rx, y: ry }));

    this.db.rooms[room].players[id] = {
      x: rx,
      y: ry,
      hidden: true,
      type
    };
    
    this.db.players[id] = room;

  },

  freeSpace(room, { x, y }) {
    let entities = [...room.entities, ...Object.keys(room.players).map(k => room.players[k])]
    if (x < 0 || x >= row ||
        y < 0 || y >= col) {
          return false;
    }

    return entities.reduce((p, e) => p && !(e.x === x && e.y === y), true);
  },

  leaveGame(id) {
    if (!this.db.players[id]) return;

    this.leaveRoom(this.db.players[id], { id });
    delete this.db.players[id];
  },

  leaveRoom(room, { id }) {
    if (!this.db.rooms[room]) return;

    delete this.db.rooms[room].players[id];
    if (Object.keys(this.db.rooms[room].players).length < 1) delete this.db.rooms[room];
  },

  makeMove(id, { move, direction }) {
    if (!this.db.players[id]) return;
    let room = this.db.rooms[this.db.players[id]];
    let { x, y, type, hidden } = room.players[id];
    let px = x, py = y;

    switch (move) {
      case moves.DOWN:
        y++;
        break;
      case moves.UP:
        y--;
        break;
      case moves.LEFT:
        x--;
        break;
      case moves.RIGHT:
        x++;
        break;
      case moves.DASH:
        if (type !== types.TRIANGLE) return;
        let r = this.dashMove(room, { x, y, direction, id });
        if (r.err) return;
        x = r.x;
        y = r.y;
        break;
      default: break;
    }
    if (!this.freeSpace(room, { x, y })) return;
    
    room.players[id] = {
      ...room.players[id],
      x, y
    };
    
    let xMax = Math.max(px, x);
    let xMin = Math.min(px, x);
    let yMax = Math.max(py, y);
    let yMin = Math.min(py, y);

    for (let rx = xMin; rx <= xMax; rx++)
      for (let ry = yMin; ry <= yMax; ry++)
        room.entities.push({
          x: rx,
          y: ry,
          type: types.TRACE,
          lifetime: 0.5 * fps * (1/((Math.abs(x-rx)+1)*(Math.abs(y-ry)+1)))
        });
  },

  dashMove(room, { x: px, y: py, direction, id }) {
    if (direction === undefined || !this.db.players[id] || !room) return { err: true };
    
    let rx = px, ry = py;
    let x, y;
    let player = room.players[id];

    do {
      x = rx;
      y = ry;
      switch (direction) {
        case moves.DOWN:
          ry++;
          break;
        case moves.UP:
          ry--;
          break;
        case moves.LEFT:
          rx--;
          break;
        case moves.RIGHT:
          rx++;
          break;
        default: break;
      }
    } while (this.freeSpace(room, { x: rx, y: ry }));

    

    if ((x !== px || y !== py) && player.hidden) room.players[id].hidden = false;

    return { x, y };
  },

  update() {
    Object.keys(this.db.rooms).forEach(key => {
      let entities = this.db.rooms[key].entities;
      this.db.rooms[key].entities = entities.reduce((p, e) => {
        
        if (e.lifetime === undefined || e.lifetime === null) return [...p, e];

        if (e.lifetime <= 0) return p;

        return [...p, {
          ...e,
          lifetime: e.lifetime -1
        }];

      }, []);
    });
  }
}

export default game


// db.players: {
//   id: room
// }

// player: {
//   x,
//   y,
//   type,
//   hidden,
// }

// room: {
//   players: {},
//   entities: []
// }

// entities: {
//   x,
//   y,
//   type,
//   hidden,
//   lifetime
// }