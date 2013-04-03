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

  self.on("ready", callback);

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
          var cb = self.callback.shift();
          if(typeof(cb) == "function"){
            var result = JSON.parse(received);
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
  var sendCmd = cmd.replace(/\n$/, "") + "\n";
  if(sendCmd.length < 100){
    self.callback.push(callback);
    self.sp.write(sendCmd, function(err, writeBytes){
      if(err) throw err;

      if(writeBytes != sendCmd.length){
        var error = new Error();
        error.name = "Send error.";
        error.message = "Write bytes mismatch."
        throw error;
      }
    });
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

/*
 * High level API
 */

/***

# Analogポートに関する操作 {#analog}

*/

/***

## AD値読み込み {#analogRead}

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

## アナログ値(PWM)出力 {#analogWrite}

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

## Analog入力基準電圧変更 {#analogReference}

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

# Digitalポートに関する操作 {#digital}

*/


/***

## ポート値読み込み {#analogRead}

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

## ポート出力 {#digitalWrite}

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

## ピンモード変更 {#pinMode}

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
