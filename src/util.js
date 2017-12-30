export { pickInt, isBetween }

function pickInt(min, max) { // doesn't include max
  return Math.floor(Math.random()*(max-min))+min;
}

function isBetween(x, min, max) { // includes both ends
  return x >= min && x <= max
}

const Struct = (...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o} , {}));
const NamedStruct = (name, ...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o} , {_name: name}));