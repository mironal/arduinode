"use strict";

var util = require('util');
var SerialPort = require("serialport").SerialPort;

var options = {
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false,
};

function rethrow(){
  return function(err){
    if(err) throw err;
  };
}

function makeCallback(cb) {
  if (typeof cb !== 'function') {
    return rethrow();
  }

  return function() {
    return cb.apply(null, arguments);
  };
}

/***

# はじめに <a name="intro">

## APIの安定度 <a name="stability">

各APIには以下の3段階の安定度があります。現段階では、この安定度の段階すら変更される可能性があります。

1. 実験的
:実験的なAPIです。将来大きく仕様が変更される可能性があります

2. 安定
:まだ十分にテストされていません。しかし、大きな仕様変更はありません。

3. 固定
:十分にテストされた安定したAPIです。仕様が変更されることはまずありません。


## API使用上の注意 <a name="attention">

APIを連続してコールする場合は、それぞれのAPIの完了を待つ必要があります.

これはArduinoのシリアル受信バッファサイズが小さいため、同時に複数のコマンドを送信すると受信バッファが溢れ、送信したコマンドの文字列が破壊されるためです。

例えば以下の様なコードを実行すると容易にエラーを発生させる事が出来ます.

```js
arduinode.digitalRead(0, fucntion(err, result){
  // Maybe don't have error.
  if(err){
    return coneosle.log(err);
  }
  console.log(result);
});

arduinode.digitalRead(1, fucntion(err, result){
  // Error occurs!!!
  if(err){
    return coneosle.log(err);
  }
  console.log(result);
});
```

この問題を回避するために、以下の例のようにコールバック関数内で次のコマンドをArduinoに送信して下さい。

```js
arduinode.digitalRead(0, function(err, result){
  if(err){
    return coneosle.log(err);
  }
  console.log(result);
  arduinode.digitalRead(1, function(err, result){
    if(err){
      return coneosle.log(err);
    }
    console.log(result);
  });
});
```

但しこのように記述するとネストが深くなり大変です.

そこでasyncモジュールを使うことで簡単に記述する方法を紹介します。

```sh
npm install async
```

してasyncモジュールを取得して下さい。

以下にasyncモジュール使用前と使用後の完全なコード例を記載します.

asyncモジュール使用前

```js
"use strict";
var async = require("async");
var Arduinode = require("arduinode").Arduinode;

// Your serial port name.
var portname = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portname, function(err, result){ if(err){
    return console.log(err);
  }
  arduinode.digitalRead(0, function(err, result){
    if(err){
      return console.log(err);
    }
    console.log(result);

    arduinode.digitalRead(1, function(err, result){
      if(err){
        return console.log(err);
      }
      console.log(result);

      arduinode.digitalRead(2, function(err, result){
        if(err){
          return console.log(err);
        }
        console.log(result);

        arduinode.digitalRead(3, function(err, result){
          if(err){
            return console.log(err);
          }
          console.log(result);

          arduinode.digitalRead(4, function(err, result){
            if(err){
              return console.log(err);
            }
            console.log(result);

            arduinode.digitalRead(5, function(err, result){
              if(err){
                return console.log(err);
              }
              console.log(result);
              arduinode.digitalRead(6, function(err, result){
                if(err){
                  return console.log(err);
                }
                console.log(result);

                arduinode.close(function(){
                  console.log("exit");
                });
              });
            });
          });
        });
      });
    });
  });
});
```

asyncモジュール使用後

```js
"use strict";
var async = require("async");
var Arduinode = require("arduinode").Arduinode;

// Your serial port name.
var portname = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portname, function(err, result){
  if(err){
    return console.log(err);
  }

  // クロージャーでport番号をキャプチャする.
  function makeTask(port){
    return function(cb){
      arduinode.digitalRead(port, cb);
    };
  }
  var tasks = [];
  for(var i = 0; i < 7; i++){
    tasks.push(makeTask(i));
  }

  tasks.push(function(cb){
    arduinode.close(cb);
  });

  // asyncモジュールを使用してArduinoを操作.
  async.series(tasks, function(err, results){
    if(err){
      return console.log(err);
    }
    // 各コマンドの結果が配列として入ってくる.
    console.log(results);
  });
});

```


また、各結果に名前を付けて以下のように書くことも出来ます。

```js
var arduinode = new Arduinode(portname, function(err, result){
  var tasks = {
    di0: function(callback){
      arduinode.digitalRead(0, callback);
    },
    di1: function(callback){
      arduinode.digitalRead(1, callback);
    },
    di2: function(callback){
      arduinode.digitalRead(2, callback);
    }
  };

  async.series(tasks, function(err, results){
    if(err){
      console.log(err);
    }
    console.log(results.di0);
    console.log(results.di1);
    console.log(results.di2);

    arduinode.close(function(){
      console.log("exit");
    });

  });
});
```

*/

