export { pickInt, isBetween }

function pickInt(min, max) { // doesn't include max
  return Math.floor(Math.random()*(max-min))+min;
}

function isBetween(x, min, max) { // includes both ends
  return x >= min && x <= max
}