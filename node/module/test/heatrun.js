var util = require('util');
var async = require("async");

var Arduinode = require("../arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portName, function(err, result){


  // Mega ADKで最初のコマンドでエラーが必ず発生するので
  // 一発ダミーリードをしてから実行する.
  arduinode.analogRead(0, function(err, reuslt){
    heatrun();
  });


  var event_count = 0;
  arduinode.on("event", function(data){
    event_count++;
    console.log("******** event : " + event_count + "*********");
    console.log(data);
  });



});

function heatrun(){
  async.series(stream_init_tasks, function(err, results){
      if(err){
        console.log(err);
      }
      for(var i = 0; i < results.length; i++){
        console.log(results[i]);
      }

      var error_count = 0;
      var read_count = 0;
      async.forever(function(cb){
        async.series(read_tasks, function(err, results){
          if(err){
            error_count++;
            console.log("error : " + error_count );
          }
          read_count++;
          if((read_count % 100) == 0){
            console.log("******** read : " + read_count + "*********");
            console.log("error : " + error_count );
            for(var i = 0; i < results.length; i++){
              console.log(results[i]);
            }
          }
          cb();
        });
      });

  });
}


var stream_init_tasks = [
  function(cb) { arduinode.digitalRead(0, cb); }, // Mega用ダミーコマンド
  function(cb) { arduinode.digitalStreamOn(0, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(1, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(2, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(3, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(4, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(5, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(6, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(7, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(8, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(9, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(10, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(11, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(12, 500, cb); },
  function(cb) { arduinode.digitalStreamOn(13, 500, cb); },
  function(cb) { arduinode.analogStreamOn(0, 500, cb); },
  function(cb) { arduinode.analogStreamOn(1, 500, cb); },
  function(cb) { arduinode.analogStreamOn(2, 500, cb); },
  function(cb) { arduinode.analogStreamOn(3, 500, cb); },
  function(cb) { arduinode.analogStreamOn(4, 500, cb); },
  function(cb) { arduinode.analogStreamOn(5, 500, cb); }
];

var read_tasks = [
  function(cb){ arduinode.analogRead(0, cb); },
  function(cb){ arduinode.analogRead(1, cb); },
  function(cb){ arduinode.analogRead(2, cb); },
  function(cb){ arduinode.analogRead(3, cb); },
  function(cb){ arduinode.analogRead(4, cb); },
  function(cb){ arduinode.analogRead(5, cb); },
  function(cb){ arduinode.digitalRead(0, cb); },
  function(cb){ arduinode.digitalRead(1, cb); },
  function(cb){ arduinode.digitalRead(2, cb); },
  function(cb){ arduinode.digitalRead(3, cb); },
  function(cb){ arduinode.digitalRead(4, cb); },
  function(cb){ arduinode.digitalRead(5, cb); },
  function(cb){ arduinode.digitalRead(6, cb); },
  function(cb){ arduinode.digitalRead(7, cb); },
  function(cb){ arduinode.digitalRead(8, cb); },
  function(cb){ arduinode.digitalRead(9, cb); },
  function(cb){ arduinode.digitalRead(10, cb); },
  function(cb){ arduinode.digitalRead(11, cb); },
  function(cb){ arduinode.digitalRead(12, cb); },
  function(cb){ arduinode.digitalRead(13, cb); }
];

