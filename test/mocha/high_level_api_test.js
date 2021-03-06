"use strict";

var should = require("should");

var Arduinode = require("../../arduinode").Arduinode;

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

    describe("Stream", function(){
      describe("analogStreamOn(0, 500)", function(){
        var err;
        var result;
        before(function(done){
          arduinode.analogStreamOn(0, 500, function(e, r){
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
        it("portが0", function(){
          result.port.should.equal(0);
        });
        it("valが1", function(){
          result.val.should.equal(1);
        });
      });

      describe("analogStreamOff(0)", function(){
        var err;
        var result;
        before(function(done){
          arduinode.analogStreamOff(0, function(e, r){
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
        it("portが0", function(){
          result.port.should.equal(0);
        });
        it("valが0", function(){
          result.val.should.equal(0);
        });
      });

      describe("analogStreamOff(\"all\")", function(){
        var err;
        var result;
        before(function(done){
          arduinode.analogStreamOff("all", function(e, r){
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
        it("portが255", function(){
          result.port.should.equal(255);
        });
        it("valが0", function(){
          result.val.should.equal(0);
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

  describe("Stream", function(){
    describe("digitalStreamOn(0, 100)", function(){
      var err;
      var result;
      before(function(done){
        arduinode.digitalStreamOn(0, 100, function(e, r){
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
      it("portが0", function(){
        result.port.should.equal(0);
      });
      it("valが1", function(){
        result.val.should.equal(1);
      });
    });

    describe("digitalStreamOff(0)", function(){
      var err;
      var result;
      before(function(done){
        arduinode.digitalStreamOff(0, function(e, r){
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
      it("portが0", function(){
        result.port.should.equal(0);
      });
      it("valが0", function(){
        result.val.should.equal(0);
      });
    });

    describe("digitalStreamOff(\"all\")", function(){
      var err;
      var result;
      before(function(done){
        arduinode.digitalStreamOff("all", function(e, r){
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
      it("portが255", function(){
        result.port.should.equal(255);
      });
      it("valが0", function(){
        result.val.should.equal(0);
      });
    });
  });


  describe("Interrupt", function(){
    describe("正常なコマンドを送信", function(){
      describe("attachInterrupt(0, \"CHANGE\")", function(){
        var err;
        var result;
        before(function(done){
          arduinode.attachInterrupt(0, "CHANGE", function(e, r){
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
        it("numが0", function(){
          result.num.should.equal(0);
        });
        it("modeがCHANGE", function(){
          result.mode.should.equal("CHANGE");
        });
      });

      describe("attachInterrupt(1, \"CHANGE\")", function(){
        var err;
        var result;
        before(function(done){
          arduinode.attachInterrupt(1, "CHANGE", function(e, r){
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
        it("numが0", function(){
          result.num.should.equal(1);
        });
        it("modeがCHANGE", function(){
          result.mode.should.equal("CHANGE");
        });
      });

      describe("detachInterrupt(0)", function(){
        var err;
        var result;
        before(function(done){
          arduinode.detachInterrupt(0, function(e, r){
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
        it("numが0", function(){
          result.num.should.equal(0);
        });
      });

      describe("detachInterrupt(1)", function(){
        var err;
        var result;
        before(function(done){
          arduinode.detachInterrupt(1, function(e, r){
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
        it("numが1", function(){
          result.num.should.equal(1);
        });
      });
    });

    describe("不正なコマンドを送信", function(){
      describe("attachInterrupt(\"1\", \"CHANGE\")", function(){
        var err;
        var result;
        before(function(done){
          arduinode.attachInterrupt("1", "CHANGE", function(e, r){
            err = e;
            result = r;
            done();
          });
        });
        it("errがnullじゃない", function(){
          should.exists(err);
        });
        it("errのnameがTypeError", function(){
          err.name.should.equal("TypeError");
        });
        it("errのmessageがnum must be a number", function(){
          err.message.should.equal("num must be a number");
        });
      });

      describe("attachInterrupt(0, 1)", function(){
        var err;
        var result;
        before(function(done){
          arduinode.attachInterrupt(0, 1, function(e, r){
            err = e;
            result = r;
            done();
          });
        });
        it("errがnullじゃない", function(){
          should.exists(err);
        });
        it("errのnameがTypeError", function(){
          err.name.should.equal("TypeError");
        });
        it("errのmessageがmode must be a number", function(){
          err.message.should.equal("mode must be a string");
        });
      });

      describe("detachInterrupt(\"1\")", function(){
        var err;
        var result;
        before(function(done){
          arduinode.detachInterrupt("1", function(e, r){
            err = e;
            result = r;
            done();
          });
        });
        it("errがnullじゃない", function(){
          should.exists(err);
        });
        it("errのnameがTypeError", function(){
          err.name.should.equal("TypeError");
        });
        it("errのmessageがmode must be a number", function(){
          err.message.should.equal("num must be a number");
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
