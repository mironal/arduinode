"use strict";

var util = require('util');
var SerialPort = require("serialport").SerialPort;

function Arduinode(path, options, openImmediately){
  var self = this;
  self.sp = new SerialPort(path, options, openImmediately);
  self.buf = [];
  self.callback = [];
  self.error = null;

  // arduinoは\r\nを返してくる.
  self.sp.on("data", function(data){
    for(var i = 0; i < data.length; i++){
      if( data[i] != 10){
        // \rは無視する.
        if(data[i] != 13){
          self.buf.push(data[i]);
        }
      }else{
        var received = new Buffer(self.buf).toString();
        if(received === "READY"){
          self.emit("open");
        }else{
          var cb = self.callback.shift();
          if(typeof(cb) == "function"){
            cb(self.error, new Buffer(self.buf).toString());
            self.errro = null;
          }
        }
        self.buf = [];
      }
    }
  });
}

util.inherits(Arduinode, SerialPort);

Arduinode.prototype.send = function(cmd, callback) {

  var self = this;
  self.callback.push(callback);
  var sendCmd = cmd.replace(/\n$/, "") + "\n";
  self.sp.write(sendCmd, function(err, writeBytes){
    if(err){
      self.error = err;
      self.emit("error", err);
    }else if(writeBytes != sendCmd.length){
      self.error = "Write bytes mismatch.";
    }
  });
}

module.exports.Arduinode = Arduinode;

/*
 * NOTE:
 *
 *
 * Arduinoのシリアルバッファが大きくないので、
 * 以下の様なコードを書くと直ぐにバッファが溢れて
 * 正常にコマンドが送信できなくなる.
 *
 *  arduinode.on("open", function(){
 *    for(var i = 0; i < 10; i++){
 *      arduinode.send("ai/read/" + i, function(err, resp){
 *        if(err) throw err;
 *        console.log(resp);
 *      });
 *    }
 *  });
 *
 */
