# これは何？、 What's this?

node.jsからArduinoを操作するニクい奴。

Nice guy that you can manipulate the Arduino from node.js.

Arduinoのプログラミングを不要にし、node.jsだけでアプリケーションが作れます。

No programming of Arduino. application can make only node.js.


# 使い方

## GeneralIoSerial.ino

ソースコードを入手し、お手持ちのarduinoに書き込むだけで準備完了です。

### ソースコードの入手.

```sh
git clone https://github.com/mironal/Node-Arduino-General-IO.git
```

### コンパイル & 書き込み

"Node-Arduino-General-IO/arduino/GeneralIoSerial"の中にある"GeneralIoSerial.ino"をArduinoの開発環境で開き、Arduinoに書き込む.

これだけです。


## arduinode

npm(node package manager)を使って簡単にインストール出来ます。

arduinodeのインストール。

Install arduinode module.

```sh
npm install arduinode
```
### ドキュメント

**[API document を見る！](doc/API.md)**


### Example code

```js
var Arduinode = require("arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

arduinode = new Arduinode(portName, function(){
    console.log("open");
    arduinode.analogRead(0, function(err, result){
      console.log(result);
    });
});

```

### Example application

**[Come here!](example/Readme.md)**


# どのように操作が出来るのか？

Arduinoはプログラミング済みとする。

node.jsから以下のようにアクセスし、Arduinoの制御を行うことが出来る。

```js
var Arduinode = require("arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

// Arduinoと接続
var arduinode = new Arduinode(portName, function(){
    console.log("ready");
});
```


```js
// AI0の値の読み込み
arduinode.analogRead(0, function(err, result){
    if(err) throw err;
    console.log("AI0 : " + result);
    // AI0 : {"msg":"OK", "port":0,  "val":200}
});
```

```js
// AO1に値の書き込み
arduinode.analogWrite(1, 25, function(err, result){
    if(err) throw err;
    console.log("AO1 : " + result);
    // AO1 : {"msg":"OK", "port":1, "val":25}
});
```

```js
// AIリファレンス電圧の変更
arduinode.analogReference("INTERNAL", function(err, result){
    if(err) throw err;
    console.log("AI REF : " + result);
    // AI REF : {"msg":"OK", "type":"INTERNAL"}
});
```

```js
// DI2の値の読み込み
arduinode.digitalRead(2, function(err, result){
    if(err) throw err;
    console.log("DI2 : " + result);
    // DI2 : {"msg":"OK", "port":2, "val":1}
});
```

# 哲学、Philosophy


## 問題提起、 Problem presentation

node.jsとArduinoをシリアル通信で接続しハックする例が増えてきた。

しかし、Arduinoのプログラミング作業はnodeのそれと比較して非常にダルい。

なぜなら"プログラミング -> コンパイル -> 書き込み"という作業を繰り返さなければいけないからだ。

これはnode.js(javascript)でのプログラミングと比較して非常に手間が掛かり、開発のリズムを崩すことに繋がる。


Example of serial communication to connect the Arduino hack node.js and has increased.

However, the programming work of Arduino is very wearier than that of node.

This is because you must repeat work called "programming - compilation - write to the Arduino".

This takes effort than programming in node.js(javascript) very and leads to breaking rhythm of the development.

## 問題の解決方法

以下の2つの方法により、Arduino側の再プログラミングを不要にし、デバッグの容易なnode.jsのみで開発を可能にする。

1. Arduinoは各種センサへのインターフェースに徹する
2. node.jsでArduinoの制御を行い、Arduinoのプログラム変更を不要にする

By two following methods,  I dispense with re-programming of the Arduino side and enable development only in easy node.js of the debugging.

1. Arduino is devoted to interface to various sensors
2. control the Arduino with node.js, eliminating the need for program changes Arduino.

### 前提条件、Prerequisite

上記問題の解決方法は以下の考えに基づく。

1. Arduinoのプログラムは、センサー値の取得や、アクチュエータの制御をするだけである
2. node.jsから見てArduinoは各種センサ・アクチュエータへのインターフェースとみなせる

よってArduinoに複雑なロジックを持つプログラムを記述する必要は無くなり以下の利点が発生する。

1. Arduinoのプログラムの変更が不要
2. node.jsのみで快適な開発が可能

これらは先に述べた問題を全て解決することが出来る。


How to resolve the above problem is based on the following idea.

1. Arduino program is just getting the value and the sensor, the control of actuator.
2. Arduino can be regarded as an interface to various sensors and actuators as seen from node.js.

Therefore, it is not necessary to describe a program with a complicated logic in Arduino , and the following advantages occur.


1. No need to change the program of the Arduino.
2. Comfortable development is possible in Node.js.

They will be able to solve all the problems mentioned above.



# 開発上の注意

このプロジェクトの基本的な方針.

## Arduino

1. Arduino標準ライブラリにのみ依存
2. 一つのソースコードのみで完結

慣れてる人は良いが、慣れていない人だとライブラリを集めてコンパイルして実行する前に萎えてしまう。
ユーザが指定されたソースコードをコンパイルしてアップロードするだけで開始できるようにする。

## node.js

1. 特に無い
2. 頑張る

※後から変更されることもある。ゆるいきまり。


# TODO

* Arduino側の機能追加

# Sorry

My english is poor.

正しいイングリッシュへの修正案はいつでもうぇるかむです。

