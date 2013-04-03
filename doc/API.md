# 目次
* [Analogポートに関する操作](Analogポートに関する操作)
    * [AD値読み込み](AD値読み込み)
    * [アナログ値(PWM)出力](アナログ値(PWM)出力)
    * [Analog入力基準電圧変更](Analog入力基準電圧変更)
* [Digitalポートに関する操作](Digitalポートに関する操作)
    * [ポート値読み込み](ポート値読み込み)
    * [ポート出力](ポート出力)
    * [ピンモード変更](ピンモード変更)

# Analogポートに関する操作


## AD値読み込み

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


## アナログ値(PWM)出力

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


## Analog入力基準電圧変更

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


# Digitalポートに関する操作


## ポート値読み込み

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


## ポート出力

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


## ピンモード変更

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

