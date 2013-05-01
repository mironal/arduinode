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
ws.set("log level", 1);
ws.sockets.on('connection',  function (socket) {
  numOfConnections++;

  socket.emit("notify-all", arduinode._status);


  socket.on("disconnect", function(){
    numOfConnections--;
  });


  socket.on("digitalWrite", function(data){
    arduinode.digitalWriteWithNotify(data.port, data.val);
  });

  socket.on("pinMode", function(data){
    switch(data.mode){
      case "INPUT":
        arduinode.switchToInput(data.port);
        break;
      case "OUTPUT":
        arduinode.switchToOutput(data.port);
        break;
    }
  });
});


var Arduinode = require("arduinode").Arduinode;

// Rewrite Your serial port name.
var portName = "/dev/tty.usbmodem1411";
var arduinode = null;
var connectArduino = function(){
  arduinode = new Arduinode(portName, function(err, result){
    if(err){
      setTimeout(connectArduino, 1000);
      return console.log(err);
    }
    // Arduinoのポートを初期化する.
    async.series(init_arduino_tasks, function(err, results){
      if(err) throw err;
      console.log("*********** init arduino ***********");
      console.log(results);
      console.log("************************************");

      // 一つ以上の接続があったら、通知する.
      if(numOfConnections > 0){
        ws.sockets.emit("notify-all", arduinode._status);
      }

    });
    // ポートの初期化が終わったらポートの値をwebsocketでpushする.
    // 但し、1つ以上の接続があるときのみ.
    arduinode.on("event", function(data){
      if(numOfConnections > 0){
        ws.sockets.emit("event", data);
      }
    });

    arduinode.on("close", function(){
      connectArduino();
    });


    arduinode.digitalWriteWithNotify = function(port, value){
      arduinode.digitalWrite(port, value, function(err, result){
        if(err){
          return console.log(err);
        }
        arduinode._status.digital[port].value = value;
        ws.sockets.emit("notify", {port:port, direction:"OUTPUT", value:value});
        console.log(result);
      });
    }

    arduinode.switchToInput = function(port){
      async.series([
          function(cb){ arduinode.pinMode(port, "INPUT", cb); },
          function(cb){ arduinode.digitalStreamOn(port, 200, cb); }
          ],
          function(err, results){
            if(err){
              return console.log(err);
            }
            // valueはとりあえず0で
            arduinode._status.digital[port] = {direction:"INPUT", value:0};
            ws.sockets.emit("notify", {port:port, direction:"INPUT", value:0});
            console.log(results);
          });
    }

    arduinode.switchToOutput = function(port){
      async.series([
          function(cb){ arduinode.digitalStreamOff(port, cb); },
          function(cb){ arduinode.pinMode(port, "OUTPUT", cb); },
          function(cb){ arduinode.digitalWrite(port, 0, cb); }
          ],
          function(err, results){
            if(err){
              return console.log(err);
            }
            arduinode._status.digital[port] = {direction:"OUTPUT", value:0};
            ws.sockets.emit("notify", {port:port, direction:"OUTPUT", value:0});
            console.log(results);
          });
    }

    arduinode._status = {
      digital:[
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0},
      {direction:"INPUT", value:0}
      ]
    };

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
    function(cb) { arduinode.digitalStreamOn(0, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(1, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(2, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(3, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(4, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(5, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(6, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(7, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(8, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(9, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(10, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(11, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(12, 200, cb); },
    function(cb) { arduinode.digitalStreamOn(13, 200, cb); },
    function(cb) { arduinode.analogStreamOn(0, 200, cb); },
    function(cb) { arduinode.analogStreamOn(1, 200, cb); },
    function(cb) { arduinode.analogStreamOn(2, 200, cb); },
    function(cb) { arduinode.analogStreamOn(3, 200, cb); },
    function(cb) { arduinode.analogStreamOn(4, 200, cb); },
    function(cb) { arduinode.analogStreamOn(5, 200, cb); }
  ];
}

connectArduino();

