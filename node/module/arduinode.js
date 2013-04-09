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

function Arduinode(path, callback){
  var self = this;
  self.sp = new SerialPort(path, options);
  self.buf = [];
  self.callback = [];
  self.error = null;

  self.once("ready", callback);

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
          self.emit("ready");
        }else{
          var result = JSON.parse(received);
          // eventってデータが含まれてたらemit
          if(result.event){
            self.emit("event", result);
          }else{
            var cb = self.callback.shift();
            if(typeof(cb) == "function"){
              if(result.msg == "NG"){
                var error = new Error();
                error.name = "Command error.";
                error.message = result.error;
                cb(error, result);
              }else{
                cb(self.error, JSON.parse(received));
              }
              self.errro = null;
            }
          }
        }
        self.buf = [];
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
Arduinode.prototype.send = function(cmd, callback) {
  var self = this;
  if(cmd.length < 100){
    self.callback.push(callback);
    self._write(cmd,null);
  }else{
    // Arduinoのバッファがあふれるようなサイズのコマンドは
    // 送信せずにエラーを発生させる。
    // Arduinoの受信バッファサイズは128byteであるが、100に制限する.
    var error = new Error();
    error.name = "Command error.";
    error.message = "Command is too long.";
    callback(error, null);
  }
}

/***


# はじめに

## APIの安定度

各APIには以下の3段階の安定度があります。現段階では、この安定度の段階すら変更される可能性があります。

1. 実験的
:実験的なAPIです。将来大きく仕様が変更される可能性があります

2. 不安定
:まだ十分にテストされていません。しかし、大きな仕様変更はありません。

3. 安定
:十分にテストされた安定したAPIです。仕様が変更されることはまずありません。

*/


/*
 * High level API
 */

/***

# Analogポートに関する操作 <a name="analog">

*/

/***

## AD値読み込み <a name="analogRead">

指定したポートのAD値を読み込む。

### リクエスト(node.js -> Arduino)

```txt
ai/read/[port]
```

[port]
:ポート番号

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK","port":[port],"val":[val]}
```

[port]
:リクエストで指定した[port]番号

[val]
:読み取られたAD値

### Sample code

```js
// High level API
arduinode.analogRead(0, function(err, reuslt){
if(err) throw err;
console.log(result);
});

// Low level API
arduinode.send("ai/read/0", function(err, result){
if(err) throw err;
console.log(result);
});
```

### 対応するArduinoの操作

```c
analogRead([port]);
```

*/
Arduinode.prototype.analogRead = function(port, callback) {
  var self = this;
  self.send("ai/read/" + port, callback);
}

/***

## アナログ値(PWM)出力 <a name="analogWrite">

指定したポートからアナログ値を出力します。

### リクエスト(node.js -> Arduino)

```txt
ao/write/[port]?val=[val]

```
[port]
:ポート番号

[val]
:出力値(0 - 255)


### レスポンス(node.js <- Arduino)

```js
{"msg":"OK","port":[port],"val":[val]}
```

### Sample code

```js
// Low level API
arduinode.send("ao/write/0?val=25", function(err, result){
    if(err) throw err;
    console.log(result);
});

// High level API
arduinode.analogWrite(1, 100, function(err, result){
    if(err) throw err;
    console.log(result);
});
```

### 対応するArduinoの操作

```c
analogWrite([port], [val]);
```

*/
Arduinode.prototype.analogWrite = function(port, val, callback) {
  var self = this;
  self.send("ao/write/" + port + "?val=" + val, callback);
}

/***

## Analog入力基準電圧変更 <a name="analogReference">

AD値読み込みに使用される基準電圧源を変更します。

### リクエスト(node.js -> Arduino)

```txt
ai/ref?type=[type]
```

[type]
:DEFAULT、INTERNAL、EXTERNALのいずれか

DEFAULT
:電源電圧5Vが基準電圧になります

INTERNAL
:内部基準電圧が基準電圧になります。通常1.1Vです

EXTERNAL
:AREFピンに供給される電圧が基準電圧になります。

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK","type":[type]}
```

### Sample code

```js
// Low level API
arduinode.send("ai/ref?type=INTERNAL", function(err, result){
    if(err) throw err;
    console.log(result);
);

// High level API
arduinode.analogReference("INTERNAL", function(err, result){
    if(err) throw err;
    console.log(result);
});
```

### 対応するArduinoの操作

```
analogReference([type]);
```

*/
Arduinode.prototype.analogReference = function(type, callback) {
  var self = this;
  self.send("ai/ref?type" + type, callback);
}

/***

# Digitalポートに関する操作 <a name="digital">

*/


/***

## ポート値読み込み <a name="digitalRead">

指定したポートの値(0 or 1)を読み込みます。

### リクエスト(node.js -> Arduino)

```txt
di/read/{port}
```

[port]
:ポート番号

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK","port":[port],"val":[val]}
```

[port]
:リクエストで指定したポート番号

[val]
:読み込まれたポートの値(0 or 1)

### Sample code

```js
// Low level API
arduinode.send("di/read/0", function(err, result){
    if(err) throw err;
    console.log(result);
);

// High level API
arduinode.digitalRead(0, function(err, result){
    if(err) throw err;
    console.log(result);
});
```

### 対応するArduinoの操作

```c
digitalRead([port]);
```

*/
Arduinode.prototype.digitalRead = function(port, callback) {
  var self = this;
  self.send("di/read/" + port, callback);
}


