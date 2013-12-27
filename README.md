# What's this? : これは何?

node.jsからArduinoを操作するニクい奴。

Nice guy that you can manipulate the Arduino from node.js.

Arduinoのプログラミングを不要にし、node.jsだけでアプリケーションが作れます。

No programming of Arduino. application can make only node.js.


# How to use : 使い方

Only 3 steps.

## 1. Get the source code : ソースコードの取得

```sh
npm install arduinode
```

## 2. Write the program to Arduino : スケッチをArduinoに書き込む

Open the Sketch(sketch/arduinode/arduinode.ino) in Arduino IDE, write to the Arduino.

<img src="https://github.com/mironal/arduinode/raw/master/doc/img/write-to-arduino.png">

## 3. Write the node.js code! : プログラミングじゃぁ！

Example

```js
var Arduinode = require("arduinode").Arduinode;

// How to find the serial port?
// ls /dev | grep usb
var portName = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(port, function(err, result){
  if(err){
    return console.log(err);
  }
  console.log("open");

  // Read analog port value.
  arduinode.analogRead(0, function(err, result){
    if(err){
      return console.log(err);
    }

    console.log(result);
    // { msg: "OK", port: 0, val: 401 }

    arduinode.close(function(){
      console.log("close");
    });
  });
});
```

# Features

## Analog read, write support

```js
arduinode.analogRead(port, callback);
arduinode.analogWrite(port, value, callback);
```

## Didital read, write support

```js
arduinode.digitalRead(port, callback);
arduinode.digitalWrite(port, value, callback);
```


## Port change interrupt support

```js
// num  : Interrupt number. 0 or 1
// mode : "CHANGE" or "RISING" or "FALLING" or "LOW"
arduinode.attachInterrupt(num, mode, callback)
arduinode.detachInterrupt(num, callback);

// Receive interrupt event.
arduinode.on("event", function(data){
  console.log(data);
});
```

## Timer overflow Interrupt support

```js
digitalStreamOn(port, intervalMiliSec, callback);
digitalStreamOff(port, callback);

// Receive interrupt event.
arduinode.on("event", function(data){
  console.log(data);
});
```

# Document

**[API document を見る！](doc/API.md)**

# Example application

arduinode.js + WebSocket(socket.io) + express

**[Come here!](example/Readme.md)**


