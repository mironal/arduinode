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

var init_arduino_tasks = [
function(cb){ arduinode.send("d/mode/0?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/1?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/2?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/3?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/4?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/5?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/6?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/7?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/8?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/9?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/10?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/11?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/12?type=INPUT", cb);},
function(cb){ arduinode.send("d/mode/13?type=INPUT", cb);}
];

var read_ai_tasks = [
function(cb){ arduinode.send("ai/read/0", cb); },
  function(cb){ arduinode.send("ai/read/1", cb); },
  function(cb){ arduinode.send("ai/read/2", cb); },
  function(cb){ arduinode.send("ai/read/3", cb); },
  function(cb){ arduinode.send("ai/read/4", cb); },
  function(cb){ arduinode.send("ai/read/5", cb); }
];

var read_di_tasks = [
  function(cb){ arduinode.send("di/read/0", cb); },
  function(cb){ arduinode.send("di/read/1", cb); },
  function(cb){ arduinode.send("di/read/2", cb); },
  function(cb){ arduinode.send("di/read/3", cb); },
  function(cb){ arduinode.send("di/read/4", cb); },
  function(cb){ arduinode.send("di/read/5", cb); },
  function(cb){ arduinode.send("di/read/6", cb); },
  function(cb){ arduinode.send("di/read/7", cb); },
  function(cb){ arduinode.send("di/read/8", cb); },
  function(cb){ arduinode.send("di/read/9", cb); },
  function(cb){ arduinode.send("di/read/10", cb); },
  function(cb){ arduinode.send("di/read/11", cb); },
  function(cb){ arduinode.send("di/read/12", cb); },
  function(cb){ arduinode.send("di/read/13", cb); }
];


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

    // ポートの初期化が終わったらポートの値をwebsocketでpushする.
    // 但し、1つ以上の接続があるときのみ.
    setInterval(function(){
      if(numOfConnections > 0){
        async.series(read_ai_tasks, function(err, results){
          ws.sockets.emit("ai", results);
        });

        async.series(read_di_tasks, function(err, results){
          ws.sockets.emit("di", results);
        });
      }
    }, 1000);
  });

});


