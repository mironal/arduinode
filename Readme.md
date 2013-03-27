# これは何？

node.jsからArduinoを操作するニクい奴。

# 問題提起

node.jsとArduinoをシリアル通信で接続しハックする例が増えてきた。

しかし、Arduinoのプログラミング作業はnodeのそれと比較して非常にダルい。

なぜなら"プログラミング -> コンパイル -> 書き込み"という作業を繰り返さなければいけないからだ。

これはnode.js(javascript)でのプログラミングと比較して非常に手間が掛かり、開発のリズムを崩すことに繋がる。


# 問題の解決方法

以下の2つの方法により、Arduino側のプログラミングを不要にし、node.jsのみで開発を可能にする。

1. Arduinoにnode.jsから制御可能な機能を持つ汎用的なプログラムを書き込む
2. Arduino側の制御を全てnode.js側から行い、Arduinoのプログラムの変更を不要にする

## 前提条件

通常、Arduino側のプログラムは複雑なロジックは含まず、センサーの値を取得したり、モータの制御値を出力するだけの場合が多い。

つまりArduinoは各種センサ・アクチュエータのインターフェースとしての役割と割り切ることが出来る。

この割り切りにより、node.js側からArduino側のAI(Analog Input)、AO(Analog Output)、DI(Digital Input)、DO(Digital Output)の操作を行うだけでアプリケーションの記述を可能にする。

# どのように操作が出来るのか？

Arduinoはプログラミング済みとする。

node.jsから以下のようにアクセスし、Arduinoの制御を行うことが出来る。

```js
// AI0の値の読み込み
serial.sendCommand("ai/read/0", function(err, result){
    if(err) throw err;
    console.log("AI0 : " + result);
    // AI0 : {"msg":"OK", "port":0,  "val":200}
});
```

```js
// AO1に値の書き込み
serial.sendCommand("ao/write/1?val=30", function(err, reuslt){
    if(err) throw err;
    console.log("AO1 : " + result);
    // AO1 : {"msg":"OK", "port":2, "val":30}
});
```

```js
// AIリファレンス電圧の変更
serial.sendCommand("ai/ref?type=INTERNAL", function(err, reuslt){
    if(err) throw err;
    console.log("AI REF : " + result);
    // AI REF : {"msg":"OK", "type":"INTERNAL"A}
});
```

```js
// DI2の値の読み込み
serial.sendCommand("di/read/2", function(err, reuslt){
    if(err) throw err;
    console.log("DI0 : " + result);
    // DI2 : {"msg":"OK", "port":0, "val":1}
});
```

