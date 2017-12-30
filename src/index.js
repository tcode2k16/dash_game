import express from 'express';
import Primus from 'primus';
import WebSocket from 'ws';
import http from 'http';

import config from './config';
import G from './game'
import { setInterval } from 'timers';


const app = express();

app.use('/', express.static('./client'));

const server = http.createServer(app);
const primus = new Primus(server, { transformer: 'uws' });

primus.plugin('emit', require('primus-emit'));

primus.on('connection', function connection(spark) {
  spark.on('joinGame', args => {
    spark.joined = true;
    G.joinGame(spark.id, args)
  });
  spark.on('end', _ => G.leaveGame(spark.id));
  spark.on('makeMove', args => G.makeMove(spark.id, args));
});



setInterval(_ => {
  primus.forEach(function (spark, next) {
    if (spark.joined && G.db.players[spark.id] === undefined) spark.end();

    spark.emit('update', G.getState(spark.id));
    G.update();
    next();
  }, function (err) {
    if (err) console.log(err);
  });  
}, 1000/config.fps)


server.listen(config.port, function listening() {
  console.log('Listening on %d', server.address().port);
});