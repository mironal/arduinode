/*
 * mocha -t 50000 module_test.js
 * で起動すること.
 * -t オプションを長めに指定しないと接続する前に落ちる.
 */


var should = require("should");
var async = require('async');

var Arduinode = require("../../module/arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

var arduinode = null;


describe("arduinode test.", function(){
  before(function(done){
    arduinode = new Arduinode(portName, function(){
      done();
    });
  });

  it("AI", function(done){
    arduinode.send("ao/write/0?val=15", function(err, result){
      should.not.exists(err);
      result.should.include({msg: "OK"});
      done();
    });


    if("AI fault", function(done){
      arduinode.send("ao/write/0?val=15", function(err, result){
        should.not.exists(err);
        result.should.include({msg: "OK"});
        done();
      });

    });

  });
});
