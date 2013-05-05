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

    describe("Illegal type コマンド", function(){
      var err;
      var result;
      before(function(done){
        arduinode.send(1, function(e, r){
          err = e;
          result = r;
          done();
        });
      });
      it("errがnullじゃない.", function(){
        should.exists(err);
      });
      it("errのnameがTypeError", function(){
        err.name.should.equal("TypeError");
      });
      it("errのmessageがcommand must be a string.", function(){
        err.message.should.equal("command must be a string.");
      });
    });

    describe("nullコマンド", function(){
      var err;
      var result;
      before(function(done){
        arduinode.send(null, function(e, r){
          err = e;
          result = r;
          done();
        });
      });
      it("errがnullじゃない.", function(){
        should.exists(err);
      });
      it("errのnameがError", function(){
        err.name.should.equal("Error");
      });
      it("errのmessageが command is required.", function(){
        err.message.should.equal("command is required.");
      });
    });


    describe("Illegal state command.", function(){
      var err;
      var result;
      before(function(done){
        arduinode.send("a", function(e, r){});
        arduinode.send("b", function(e, r){
          err = e;
          result = r;
          done();
        });
      });
      it("errがnullじゃない.", function(){
        should.exists(err);
      });
      it("errのnameがIllegalApiCallError", function(){
        err.name.should.equal("IllegalApiCallError");
      });
      it("errのmessageがPlease call after waiting the end of the API that called earlier.", function(){
        err.message.should.equal("Please call after waiting the end of the API that called earlier.");
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
      it("errのnameがError", function(){
        err.name.should.equal("Error");
      });
      it("errのmessageが command is required.", function(){
        err.message.should.equal("command is required.");
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
        describe("a/write/0?val=25", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("a/write/0?val=25", function(e, r){
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
            arduinode.send("a/write/a?val=25", function(e, r){
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
            arduinode.send("a/write/0", function(e, r){
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
            arduinode.send("a/write/0?hoge=25", function(e, r){
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
        describe("a/read/0", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("a/read/0", function(e, r){
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
        // 下記コミット以降ポートチェックをするようにした.
        // 05c847d9c026b67930158664e3f931690c7f5d0f
        describe("a/read/100", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("a/read/100", function(e, r){
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
          it("errのmessageがIllegal port number..", function(){
            err.message.should.equal("Illegal port number.");
          });
        });
      });

      describe("不正なコマンドを送信", function(){
        describe("不正なポート", function(){
          var err;
          var result;
          before(function(done){
            arduinode.send("a/read/a", function(e, r){
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
            arduinode.send("a/ref?type=INTERNAL", function(e, r){
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
            arduinode.send("a/ref?type=EXTERNAL", function(e, r){
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
            arduinode.send("a/ref?type=DEFAULT", function(e, r){
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
            arduinode.send("a/ref?type=aaaaa", function(e, r){
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
            arduinode.send("a/ref", function(e, r){
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
            arduinode.send("d/write/3?val=1", function(e, r){
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
            arduinode.send("d/write/4?val=0", function(e, r){
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
            arduinode.send("d/write/5?val=HIGH", function(e, r){
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
            arduinode.send("d/write/6?val=LOW", function(e, r){
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
            arduinode.send("d/write/7?val=20", function(e, r){
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
            arduinode.send("d/write/a?val=HIGH", function(e, r){
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
            arduinode.send("d/write/0", function(e, r){
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
            arduinode.send("d/write/0?val=hoge", function(e, r){
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
            arduinode.send("d/write/0?hoge", function(e, r){
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
            arduinode.send("d/read/1", function(e, r){
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
            arduinode.send("d/read/a", function(e, r){
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

    // LOWはポートの状態によっては大量に割込が入って不安定になるので
    // テストは実行しない.
    // プルアップするなどしてから行えば安全なはず.
    describe("Interrupt", function(){
      describe("Attach", function(){
        describe("正常なコマンドを送信", function(){
          describe("interrupt0をCHANGEで有効", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/on/0?type=CHANGE", function(e, r){
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

          describe("interrupt1をRISINGで有効", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/on/1?type=RISING", function(e, r){
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
            it("modeがRISING", function(){
              result.mode.should.equal("RISING");
            });
          });

          describe("interrupt1をFALLINGで有効", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/on/1?type=FALLING", function(e, r){
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
            it("modeがFALLING", function(){
              result.mode.should.equal("FALLING");
            });
          });
        });

        describe("不正なコマンドを送信", function(){
          describe("不正な割込番号を指定", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/on/10?type=CANGE", function(e, r){
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

            it("errのmessageがIllegal interrupt number.", function(){
              err.message.should.equal("Illegal interrupt number.");
            });
          });

          describe("不正な割込mode", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/on/0?type=AAAA", function(e, r){
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

            it("errのmessageがIllegal type.", function(){
              err.message.should.equal("Illegal type.");
            });
          });

        });
      });

      describe("Detach", function(){

        describe("正常なコマンドを送信", function(){
          describe("interrupt0を無効化", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/off/0", function(e, r){
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

          describe("interrupt1を無効化", function(e, r){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/off/1", function(e, r){
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
          describe("不正な割込番号を指定", function(){
            var err;
            var result;
            before(function(done){
              arduinode.send("d/int/off/10", function(e, r){
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

            it("errのmessageがIllegal interrupt number.", function(){
              err.message.should.equal("Illegal interrupt number.");
            });

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
