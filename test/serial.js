var SerialPort = require("serialport").SerialPort;
var assert = require('assert');

var keepAlive = setTimeout(function () {
  console.log('timeout');
  console.log("Read data : ");
  console.log(readData);
  sp.close();
  process.exit();
}, 100000);

var portName = "/dev/tty.usbmodem1411";


var readData = '';
var phase = 0;
var sp = new SerialPort(portName, {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false
});

function sendCommand(cmd){
  console.log("Send command : " + cmd);
  sp.write(cmd, function(err, bytesWritten){
    if(err){
      console.log(err);
    }
    if(cmd.length != bytesWritten){
      console.log("Invalid send length .");
      console.log("cmd.length : " + cmd.length + ", bytesWritten : " + bytesWritten);
    }
  });
}

function nextPhaseMsg(result){
  console.log("Received message : " + result);
  console.log("Phase " + phase + " is OK. Next phase.");
  console.log();
}

sp.on('data', function (data) {
  // 改行は消される.
  readData += data;

  switch (phase){
    case 0:
      // setup
      // Arduino初期化待ち & ao writeコマンド送信.
      if(readData.indexOf("READY") >= 0){
        nextPhaseMsg(readData);
        console.log("AO write test.");
        var aoWriteTest = "ao/write/3?val=25\n";
        sendCommand(aoWriteTest);
        readData = '';
        phase = 1;
      }
      break;
    case 1:
      // ao writeコマンド結果待ち
      var expect = {msg:"OK", port:3, val:25};
      var json = JSON.stringify(expect);
      if(readData.indexOf(json) >= 0){
        nextPhaseMsg(readData);
        var cmd = "ao/write/11\n";
        sendCommand(cmd);
        readData = '';
        phase = 2;

      }
      break;
    case 2:
      var expect = {msg:"NG", port:11, val:-1};
      var json = JSON.stringify(expect);
      if(readData.indexOf(json) >= 0){
        nextPhaseMsg(readData);
        readData = '';
        phase = 3;

      }

      break;
  }

});

sp.on('close', function (err) {
  console.log('port closed');
});

sp.on('error', function (err) {
  console.error("error", err);
});

sp.on('open', function () {
  console.log("Wait for \"READY\" message.");
});

