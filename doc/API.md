# 目次
* [コンストラクタ](#Arduinode)
* [Analogポートに関する操作](#analog)
    * [AD値読み込み : analogRead](#analogRead)
    * [アナログ値(PWM)出力 : analogWrite](#analogWrite)
    * [Analog入力基準電圧変更 : analogReference](#analogReference)
* [Digitalポートに関する操作](#digital)
    * [ポート値読み込み : digitalRead](#digitalRead)
    * [ポート出力 : digitalWrite](#digitalWrite)
    * [ピンモード変更 : pinMode](#pinMode)
* [Stream(連続転送) API](#stream)
    * [DI連続転送ON : digitalStreamOn](#digitalStreamOn)
    * [DI連続転送OFF : digitalStreamOff](#digitalStreamOff)
    * [AI連続転送ON : analogStreamOn](#analogStreamOn)
    * [AI連続転送OFF : analogStreamOff](#analogStreamOff)
* [Arduinoそのものに関する操作](#system)
    * [シリアル切断 : close](#close)


# はじめに

## APIの安定度

各APIには以下の3段階の安定度があります。現段階では、この安定度の段階すら変更される可能性があります。

1. 実験的
:実験的なAPIです。将来大きく仕様が変更される可能性があります

2. 安定
:まだ十分にテストされていません。しかし、大きな仕様変更はありません。

3.固定
:十分にテストされた安定したAPIです。仕様が変更されることはまずありません。


## API使用上の注意

同時に複数のコマンドを送信すると正しく通信ができなくなります。

これはArduinoのシリアル受信バッファサイズが小さいため、同時に複数のコマンドを送信すると受信バッファが溢れ、送信したコマンドの文字列が破壊されるためです。

例えば以下の様なコードを実行すると容易にArduinoの受信バッファが溢れ、正常にコマンドを解釈できなくなります。

```js
for(var i = 0; i < 10; i++){
  arduinode.digitalRead(i, function(err, result){
    if(err) throw err; // 高い確率でエラーが発生します。
    console.log(result);
  });
}
```

この問題を回避するために、以下の例のようにコールバック関数内で次のコマンドをArduinoに送信して下さい。

```js
arduinode.digitalRead(0, function(err, result){
  if(err) throw err;
  console.log(result);
  arduinode.digitalRead(1, function(err, result){
    if(err) throw err;
    console.log(result);
  });
});
```

但しこのように記述するのはあまりにも大変です。

そこでasyncモジュールを使うことで簡単に記述する方法を紹介します。

```hs
npm install async
```

してasyncモジュールを取得して下さい。

以下にforを使ったコード例を書き換える完全なコードを掲載します。

```js
"use strict";
var async = require("async");
var Arduinode = require("arduinode").Arduinode;

// Your serial port name.
var portname = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portname, function(err, result){
  var i = 0;
  async.whilst(
    // この関数が条件を満たすまで
    function(){ return i < 10;},

    // この関数を実行し続ける(errが発生したらその時点で終了).
    function(callback){
      arduinode.digitalRead(i, function(err, result){
        console.log(result);
        i++;
        callback(err);
      });
    },

    // 最後に１回呼ばれる.
    function(err){
      if(err){
        console.log(err);
      }
      arduinode.close(function(){
        console.log("exit");
      });
    });
});
```

また、各結果に名前を付けて以下のように書くことも出来ます。こちらのほうがオススメです。

```js
var arduinode = new Arduinode(portname, function(err, result){
  var tasks = {
    ai0: function(callback){
      arduinode.analogRead(0, callback);
    },
    ai1: function(callback){
      arduinode.analogRead(1, callback);
    },
    ai2: function(callback){
      arduinode.analogRead(1, callback);
    }
  };

  async.series(tasks, function(err, results){
    if(err){
      console.log(err);
    }
    console.log(results.ai0);
    console.log(results.ai1);
    console.log(results.ai2);

    arduinode.close(function(){
      console.log("exit");
    });

  });
});
```


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


# Analogポートに関する操作 <a name="analog">


## AD値読み込み <a name="analogRead">

指定したポートのAD値を読み込む。

### API

```js
analogRead(port, callback);
```

### Sample code

```js
var port = 0;
arduinode.analogRead(port, function(err, reuslt){
  if(err) throw err;
  console.log(result);
});
```

### 対応するArduinoの操作

```c
analogRead(port);
```

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

### 安定度

安定


## アナログ値(PWM)出力 <a name="analogWrite">

指定したポートからアナログ値を出力します。

### API

```js
analogWrite(port, value, callback);
```

### Sample code

```js
var port = 1;
var value = 100;
arduinode.analogWrite(port, value, function(err, result){
  if(err) throw err;
  console.log(result);
});
```
### 対応するArduinoの操作

```c
analogWrite([port], [val]);
```

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

### 安定度

安定


## Analog入力基準電圧変更 <a name="analogReference">

AD値読み込みに使用される基準電圧源を変更します。

# API
```js
analogReference(type, callback);
```

### Sample code

```js
var type = "INTERNAL"; // "INTERNAL" or "EXTERNAL" or "DEFAULT"
arduinode.analogReference(type, function(err, result){
  if(err) throw err;
  console.log(result);
});
```

### 対応するArduinoの操作

```
analogReference([type]);
```

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
### 安定度

安定


# Digitalポートに関する操作 <a name="digital">


## ポート値読み込み <a name="digitalRead">

指定したポートの値(0 or 1)を読み込みます。

### API

```js
digitalRead(port, callback);
```

### Sample code
var port = 0;
arduinode.digitalRead(port, function(err, result){
  if(err) throw err;
  console.log(result);
});
```

### 対応するArduinoの操作

```c
digitalRead([port]);
```

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

### 安定度

安定


## ポート出力 <a name="digitalWrite">

指定したポートに値を書き込みます。

### API

```js
digitalWrite(port, value, callback);
```

### Sample code

```js
var port = 0;
var value = 1; // 0 or 1 or "HIGH" or "LOW"
arduinode.digitalWrite(port, value,function(err, result){
  if(err) throw err;
  console.log(result);
});
```

### 対応するArduinoの操作

```c
digitalWrite([port], [val]);

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

```

### 安定度

安定



## ピンモード変更 <a name="pinMode">

指定したポートのピンモードを変更します。

### API

```js
pinMode(port, mode, callback);
```

### Sample code

```js
var port = 0;
var mode = "INPUT"; // "INPUT" or "INPUT_PULLUP" or "OUTPUT"
arduinode.pinMode(port, mode, function(err, result){
  if(err) throw err;
  console.log(result);
});
```

### 対応するArduinoの操作

```c
pinMode([port], [mode]);
```

### リクエスト(node.js -> Arduino)

```txt
d/mode/[port]?type=[mode]
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
{"msg":"OK","type":[mode]}
```

### 安定度

安定


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

## DI連続転送ON <a name="digitalStreamOn">

指定したポートの連続転送を有効にします.

### API

```js
digitalStreamOn(port, interval, callback);
```

### Sample code

```js
var port = 0;
var interval = 500; // 500[ms]
arduinode.digitalStreamOn(port, interval, function(err, result){
  if(err) throw err;
  console.log(result);
  // {"msg":"OK", "port":0, "val":1}
});

// data event. (experimental)
arduinode.on("event", function(data){
  console.log(data);
});
```

### リクエスト(node.js -> Arduino)

```txt
stream/di/on/[port]?interval=[interval]
```

[port]
:ポート番号

[interval]
:転送間隔

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK", "port":[port], "val":1}
```

### 安定度

実験的


## DI連続転送OFF <a name="digitalStreamOff">

指定したポートの連続転送を無効にします.

### API

```js
digitalStreamOff(port, callback);
```

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
var port = 0;
arduinode.digitalStreamOff(port, function(err, result){
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

## AI連続転送ON <a name="analogStreamOn">

指定したポートの連続転送を有効にします.

### API

```js
analogStreamOn(port, interval, callback);
```

### リクエスト(node.js -> Arduino)

```txt
stream/ai/on/[port]?interval=[interval]
```

[port]
:ポート番号

[interval]
:転送間隔

### レスポンス(node.js <- Arduino)

```js
{"msg":"OK", "port":[port], "val":1}
```

### Sample code

```js
var port = 0;
var interval = 1000; // 1000[ms] = 1[s]
arduinode.analogStreamOn(port, interval, function(err, result){
  if(err) throw err;
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

## AI連続転送OFF <a name="analogStreamOff">

指定したポートの連続転送を無効にします.

### API

```js
analogStreamOff(port, callback);
```

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

### 安定度

実験的


# Arduinoそのものに関する操作 <a name="system">


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

