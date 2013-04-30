"use strict";

var should = require("should");

var Arduinode = require("../arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

describe("Arduinode high level API test", function(){
  var arduinode;
  before(function(done){
    arduinode = new Arduinode(portName, function(){
      done();
    });
  });

  describe("Analog", function(){
    describe("Write", function(){
      describe("正常なコマンドを送信", function(){
        describe("analogWrite", function(){
          var err;
          var result;
          before(function(done){
            arduinode.analogWrite(0, 25, function(e, r){
              err = e;
              result = r;
              done();
            });
          });

          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.should.have.property("msg", "OK");
          });
          it("portが0", function(){
            result.should.have.property("port", 0);
          });
          it("valが25", function(){
            result.should.have.property("val", 25);
          });
        });
      });
    });

    describe("analogRead", function(){
      describe("正常なコマンドを送信", function(){
        describe("port = 0", function(){
          var err;
          var result;
          before(function(done){
            arduinode.analogRead(0, function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.should.have.property("msg", "OK");
          });
          it("portが0", function(){
            result.should.have.property("port", 0);
          });
          it("valというプロパティがある", function(){
            result.should.have.property("val");
          });
        });
      });
    });

    describe("analogReference", function(){
      describe("正常なコマンドを送信", function(){
        describe("INTERNALに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.analogReference("INTERNAL", function(e, r){
              err = e;
              result = r;
              done();
            });
          });

          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("typeがINTERNAL", function(){
            result.type.should.equal("INTERNAL");
          });
        });
        describe("EXTERNALに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.analogReference("EXTERNAL", function(e, r){
              err = e;
              result = r;
              done();
            });
          });

          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("typeがEXTERNAL", function(){
            result.type.should.equal("EXTERNAL");
          });
        });
        describe("DEFAULTに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.analogReference("DEFAULT", function(e, r){
              err = e;
              result = r;
              done();
            });
          });

          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("typeがDEFAULT", function(){
            result.type.should.equal("DEFAULT");
          });
        });
      });
    });
  });

  describe("Digital", function(){
    describe("pinMode", function(){
      describe("正常なコマンドを送信", function(){
        describe("port0をINPUT_PULLUPに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.pinMode(0, "INPUT_PULLUP", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("typeがINPUT_PULLUP", function(){
            result.type.should.equal("INPUT_PULLUP");
          });
        });

        describe("port0をOUTPUTに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.pinMode(0, "OUTPUT", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("typeがOUTPUT", function(){
            result.type.should.equal("OUTPUT");
          });
        });

        describe("port0をINPUTに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.pinMode(0, "INPUT", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("typeがINPUT", function(){
            result.type.should.equal("INPUT");
          });
        });
      });
    });

    describe("digitalWrite", function(){
      describe("正常なコマンドを送信", function(){
        describe("port3に1を設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.digitalWrite(3, 1, function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("portが3", function(){
            result.port.should.equal(3);
          });
          it("valが1", function(){
            result.val.should.equal(1);
          });
        });

        describe("port4に0を設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.digitalWrite(4, 0, function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("portが4", function(){
            result.port.should.equal(4);
          });
          it("valが0", function(){
            result.val.should.equal(0);
          });
        });

        describe("port5にHIGHを設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.digitalWrite(5, "HIGH", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("portが5", function(){
            result.port.should.equal(5);
          });
          it("valが1", function(){
            result.val.should.equal(1);
          });
        });

        describe("port6にLOWを設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.digitalWrite(6, "LOW", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("portが6", function(){
            result.port.should.equal(6);
          });
          it("valが0", function(){
            result.val.should.equal(0);
          });
        });

        describe("port7に20を設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.digitalWrite(7, 20, function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("portが7", function(){
            result.port.should.equal(7);
          });
          it("valが0", function(){
            result.val.should.equal(0);
          });
        });
      });
    });

    describe("digitalRead", function(){
      describe("正常なコマンドを送信", function(){
        describe("port1を読む", function(){
          var err;
          var result;
          before(function(done){
            arduinode.digitalRead(1, function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnull", function(){
            should.not.exists(err);
          });
          it("msgがOK", function(){
            result.msg.should.equal("OK");
          });
          it("portが1", function(){
            result.port.should.equal(1);
          });
          it("valが0 or 1", function(){
            result.val.should.be.within(0, 1);
          });
        });
      });
    });
  });

  after(function(done){
    arduinode.close(function(){
      done();
    });
  });
});
