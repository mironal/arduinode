"use strict";
var async = require("async");
var program = require("commander");
var _ = require("underscore");

function list(val) {
  return val.split(",");
}

program.version("0.0.1")
  .option("-s, --serial [name]", "Serial port name.", "/dev/tty.usbmodem1411")
  .option("-d, --digital <ports>", "Digital stream test. -d 1,2,3", list)
  .option("-a, --analog <ports>", "Analog stream test. -a 1,2,3", list)
  .parse(process.argv);

var Arduinode = require("../arduinode").Arduinode;

var portName = program.serial;
var arduinode = new Arduinode(portName, function(err, result){
  if(err){
    console.log("Error : " + err);
    console.log("\n********* Serial port name list.*********\n");
    arduinode.list(function(err, ports){
      ports.forEach(function(port) {
        console.log(port.comName);
      });
    });
    // エラーで終了させる.
    process.exit(1);
  }else{
    // analogもdigitalも指定されていなかったら、エラーで終了させる.
    if(program.analog == null && program.digital == null){
      arduinode.close(function(){
        program.outputHelp();
        process.exit(1);
      });
    }

    if(program.analog){
      var ports = program.analog;
      var tasks = _.map(ports, function(p){
        return function(cb){
          arduinode.analogStreamOn(p, cb);
        }
      });
      async.series(tasks, function(err, results){
        if(err) throw err;
        console.log("analogStreamOn");
        console.log(results);
      });
    }

    if(program.digital){
      var ports = program.digital;
      var tasks = _.map(ports, function(p){
        return function(cb){
          arduinode.digitalStreamOn(p, cb);
        }
      });
      async.series(tasks, function(err, results){
        if(err) throw err;
        console.log("digitalStreamOn");
        console.log(results);
      });
    }

  }
});

arduinode.on("event", function(data){
  switch(data.event){
    case "di":
      console.log("************** Digital stream event. **************");
      console.log(data.datas);
      break;
    case "ai":
      console.log("************** Analog stream event. **************");
      console.log(data.datas);
      break;
    default:
      console.log("Unkown event.");
  }
});

// Ctrl + c で終了.
process.on("SIGINT", function(){
  arduinode.digitalStreamOff("all", function(err, result){
    arduinode.analogStreamOff("all", function(err, result){
      arduinode.close(function(){
        process.exit(0);
      });
    });
  });
});
