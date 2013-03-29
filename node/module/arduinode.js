"use strict";

var util = require('util');
var SerialPort = require("serialport").SerialPort;

function Arduinode(path, options, openImmediately){
  var self = this;
  self.sp = new SerialPort(path, options, openImmediately);
  self.buf = [];
  self.callback = null;

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
        }else if(typeof(self.callback) == "function"){
          self.callback(new Buffer(self.buf).toString());
          self.callback = null;
        }
        self.buf = [];
      }
    }
  });
}

util.inherits(Arduinode, SerialPort);

Arduinode.prototype.send = function(cmd, callback) {

  var self = this;
  self.callback = callback;
  var sendCmd = cmd.replace(/\n$/, "") + "\n";
  self.sp.write(sendCmd, function(err, writeBytes){
    if(err){
      self.emit("error", err);
    }else if(writeBytes != sendCmd.length){
      self.emit("error", "write bytes mismatch.");
    }
  });
}

module.exports.Arduinode = Arduinode;

