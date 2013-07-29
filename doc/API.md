# 目次
* [API Stability](#stability)
* [Constructor](#Constructor)
* [Analog I/O](#analog)
    * [Analog Read : analogRead](#analogRead)
    * [Analog Write (PWM) : analogWrite](#analogWrite)
    * [Analog Reference : analogReference](#analogReference)
* [Digital I/O](#digital)
    * [Digital Read : digitalRead](#digitalRead)
    * [Digital Write : digitalWrite](#digitalWrite)
    * [Pin mode change  : pinMode](#pinMode)
* [Stream(連続転送) API](#stream)
    * [DI連続転送ON : digitalStreamOn](#digitalStreamOn)
    * [DI連続転送OFF : digitalStreamOff](#digitalStreamOff)
    * [AI連続転送ON : analogStreamOn](#analogStreamOn)
    * [AI連続転送OFF : analogStreamOff](#analogStreamOff)
* [Interrupt(外部割込)に関する操作](#interrupt)
    * [外部割込み有効 : attachInterrupt](#attachInterrupt)
    * [外部割込み無効 : detachInterrupt](#detachInterrupt)
* [Arduinoそのものに関する操作](#system)
    * [シリアル切断 : close](#close)

# API Stability <a name="stability"></a>

各APIには以下の3段階の安定度があります。現段階では、この安定度の段階すら変更される可能性があります。

1. Experimental
:実験的なAPIです。将来大きく仕様が変更される可能性があります

2. Stable
:まだ十分にテストされていません。しかし、大きな仕様変更はありません。

3. Locked
:十分にテストされた安定したAPIです。仕様が変更されることはまずありません。


# Constructor <a name="Constructor"></a>

### Sample code

```js
var Arduinode = require("arduinode").Arduinode;

// How to find the serial port?
// ls /dev | grep usb
var portname = "Your serial port name";

var arduinode = new Arduinode(portname, function(err, result){
  if(err) throw err;
  console.log(result);
});
```


# Analog I/O <a name="analog"></a>


## Analog Read <a name="analogRead"></a>

Read the AD value of the specified port.

### function

```js
analogRead(port, callback);
```

### Argument(s)

[port]
:Port number

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

### Arduino function of the corresponding

```c
analogRead(port);
```

### Stability

Stable


## Analog Write (PWM) <a name="analogWrite"></a>

Output the analog value from the specified port.

### function

```js
analogWrite(port, value, callback);
```

### Argument(s)

[port]
:Port number

[value]
:Output Value


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

### Arduino function of the corresponding

```c
analogWrite(port, value);
```

### Stability

Stable


## Analog Reference <a name="analogReference"></a>

Change the Analog reference voltage.

### function

```js
analogReference(type, callback);
```

### argument(s)

[type]
:Reference voltage type.

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

### Arduino function of the corresponding

```c
analogReference(type);
```

### Stability

Stable


# Digital I/O <a name="digital"></a>


## Digital Read <a name="digitalRead"></a>

Read the digital value of the specified port.

### function

```js
digitalRead(port, callback);
```

### argument(s)

[port]
:Port number

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

### Arduino function of the corresponding

```c
digitalRead(port);
```

### Stability

Stable


## Digital Write <a name="digitalWrite"></a>

Output the digital value from the specified port.

### function

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

### argument(s)

[port]
:Port number

[value]
:Output Value(0 , 1 or "HIGH", "LOW").


### Arduino function of the corresponding

```c
digitalWrite(port, value);
```

### Stability

Stable


## Pin mode change  <a name="pinMode"></a>

Change pin mode for the specified port.


### function

```js
pinMode(port, mode, callback);
```

### argument(s)

[port]
:Port number

[mode]
:Pin mode. "INPUT", "INPUT_PULLUP" or "OUTPUT"


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

### Arduino function of the corresponding

```c
pinMode(port, mode);
```

### Stability

Stable


# Stream(連続転送) API <a name="stream"></a>

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

## DI連続転送ON <a name="digitalStreamOn"></a>

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


## DI連続転送OFF <a name="digitalStreamOff"></a>

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

## AI連続転送ON <a name="analogStreamOn"></a>

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

## AI連続転送OFF <a name="analogStreamOff"></a>

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


# Interrupt(外部割込)に関する操作 <a name="interrupt"></a>

特定のポートの状態が変化したことをイベントとして通知することが出来ます。

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

割込のイベントは"event"というイベントに通知され以下のコードで取得することが可能です.

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


## 外部割込み有効 <a name="attachInterrupt"></a>

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


## 外部割込み無効 <a name="detachInterrupt"></a>

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


# Arduinoそのものに関する操作 <a name="system"></a>


## シリアル切断 <a name="close"></a>

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

