"use strict";

var should = require("should");

var Arduinode = require("../arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

describe("Arduinode low level API test", function(){
  var arduinode;

  before(function(done){
    arduinode = new Arduinode(portName, function(){
      done();
    });
  });

  describe("不正なコマンド", function(){
    describe("意味のない文字列", function(){
      var err;
      var result;
      before(function(done){
        arduinode.send("aaaaaaaaaa", function(e, r){
          err = e;
          result = r;
          done();
        });
      });
      it("errがnullじゃない.", function(){
        should.exists(err);
      });
      it("errのnameがCommand error.", function(){
        err.name.should.equal("Command error.");
      });
      it("errのmessageがIllegal command", function(){
        err.message.should.equal("Illegal command.");
      });
    });

    describe("空の文字", function(){
      var err;
      var result;
      before(function(done){
        arduinode.send("", function(e, r){
          err = e;
          result = r;
          done();
        });
      });
      it("errがnullじゃない.", function(){
        should.exists(err);
      });
      it("errのnameがCommand error.", function(){
        err.name.should.equal("Command error.");
      });
      it("errのmessageがIllegal command", function(){
        err.message.should.equal("Illegal command.");
      });
    });

    describe("長すぎるコマンド", function(){
      var err;
      var result;
      before(function(done){
        arduinode.send("aaafdlafjdkafjldaskfjladfjladkfjaklfjljaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaafdjfldsjf;ladsjf;laksdjf;adlsfj;adskjf;asdjfas;dkjf;aslj", function(e, r){
          err = e;
          result = r;
          done();
        });
      });
      it("errがnullじゃない.", function(){
        should.exists(err);
      });
      it("errのnameがCommand error.", function(){
        err.name.should.equal("Command error.");
      });
      it("errのmessageがCommand is too long", function(){
        err.message.should.equal("Command is too long.");
      });
    });
  });


  describe("Analog", function(){
    describe("Write", function(){
      describe("正常なコマンドを送信", function(){
        describe("ao/write/0?val=25", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ao/write/0?val=25", function(e, r){
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
      describe("不正なコマンドを送信", function(){
        describe("不正なポート", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ao/write/a?val=25", function(e, r){
              err = e;
              result = r;
              done();
            });
          });

          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがIllegal port number.", function(){
            err.message.should.equal("Illegal port number.");
          });
        });

        describe("クエリーが無い", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ao/write/0", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがQuery not found.", function(){
            err.message.should.equal("Query not found.");
          });
        });

        describe("クエリーがvalじゃ無い", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ao/write/0?hoge=25", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがval is not specified..", function(){
            err.message.should.equal("val is not specified.");
          });
        });
    });
    });

    describe("Read", function(){
      describe("正常なコマンドを送信", function(){
        describe("ai/read/0", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ai/read/0", function(e, r){
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
        // ポート番号のチェックはしていないので
        // arduinoに存在しないポートでも一応動く.
        describe("ai/read/10", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ai/read/10", function(e, r){
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
          it("portが10", function(){
            result.should.have.property("port",10);
          });
          it("valというプロパティがある", function(){
            result.should.have.property("val");
          });
        });
      });

      describe("不正なコマンドを送信", function(){
        describe("不正なポート", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ai/read/a", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがval is not specified..", function(){
            err.message.should.equal("Illegal port number.");
          });

        });
      });

    });

    describe("Switch reference", function(){
      describe("正常なコマンドを送信", function(){
        describe("INTERNALに設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ai/ref?type=INTERNAL", function(e, r){
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
            arduinode.send("ai/ref?type=EXTERNAL", function(e, r){
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
            arduinode.send("ai/ref?type=DEFAULT", function(e, r){
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

      describe("不正なコマンドを送信", function(){
        describe("Illegal type", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ai/ref?type=aaaaa", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがIllegal type", function(){
            err.message.should.equal("Illegal type.");
          });
      });
        describe("Query無し", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("ai/ref", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがQuery not found", function(){
            err.message.should.equal("Query not found.");
          });
        });
      });
    });
  });

  describe("Digital", function(){
    describe("Pin mode", function(){
      describe("正常なコマンドを送信", function(){
        describe("INPUT_PULLUP", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("d/mode/0?type=INPUT_PULLUP", function(e, r){
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

        describe("OUTPUT", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("d/mode/0?type=OUTPUT", function(e, r){
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

        describe("INPUT", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("d/mode/0?type=INPUT", function(e, r){
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
      describe("不正なコマンドを送信", function(){
        describe("Illegal type", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("d/mode/0?type=hoge", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがIllegal type", function(){
            err.message.should.equal("Illegal type.");
          });
        });

        describe("Query無し", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("d/mode/0", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });
          it("errのmessageがQuery not found", function(){
            err.message.should.equal("Query not found.");
          });
        });

        describe("Illegal port number", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("d/mode/a", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });

          it("errのmessageがQuery not found.", function(){
            err.message.should.equal("Query not found.");
          });
        });
      });
    });

    describe("Write", function(){
      describe("正常なコマンドを送信", function(){
        describe("port3に1を設定", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("do/write/3?val=1", function(e, r){
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
            arduinode.send("do/write/4?val=0", function(e, r){
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
            arduinode.send("do/write/5?val=HIGH", function(e, r){
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
            arduinode.send("do/write/6?val=LOW", function(e, r){
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
            arduinode.send("do/write/7?val=20", function(e, r){
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

      describe("不正なコマンドを送信", function(){
        describe("Illegal port number", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("do/write/a?val=HIGH", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });

          it("errのmessageがIllegal port number.", function(){
            err.message.should.equal("Illegal port number.");
          });
        });

        describe("Query not found", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("do/write/0", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });

          it("errのmessageがQuery not found", function(){
            err.message.should.equal("Query not found.");
          });
        });

        describe("Illegal value", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("do/write/0?val=hoge", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });

          it("errのmessageがIllegal value", function(){
            err.message.should.equal("Illegal value.");
          });
        });

        describe("val is not specified", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("do/write/0?hoge", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });

          it("errのmessageがval is not specified", function(){
            err.message.should.equal("val is not specified.");
          });
        });
      });
    });

    describe("Read", function(){
      describe("正常なコマンドを送信", function(){
        describe("port1を読む", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("di/read/1", function(e, r){
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
      describe("不正なコマンドを送信", function(){
        describe("Illegal port number", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("di/read/a", function(e, r){
              err = e;
              result = r;
              done();
            });
          });
          it("errがnullじゃない", function(){
            should.exists(err);
          });
          it("errのnameがCommand error.", function(){
            err.name.should.equal("Command error.");
          });

          it("errのmessageがIllegal port number.", function(){
            err.message.should.equal("Illegal port number.");
          });
        });

      });

    });
  });

  after(function(done){
    arduinode.close();
    done();
  });
});
