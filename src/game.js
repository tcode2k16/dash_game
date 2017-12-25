import maps from './maps.json';
import { pickInt, isBetween } from './util';
import { types, moves, fps, maxOffset, dOffset, typeCooldown } from './config';

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
    return {
      cooldown: room.players[id].cooldown,
      entities: [...room.entities, ...players]
    };
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

    // let map = maps[pickInt(0, maps.length)];
    let map = maps[2];
    let walls = map.reduce((p, row, y) => {
      let r = row.reduce((c, e, x) => {
        if (e !== 1) return c;
        return [...c, this.newEntity({
          x,
          y,
          type: types.WALL
        })]
      },[]);
      return [...p, ...r];
    },[]);

    this.db.rooms[room] = {
      players: {},
      entities: [...walls],
      height: map.length,
      width: map[0].length
    };
  },

  joinRoom(room, { id, type }) {
    let rx, ry;

    do {
      rx = pickInt(0, this.db.rooms[room].width);
      ry = pickInt(0, this.db.rooms[room].height);
    } while (!this.freeSpace(this.db.rooms[room], { x: rx, y: ry }));

    this.db.rooms[room].players[id] = this.newEntity({
      x: rx,
      y: ry,
      hidden: true,
      type
    });
    
    this.db.players[id] = room;

  },

  inBound(room, { x, y }) {
    return !(x < 0 || x >= room.width || y < 0 || y >= room.height);
  },

  freeSpace(room, { x, y }) {
    let entities = [...room.entities, ...Object.keys(room.players).map(k => room.players[k])]
    if (!this.inBound(room, { x, y })) {
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
    let { x, y, type, hidden, cooldown } = room.players[id];
    let px = x, py = y;
    let r;

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
        r = this.dashMove(room, { x, y, direction, id, type, cooldown });
        if (r.err) return;
        x = r.x;
        y = r.y;
        break;
      case moves.PASSWALL:
        r = this.passwallMove(room, { x, y, direction, id, type, cooldown });
        if (r.err) return;
        x = r.x;
        y = r.y;
        break;
      default: break;
    }
    if (!this.inBound(room, { x, y })) return;
    this.killPlayers(room, { px, py, x, y, id});
    
    if (!this.freeSpace(room, { x, y })) return;

    room.players[id] = {
      ...room.players[id],
      x, y,
      cooldown: room.players[id].cooldown === 0 ? 0 : room.players[id].cooldown - 1
    };
    
    let xMax = Math.max(px, x);
    let xMin = Math.min(px, x);
    let yMax = Math.max(py, y);
    let yMin = Math.min(py, y);

    for (let rx = xMin; rx <= xMax; rx++)
      for (let ry = yMin; ry <= yMax; ry++)
        room.entities.push(this.newEntity({
          x: rx,
          y: ry,
          type: types.TRACE,
          lifetime: 0.5 * fps * (1/((Math.abs(x-rx)+1)*(Math.abs(y-ry)+1)))
        }));
  },

  killPlayers(room, { px, py, x, y, id }) {

    let xMax = Math.max(px, x);
    let xMin = Math.min(px, x);
    let yMax = Math.max(py, y);
    let yMin = Math.min(py, y);

    let targets = Object.keys(room.players).reduce((p, e) => {
      let x = room.players[e].x;
      let y = room.players[e].y;
      if (!(isBetween(x, xMin, xMax) && isBetween(y, yMin, yMax)) || e === id) return p;
      return [...p, e];
    }, []);


    targets.forEach(this.leaveGame.bind(this));

  },

  passwallMove(room, { x: px, y: py, direction, id, type, cooldown }) {
    console.log('called');
    if (direction === undefined || !this.db.players[id] || !room ||
      type !== types.SQUARE || cooldown !== 0) return { err: true };
    
    let x = px, y = py;
    let player = room.players[id];

    switch (direction) {
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
      default: break;
    }
    if (!(this.inBound(room, { x, y }) && !this.freeSpace(room, { x, y }))) return { err: true };
    switch (direction) {
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
      default: break;
    }
    if (!this.inBound(room, { x, y })) return { err: true };
    this.killPlayers(room, { px, py, x: x, y: y, id });
    
    if (!this.freeSpace(room, { x, y })) return { err: true };

    

    if ((x !== px || y !== py) && player.hidden) player.hidden = false;
    
    player.cooldown = typeCooldown[type] + 1;

    return { x, y };
  },

  dashMove(room, { x: px, y: py, direction, id, type, cooldown }) {
    if (direction === undefined || !this.db.players[id] || !room ||
        type !== types.TRIANGLE || cooldown !== 0) return { err: true };
    
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
      if (this.inBound(room, { x: rx, y: ry })) this.killPlayers(room, { px, py, x: rx, y: ry, id });
    } while (this.freeSpace(room, { x: rx, y: ry }));

    

    if ((x !== px || y !== py) && player.hidden) player.hidden = false;
    
    player.cooldown = typeCooldown[type] + 1;

    return { x, y };
  },

  updateLifetime(p, e) {
    if (e.lifetime === undefined || e.lifetime === null) return [...p, e];

    if (e.lifetime <= 0) return p;

    return [...p, {
      ...e,
      lifetime: e.lifetime -1
    }];
  },

  updateOffset(p, e) {
    if (e.offset === undefined || e.offset === null) return [...p, e];

    let sign = e.offset.sign;
    let dx = dOffset * e.offset.sign;

    if (e.offset.x <= 0) sign = 1;
    else if (e.offset.x > maxOffset) sign = -1;

    return [...p, {
      ...e,
      offset: {
        sign,
        x: e.offset.x+dx
      }
    }];
  },

  update() {
    Object.keys(this.db.rooms).forEach(key => {
      this.db.rooms[key].entities = this.db.rooms[key].entities
                                      .reduce(this.updateLifetime, [])
                                      .reduce(this.updateOffset, []);
      
      let playerIds = Object.keys(this.db.rooms[key].players);
      this.db.rooms[key].players = playerIds
                                      .map(e => this.db.rooms[key].players[e])
                                      .reduce(this.updateLifetime, [])
                                      .reduce(this.updateOffset, [])
                                      .reduce((p, e, i) => {
                                        return {
                                          ...p,
                                          [playerIds[i]]: e
                                        };
                                      }, {});

    });
  },

  newEntity({ x, y, hidden, type, offset = {
    x: pickInt(0, maxOffset),
    sign: 1
  }, lifetime, cooldown }) {
    cooldown = typeCooldown[type];
    return {
      x, y, hidden, type, offset, lifetime, cooldown
    };
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
//   entities: [],
//   width,
//   height
// }

// entities: {
//   x,
//   y,
//   type,
//   hidden,
//   lifetime,
//   offset
// }