/***

# コンストラクタ <a name="Arduinode">

### Sample code

```js
// npm install arduinode
var Arduinode = require("arduinode").Arduinode;

var portname = "Your serial port name";

var arduinode = new Arduinode(portname, function(err, result){
  if(err) throw err;
  console.log(result);
});
```

*/

function Arduinode(portname, callback){


  // SerialPortオープン後に通信可能になるので、
  // 未オープンの状態で通信を開始させないために
  // ここのcallbackは必須とする.
  if(!callback || typeof callback !== 'function'){
    throw new Error("callback function is required.");
  }

  if(!portname){
    process.nextTick(function(){
      callback(new Error("portname is required."));
    });
    return;
  }


  var self = this;
  self.sp = new SerialPort(portname, options);
  self.buf = [];
  self.callback = callback;

  self.sp.on("error", function(e){
    self._execCallback(e, null);
  });

  self.sp.on("end", function(){
    self.emit("end");
  });

  self.sp.on("close", function(err, data){
    self.emit("close", err, data);
  });

  // arduinoは\r\nを返してくる.
  self.sp.on("data", function(data){

    for(var i = 0; i < data.length; i++){
      if( data[i] != 10){
        // \rは無視する.
        if(data[i] != 13){
          self.buf.push(data[i]);
        }
      }else{
        var msg = new Buffer(self.buf).toString();
        try{
          // streamのjsonが破壊されていた場合、エラーを通知する方法が現在のところ無い。
          // streamのデータなのかなのか普通のリクエストに対するレスポンスなのかを
          // 判別する方法が無いため.
          var json = JSON.parse(msg);
          if(json.event){
            self.emit("event", json);
          }else{
            if(json.msg == "NG"){
              var error = new Error();
              error.name = "Command error.";
              error.message = json.error;
              self._execCallback(error, json);
            }else{
              self._execCallback(null, json);
            }
          }
        }catch(e){
          // これがベストなのか分からないが、とりあえずthrowする.
          console.error("JSON parse error : " + e);
          throw e;
        }
        self.buf.length = 0;
      }
    }
  });
}

util.inherits(Arduinode, SerialPort);

/*
 *
 * send command.
 *
 * Low level API
 */
Arduinode.prototype.send = function(command, callback) {


  callback = makeCallback(callback);

  if(!command){
    return callback(new Error("command is required."));
  }

  if(typeof command !== "string"){
    return callback(new TypeError("command must be a string."));
  }

  var self = this;
  self._send(command, callback);
}

/*
 * High level API
 */

/***

# Analogポートに関する操作 <a name="analog">

*/

/***

## AD値読み込み <a name="analogRead">

指定したポートのAD値を読み込む。

### 関数

```js
analogRead(port, callback);
```

### 引数

[port]
:ポート番号

### Sample code

```js
var port = 0;
arduinode.analogRead(port, function(err, reuslt){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', port: 0, val: 982 }
});
```

### 対応するArduinoの操作

```c
analogRead(port);
```

### 安定度

安定

*/
Arduinode.prototype.analogRead = function(port, callback) {

  callback = makeCallback(callback);

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number"));
  }

  var self = this;
  self._send("a/read/" + port, callback);
}

