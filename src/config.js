module.exports = {
  fps: 60,
  types: {
    WALL: 1,
    HEXAGON: 2,
    TRIANGLE: 3,
    SQUARE: 4,
    CIRCLE: 5,
    TRACE: 6
  },
  typeCooldown: [
    0,
    0,
    0,
    5,
    3,
    3,
    0
  ],
  moves: {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4,
    DASH: 5,
    PASSWALL: 6
  },
  maxOffset: 5,
  dOffset: 0.05
}