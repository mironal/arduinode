
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
app.get('/users', user.list);



var app_server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var ws = require("socket.io").listen(app_server);
ws.sockets.on('connection',  function (socket) {
});


var Arduinode = require("arduinode").Arduinode;

// Rewrite Your serial port name.
var portName = "/dev/tty.usbmodem1411";


var arduinode = new Arduinode(portName, {
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false,
});


var init_arduino_tasks = [
function(cb){ arduinode.send("d/mode/0?type=INPUT");},
function(cb){ arduinode.send("d/mode/1?type=INPUT");},
function(cb){ arduinode.send("d/mode/2?type=INPUT");},
function(cb){ arduinode.send("d/mode/3?type=INPUT");},
function(cb){ arduinode.send("d/mode/4?type=INPUT");},
function(cb){ arduinode.send("d/mode/5?type=INPUT");},
function(cb){ arduinode.send("d/mode/6?type=INPUT");},
function(cb){ arduinode.send("d/mode/7?type=INPUT");},
function(cb){ arduinode.send("d/mode/8?type=INPUT");},
function(cb){ arduinode.send("d/mode/9?type=INPUT");},
function(cb){ arduinode.send("d/mode/10?type=INPUT");},
function(cb){ arduinode.send("d/mode/11?type=INPUT");},
function(cb){ arduinode.send("d/mode/12?type=INPUT");},
function(cb){ arduinode.send("d/mode/13?type=INPUT");}
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

arduinode.on("open", function(){

  async.series(init_arduino_tasks, function(err, results){
    if(err) throw err;
    console.log(results);
  });

  ws.sockets.emit("open", {msg:"open serial port."});
  setInterval(function(){
    async.series(read_ai_tasks, function(err, results){
      ws.sockets.emit("ai", results);
    });

    async.series(read_di_tasks, function(err, results){
      ws.sockets.emit("di", results);
    });
  }, 1000);
});


