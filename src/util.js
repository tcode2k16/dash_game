export { pickInt }

function pickInt(min, max) { // doesn't include max
  return Math.floor(Math.random()*(max-min))+min;
}