/***

## アナログ値(PWM)出力 <a name="analogWrite">

指定したポートからアナログ値を出力します。

### 関数

```js
analogWrite(port, value, callback);
```

### 引数

[port]
:ポート番号

[value]
:出力値


### Sample code

```js
var port = 1;
var value = 100;
arduinode.analogWrite(port, value, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', port: 0, val: 200 }
});
```

### 対応するArduinoの操作

```c
analogWrite(port, value);
```

### 安定度

安定

*/
Arduinode.prototype.analogWrite = function(port, val, callback) {

  callback = makeCallback(callback);

  if(typeof val !== "number"){
    return callback(new TypeError("val must be a number"));
  }

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number"));
  }

  var self = this;
  self._send("a/write/" + port + "?val=" + val, callback);
}

/***

## Analog入力基準電圧変更 <a name="analogReference">

AD値読み込みに使用される基準電圧源を変更します。

### 関数

```js
analogReference(type, callback);
```

### 引数

[type]
:基準電圧

* DEFAULT: 電源電圧(5V)が基準電圧となります。これがデフォルトです
* INTERNAL: 内蔵基準電圧を用います。ATmega168と328Pでは1.1Vです
* EXTERNAL: AREFピンに供給される電圧(0V～5V)を基準電圧とします

### Sample code

```js
var type = "INTERNAL"; // "INTERNAL" or "EXTERNAL" or "DEFAULT"
arduinode.analogReference(type, function(err, result){
  if(err) throw err;
  console.log(result);
});
```

### 対応するArduinoの操作

```c
analogReference(type);
```

### 安定度

安定

*/
Arduinode.prototype.analogReference = function(type, callback) {

  callback = makeCallback(callback);

  if(typeof type !== "string"){
    return callback(new TypeError("type must be a string"));
  }

  var self = this;
  self._send("a/ref?type" + type, callback);
}

/***

# Digitalポートに関する操作 <a name="digital">

*/

/***

## ポート値読み込み <a name="digitalRead">

指定したポートの値(0 or 1)を読み込みます。

### 関数

```js
digitalRead(port, callback);
```

### 引数
[port]
:ポート番号

### Sample code

```js
var port = 0;
arduinode.digitalRead(port, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', port: 0, val: 1 }
});
```

### 対応するArduinoの操作

```c
digitalRead(port);
```

### 安定度

安定

*/
Arduinode.prototype.digitalRead = function(port, callback) {

  callback = makeCallback(callback);

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number"));
  }

  var self = this;
  self._send("d/read/" + port, callback);
}


/***

## ポート出力 <a name="digitalWrite">

指定したポートに値を書き込みます。

### 関数

```js
digitalWrite(port, value, callback);
```

### Sample code

```js
var port = 0;
var value = 1; // 0 or 1 or "HIGH" or "LOW"
arduinode.digitalWrite(port, value,function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', port: 0, val: 1 }
});
```

### 引数
[port]
:ポート番号

[value]
:出力値. (0 , 1 or "HIGH", "LOW")

### 対応するArduinoの操作

```c
digitalWrite(port, value);
```

### 安定度

安定

*/
Arduinode.prototype.digitalWrite = function(port, val, callback) {

  callback = makeCallback(callback);

  if(typeof val !== "number" && val !== "HIGH" && val !== "LOW"){
    return callback(new TypeError("val must be a number"));
  }

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number"));
  }

  var self = this;
  self._send("d/write/" + port + "?val=" + val, callback);
}


/***

## ピンモード変更 <a name="pinMode">

指定したポートのピンモードを変更します。

### 関数

```js
pinMode(port, mode, callback);
```

### 引数
[port]
:ポート番号

[mode]
:設定するモード "INPUT", "INPUT_PULLUP" or "OUTPUT"


### Sample code

```js
var port = 0;
var mode = "INPUT"; // "INPUT" or "INPUT_PULLUP" or "OUTPUT"
arduinode.pinMode(port, mode, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', type: 'INPUT' }
});
```

### 対応するArduinoの操作

```c
pinMode(port, mode);
```

### 安定度

安定

*/
Arduinode.prototype.pinMode = function(port, type, callback) {

  callback = makeCallback(callback);

  if(typeof type !== "string"){
    return callback(new TypeError("type must be a string"));
  }

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number"));
  }

  var self = this;
  self._send("d/mode/" + port + "?type=" + type, callback);
}

