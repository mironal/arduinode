"use strict";

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , async = require('async');


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var app_server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


var numOfConnections = 0;

var ws = require("socket.io").listen(app_server);

ws.sockets.on('connection',  function (socket) {
  numOfConnections++;
  socket.on("disconnect", function(){
    numOfConnections--;
  });
});


var Arduinode = require("arduinode").Arduinode;

// Rewrite Your serial port name.
var portName = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portName, function(){
  // Arduinoのポートを初期化する.
  async.series(init_arduino_tasks, function(err, results){
    if(err) throw err;
    console.log("*********** init arduino ***********");
    console.log(results);

  });
  // ポートの初期化が終わったらポートの値をwebsocketでpushする.
  // 但し、1つ以上の接続があるときのみ.
  arduinode.on("event", function(data){
    if(numOfConnections > 0){
      ws.sockets.emit("event", data);
    }
  });

});


var init_arduino_tasks = [
  function(cb){ arduinode.pinMode(0, "INPUT", cb);},
  function(cb){ arduinode.pinMode(1, "INPUT", cb);},
  function(cb){ arduinode.pinMode(2, "INPUT", cb);},
  function(cb){ arduinode.pinMode(3, "INPUT", cb);},
  function(cb){ arduinode.pinMode(4, "INPUT", cb);},
  function(cb){ arduinode.pinMode(5, "INPUT", cb);},
  function(cb){ arduinode.pinMode(6, "INPUT", cb);},
  function(cb){ arduinode.pinMode(7, "INPUT", cb);},
  function(cb){ arduinode.pinMode(8, "INPUT", cb);},
  function(cb){ arduinode.pinMode(9, "INPUT", cb);},
  function(cb){ arduinode.pinMode(10, "INPUT", cb);},
  function(cb){ arduinode.pinMode(11, "INPUT", cb);},
  function(cb){ arduinode.pinMode(12, "INPUT", cb);},
  function(cb){ arduinode.pinMode(13, "INPUT", cb);},
  function(cb) { arduinode.digitalStreamOn(0, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(1, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(2, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(3, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(4, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(5, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(6, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(7, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(8, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(9, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(10, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(11, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(12, 1000, cb); },
  function(cb) { arduinode.digitalStreamOn(13, 1000, cb); },
  function(cb) { arduinode.analogStreamOn(0, 500, cb); },
  function(cb) { arduinode.analogStreamOn(1, 500, cb); },
  function(cb) { arduinode.analogStreamOn(2, 500, cb); },
  function(cb) { arduinode.analogStreamOn(3, 500, cb); },
  function(cb) { arduinode.analogStreamOn(4, 500, cb); },
  function(cb) { arduinode.analogStreamOn(5, 500, cb); }
];