/***

## ポート出力 <a name="digitalWrite">

指定したポートに値を書き込みます。

### リクエスト(node.js -> Arduino)

```txt
do/write/[port]?val=[val]
```

[port]
:ポート番号

[val]
:出力する値。0, 1, LOW, HIGHのいずれか

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK","port":[port],"val":[val]}
```

[port]
:リクエストで指定したポート番号

[val]
:リクエストで指定した値(0 or 1)

### Sample code

```js
// Low level API
arduinode.send("do/write/0?val=1", function(err, result){
    if(err) throw err;
    console.log(result);
);

// High level API
arduinode.digitalWrite(0, 0,function(err, result){
    if(err) throw err;
    console.log(result);
});
```

### 対応するArduinoの操作

```c
digitalWrite([port], [val]);
```

*/
Arduinode.prototype.digitalWrite = function(port, val, callback) {
  var self = this;
  self.send("do/write/" + port + "?val=" + val, callback);
}


/***

## ピンモード変更 <a name="pinMode">

指定したポートのピンモードを変更します。

### リクエスト(node.js -> Arduino)

```txt
d/mode/[port]?type=[type]
```

[port]
:ポート番号

[type]
:INPUT、OUTPUT、INPUT_PULLUPのいずれか

INPUT
:入力ポートに設定する。内蔵プルアップ無効

INPUT_PULLUP
:入力ポートに設定する。内蔵プルアップ有効

OUTPUT
:出力ポートに設定する

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK","type":[type]}
```

### Sample code

```js
// Low level API
arduinode.send("d/mode/0?type=INPUT", function(err, result){
    if(err) throw err;
    console.log(result);
);

// High level API
arduinode.pinMode(0, "INPUT", function(err, result){
    if(err) throw err;
    console.log(result);
});
```

### 対応するArduinoの操作

```c
pinMode([port], [type);
```

*/
Arduinode.prototype.pinMode = function(port, type, callback) {
  var self = this;
  self.send("d/mode/" + port + "?type=" + type, callback);
}


/***
## DI連続転送ON <a name="digitalStreamOn">

TODO: 各APIに安定度を記載する.
http://nodejs.jp/nodejs.org_ja/docs/v0.10/api/documentation.html

指定したポートの連続転送を有効にします.

### リクエスト(node.js -> Arduino)

```txt
stream/di/on/[port]
```

[port]
:ポート番号

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK", "port":[port], "val":1}
```

### Sample code

```js
// Low level API
arduinode.send("stream/di/on/0", function(err, result){
  if(err) throw err;
  console.log(result);
});

// High level API
arduinode.digitalStreamOn(0, function(err, result){
  if(err) throw err;
  console.log(result);
  // {"msg":"OK", "port":0, "val":1}
});

// data event. (experimental)
arduinode.on("event", function(datas){
  console.log(datas);
});
```
*/
Arduinode.prototype.digitalStreamOn = function(port, callback) {
  var self = this;
  self.send("stream/di/on/" + port, callback);
}


/***
## DI連続転送OFF <a name="digitalStreamOff">

指定したポートの連続転送を無効にします.

### リクエスト(node.js -> Arduino)

```txt
stream/di/off/[port]
```

[port]
:ポート番号
([port]にallを指定すると全てのポートを一括して無効にできる.


### レスポンス(node.js <- Arduino)

```js
{"msg":"OK", "port":[port], "val":0}
```

### Sample code

```js
// Low level API
arduinode.send("stream/di/off/0", function(err, result){
  if(err) throw err;
  console.log(result);
});

// High level API
arduinode.digitalStreamOff(0, function(err, result){
  if(err) throw err;
  console.log(result);
  // {"msg":"OK", "port":0, "val":0}
});

// data event. (experimental)
arduinode.on("event", function(datas){
  console.log(datas);
});
```
*/
Arduinode.prototype.digitalStreamOff = function(port, callback) {
  var self = this;
  self.send("stream/di/off/" + port, callback);
}

/***
## AI連続転送ON <a name="analogStreamOn">

TODO: 各APIに安定度を記載する.
http://nodejs.jp/nodejs.org_ja/docs/v0.10/api/documentation.html

指定したポートの連続転送を有効にします.

### リクエスト(node.js -> Arduino)

```txt
stream/ai/on/[port]
```

[port]
:ポート番号

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK", "port":[port], "val":1}
```

### Sample code

```js
// Low level API
arduinode.send("stream/ai/on/0", function(err, result){
  if(err) throw err;
  console.log(result);
});

// High level API
arduinode.analogStreamOn(0, function(err, result){
  if(err) throw err;
  console.log(result);
  // {"msg":"OK", "port":0, "val":1}
});

// data event. (experimental)
arduinode.on("event", function(datas){
  console.log(datas);
});
```
*/
Arduinode.prototype.analogStreamOn = function(port, callback) {
  var self = this;
  self.send("stream/ai/" + port, callback);
}

/***
## DI連続転送OFF <a name="analogStreamOff">

指定したポートの連続転送を無効にします.

### リクエスト(node.js -> Arduino)

```txt
stream/ai/off/[port]
```

[port]
:ポート番号
([port]にallを指定すると全てのポートを一括して無効にできる.


### レスポンス(node.js <- Arduino)

```js
{"msg":"OK", "port":[port], "val":0}
```

### Sample code

```js
// Low level API
arduinode.send("stream/ai/off/0", function(err, result){
  if(err) throw err;
  console.log(result);
});

// High level API
arduinode.analogStreamOff(0, function(err, result){
  if(err) throw err;
  console.log(result);
  // {"msg":"OK", "port":0, "val":0}
});

// data event. (experimental)
arduinode.on("event", function(datas){
  console.log(datas);
});
```
*/
Arduinode.prototype.analogStreamOff = function(port, callback) {
  var self = this;
  self.send("stream/ai/off/" + port, callback);
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