/***

# Stream(連続転送) API <a name="stream">

リクエストを送らずにDIやAIの指定したポートの値を指定した間隔(msec)で取得することが出来ます。

Arduinoから送られてきたDIやAIの値は"event"というイベントに通知されるので、以下の様なコードで値を取得することが出来ます。

```js
arduinode.on("event", function(data){
  console.log(data);
});
```

コールバック関数のdataに格納されている情報は以下の様なJSONになっています。

```js
{"event":"[type]", "data":[dataJson]}
```

[type]はイベントの種類を表します。

AI読み取りなら"ai"が、DI読み取りなら"di"が格納されています。

[dataJson]はそのイベントで読み取られた情報が格納されています。

AIならanalogRead()を実行した時のレスポンスと同じ内容が、DIならdigitalRead()を実行した時のレスポンスと同じ内容のJSONが格納されています。

例えばAI0の読み取り時に発生するeventのdataは以下のようになります(但しvalは環境により変わります。

```js
{"event":"ai", "data":{"msg":"OK", "port":0, "val":100}}
```

AI、DIに関わらず、同一のイベントが発生するので必要に応じて条件分岐をする必要があります。

```js
arduinode.on("event", function(data){
  switch(data.event){
    case "di":
      console.log("************** Digital stream event. **************");
      console.log(data.data);
      break;
    case "ai":
      console.log("************** Analog stream event. **************");
      console.log(data.data);
      break;
    default:
      console.log("Unkown event.");
  }
});
```


但し、これは将来より簡潔に記述するためのAPIを提供する予定です。


※ Stream APIの仕様は将来変更される可能性があります。

*/


/***
## DI連続転送ON <a name="digitalStreamOn">

指定したポートの連続転送を有効にします.

### 関数

```js
digitalStreamOn(port, interval, callback);
```

### 引数

[port]
:ポート番号

[interval]
:転送間隔[msec]

### Sample code

```js
var port = 0;
var interval = 500; // 500[ms]
arduinode.digitalStreamOn(port, interval, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // {"msg":"OK", "port":0, "val":1}
});

// data event. (experimental)
arduinode.on("event", function(data){
  console.log(data);
});
```

### 安定度

実験的

*/
Arduinode.prototype.digitalStreamOn = function(port, interval, callback) {

  callback = makeCallback(callback);

  if(typeof interval !== "number"){
    return callback(new TypeError("interval must be a number. " + interval));
  }

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number. " + port));
  }

  var self = this;
  self._send("stream/di/on/" + port + "?interval=" + interval, callback);
}


/***

## DI連続転送OFF <a name="digitalStreamOff">

指定したポートの連続転送を無効にします.

### 関数

```js
digitalStreamOff(port, callback);
```

### 引数

[port]
:ポート番号

### Sample code

```js
var port = 0;
arduinode.digitalStreamOff(port, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // {"msg":"OK", "port":0, "val":0}
});

// data event. (experimental)
arduinode.on("event", function(data){
  console.log(data);
});
```

### 安定度

実験的

*/
Arduinode.prototype.digitalStreamOff = function(port, callback) {

  callback = makeCallback(callback);

  if(port !== "all" && typeof port !== "number"){
    return callback(new TypeError("port must be a number or \"all\""));
  }

  var self = this;
  self._send("stream/di/off/" + port, callback);
}

/***
## AI連続転送ON <a name="analogStreamOn">

指定したポートの連続転送を有効にします.

### 関数

```js
analogStreamOn(port, interval, callback);
```

### 引数

[port]
:ポート番号

[interval]
:転送間隔[msec]


### Sample code

```js
var port = 0;
var interval = 1000; // 1000[ms] = 1[s]
arduinode.analogStreamOn(port, interval, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // {"msg":"OK", "port":0, "val":1}
});

// data event. (experimental)
arduinode.on("event", function(data){
  console.log(data);
});
```

### 安定度

実験的

*/
Arduinode.prototype.analogStreamOn = function(port, interval, callback) {

  callback = makeCallback(callback);

  if(typeof interval !== "number"){
    return callback(new TypeError("interval must be a number"));
  }

  if(typeof port !== "number"){
    return callback(new TypeError("port must be a number"));
  }

  var self = this;
  self._send("stream/ai/on/" + port + "?interval=" + interval, callback);
}

/***
## AI連続転送OFF <a name="analogStreamOff">

指定したポートの連続転送を無効にします.

### 関数

```js
analogStreamOff(port, callback);
```

### 引数

[port]
:ポート番号

### Sample code

```js
var port = 0;
arduinode.analogStreamOff(port, function(err, result){
  if(err) throw err;
  console.log(result);
  // {"msg":"OK", "port":0, "val":0}
});

// data event. (experimental)
arduinode.on("event", function(data){
  console.log(data);
});
```

### 安定度

実験的

*/
Arduinode.prototype.analogStreamOff = function(port, callback) {

  callback = makeCallback(callback);

  if(port !== "all" && typeof port !== "number"){
    return callback(new TypeError("port must be a number or \"all\""));
  }

  var self = this;
  self._send("stream/ai/off/" + port, callback);
}

/***

# Interrupt(外部割込)に関する操作 <a name="interrupt">

特定のポートの状態が変化したことをイベントして通知することが出来ます。

スイッチの状態変化やパルスを取得するのにポーリングを行うのは効率的ではありません。

外部割込みを使用することにより、効率的に状態の変化を取得出来ます。

外部割込みには以下の2つの割込が使用可能です。

割込番号 | Digitalポート
---------|-------------
0        | 2
1        | 3


Arduino Megaの場合は以下の6つの割込が使用可能です。

割込番号 | Digitalポート
---------|-------------
0        | 2
1        | 3
2        | 21
3        | 20
4        | 19
5        | 18


※Arduinoのリファレンスも参考にして下さい.

割込のイベントは"event"というイベントされ以下のコードで取得することが可能です.

```js
arduinode.on("event" function(data){
  console.log(data);
  // { event: 'int', data: { msg: 'OK', num: 0, count: 1 } }
});
```

numは割込番号、countは割込発生回数です。
割込発生回数はイベントが通知されるごとにリセット(0に戻る)されます。

また、Streamイベントも同様のイベントに通知されるので、Streamイベントと併用する場合は以下のように条件分岐する必要があります.

```js
arduinode.on("event", function(data){
  switch(data.event){
    case "di":
      console.log(data.data);
      break;
    case "ai":
      console.log(data.data);
      break;
    case "int":
      // Interrupt event !!
      console.log(data.data);
      break;
  }
});
```

このイベントの仕様は実験的であり、今後変更される場合があります。

*/


/***

## 外部割込み有効 <a name="attachInterrupt">

指定した番号の外部割込みを有効にする.

### 関数

```js
attachInterrupt(num, mode, callback);
```

### 引数

[num]
:割込番号(0 or 1).
Arduino Megaの場合は0, 1, 2, 3, 4 or 5


[mode]
:割込を発生させるトリガ文字列

* "LOW" ピンがLOWのとき発生
* "CHANGE" ピンの状態が変化したときに発生
* "RISING" ピンの状態がLOWからHIGHに変わったときに発生
* "FALLING" ピンの状態がHIGHからLOWに変わったときに発生


### Sample code

```js
arduinode.attachInterrupt(0, "CHANGE", function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', num: 0, mode: 'CHANGE' }
});

arduinode.on("event", function(data){
  console.log(data);
  // { event: 'int', data: { msg: 'OK', num: 0, count: 1 } }
  // num is interrupt number.
  // count is the interrupt number of occurrences
});
```

### 対応するArduinoの操作

```c
attachInterrupt(port, function, mode);
```

### 安定度

実験的

 */

Arduinode.prototype.attachInterrupt = function(num, mode, callback) {

  callback = makeCallback(callback);

  if(typeof mode !== "string"){
    return callback(new TypeError("mode must be a string"));
  }

  if(typeof num !== "number"){
    return callback(new TypeError("num must be a number"));
  }

  var self = this;
  self._send("d/int/on/" + num + "?type=" + mode, callback);
}


/***

## 外部割込み無効 <a name="detachInterrupt">

指定した番号の外部割込みを無効にする.

### 関数

```js
detachInterrupt(num, callback);
```

### 引数

[num]
:割込番号(0 or 1).
Arduino Megaの場合は0, 1, 2, 3, 4 or 5

### Sample code

```js
arduinode.detachInterrupt(0, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log(result);
  // { msg: 'OK', num: 0 }
});
```

### 安定度

実験的

 */
Arduinode.prototype.detachInterrupt = function(num, callback) {

  callback = makeCallback(callback);

  if(typeof num !== "number"){
    return callback(new TypeError("num must be a number"));
  }

  var self = this;
  self._send("d/int/off/" + num, callback);
}

/***

# Arduinoそのものに関する操作 <a name="system">

*/

/***

## シリアル切断 <a name="close">

Arduinoを強制的にリセットすることでシリアルポート接続を切断する。

このAPIを使って切断してから出ないとnode.jsを終了できない。

### リクエスト(node.js -> Arduino)

```txt
system/reset
```

### レスポンス(node.js <- Arduino)

無し

### Sample code

```js
arduinode.close(function(){
    console.log("closed");
});
```

### 対応するArduinoの操作

無し.

Arduino内でスタックオーバーフローを発生させることで強制的にリセットを行なっている。

ArduinoはDTR信号を制御することでリセット可能だが、node-serialportでDTR信号を制御する方法が不明なので、現段階ではこの方法を取る。

*/
Arduinode.prototype.close = function(callback) {
  var self = this;
  var sendCmd = "system/reset\n";
  self._write("system/reset", function(){
    self.sp.close();
    callback();
  });
}

// TODO: 後でUtility関数としてドキュメントを書く
Arduinode.prototype.list = function(callback) {
  require("serialport").list(callback);
}


/*
 * 非公開
*/
Arduinode.prototype._write = function(cmd, callback){
  var self = this;
  var sendCmd = cmd.replace(/\n$/, "") + "\n";
  self.sp.write(sendCmd, function(err, writeBytes){
    if(err) throw err;

    if(writeBytes != sendCmd.length){
      var error = new Error();
      error.name = "Send error.";
      error.message = "Write bytes mismatch."
      throw error;
    }
    if(callback){
      callback();
    }
  });
}


/*
 * この関数は引数がチェック済みの状態で呼ばれる.
 * (但しコマンドの文字列数のチェックはここで行う.
 */
Arduinode.prototype._send = function(command, callback){
  var self = this;

  if(command.length >= 100){
    // Arduinoのバッファがあふれるようなサイズのコマンドは
    // 送信せずにエラーを発生させる。
    // Arduinoの受信バッファサイズは128byteであるが、100に制限する.
    var error = new Error();
    error.name = "Command error.";
    error.message = "Command is too long.";
    process.nextTick(function(){
      callback(error);
    });
    return;
  }

  if(self.callback){
    // 別のコマンド実行中に更にコマンドを実行しようとした場合はエラー
    // 連続してコマンドを送信するとArduinoの受信バッファが溢れて死ぬため.
    // このエラーの発生原因はユーザプログラムではなくモジュールのバグなので
    // 通常発生することはない.
    // 発生した場合は報告して下さい.


    // コマンドA -> コマンドBと実行した場合、コマンドAの完了を待たずに
    // コマンドBでErrorのコールバックを呼んでしまうと、更に次のコマンドを
    // 実行するときにコマンドAの完了するタイミングを知ることが出来なくなってしまうので
    // コマンドAの実行が終わったタイミングでコマンドBにErrorでコールバックを呼ぶ.
    // バグに対するバグ回避策なので通常は気にしなくて良い.
    var timer = setInterval(function(){
      if(!self.callback){
        clearInterval(timer);
        var error = new Error();
        error.name = "IllegalApiCallError";
        error.message = "Please call after waiting the end of the API that called earlier.";
        callback(error);
      }
    }, 10);
    return;
  }

  self.callback = callback;
  // 送信済みコールバックは指定しない.
  self._write(command,null);
}

Arduinode.prototype._execCallback = function(err, result){
  var self = this;
  if(self.callback){
    var callback = self.callback;
    self.callback = null;
    process.nextTick(function(){
      callback(err, result);
    });
  }else{
    throw Error("callback is " + self.callback);
  }
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
