var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var assert = require('assert');
var portName = "/dev/tty.usbmodem1411";

var readData = '';
var phase = 0;
var sp = new SerialPort(portName, {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false,
});

function errorExit(){
  console.log("error exit.");
  sp.close();
  process.exit(1);
}

var keepAlive = null;
function startkeepAlive(){
  /*
   * arduinoからのレスポンスの終わりを検出出来ないので、
   * タイムアウトしたら何らかのエラー or バグがあるのもとして
   * 受信したバッファーを出力して終了する.
   */
  keepAlive = setTimeout(function(){
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("!!!!!    Timeout    !!!!!");
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("Expect           : " + tests[test_index].expect);
    console.log("Received message : " + readData);
    errorExit();
  }, 2000);
}
function clearKeepAlive(){
  if(keepAlive != null){
    clearTimeout(keepAlive);
  }
}

function sendCommand(cmdWithoutNL, cb){
  // READY待ちの時だけ例外的に扱う.
  if(cmdWithoutNL == ""){
    cb(null, 0, "");
    return;
  }
  console.log("Send command : " + cmdWithoutNL);
  var cmd = cmdWithoutNL + "\n";
  sp.write(cmd, function(err, bytesWritten, sendCmd){
    cb(err, bytesWritten, cmd)
  });
}

function successMsg(result, expect){
  console.log("Expect           : " + expect.trim());
  console.log("Received message : " + result.trim());
  console.log();
}

var tests = [
{
  name:"READY",
  cmd:"", // 初期化待ちだけ空のコマンドにする.
  expect:"READY",
  send:false
},
{
  name:"Illegal Command.",
  cmd:"aaaaa",
  expect:JSON.stringify({msg:"NG", error:"Illegal command.", hint:"aaaaa"}),
  send:false
},
{
  name:"AO write test.",
  cmd:"ao/write/3?val=25",
  expect:JSON.stringify({msg:"OK", port:3, val:25}),
  send:false
},
{
  name:"AO write test. No query.",
  cmd:"ao/write/3",
  expect:JSON.stringify({msg:"NG", error:"Query not found.", hint:"3"}),
  send:false
},
{
  name:"AO write test. Illegal query.",
  cmd:"ao/write/3?hoge",
  expect:JSON.stringify({msg:"NG", error:"val is not specified.", hint:"hoge"}),
  send:false
},
{
  name:"AO write test. Illegal value. ",
  cmd:"ao/write/3?val=hoge",
  expect:JSON.stringify({msg:"NG", error:"Illegal value.", hint:"hoge"}),
  send:false
},
{
  name:"AO write test. Illegal port number. ",
  cmd:"ao/write/a?val=20",
  expect:JSON.stringify({msg:"NG", error:"Illegal port number.", hint:"a"}),
  send:false
},
{
  name:"AI Reference test. type = INTERNAL",
  cmd:"ai/ref?type=INTERNAL",
  expect:JSON.stringify({msg:"OK", type:"INTERNAL"}),
  send:false
},
{
  name:"AI Reference test. type = EXTERNAL",
  cmd:"ai/ref?type=EXTERNAL",
  expect:JSON.stringify({msg:"OK", type:"EXTERNAL"}),
  send:false
},
{
  name:"AI Reference test. type = DEFAULT",
  cmd:"ai/ref?type=DEFAULT",
  expect:JSON.stringify({msg:"OK", type:"DEFAULT"}),
  send:false
},
{
  name:"AI Reference test. Unknown type.",
  cmd:"ai/ref?type=hoge",
  expect:JSON.stringify({msg:"NG", type:"hoge"}),
  send:false
},
{
  name:"AI read test.",
  cmd:"ai/read/1",
  expect:JSON.stringify({msg:"OK", port:1, val:1}).split("\"val")[0],
  send:false
},
{
  name:"AI read test. Illegal port.",
  cmd:"ai/read/a",
  expect:JSON.stringify({msg:"NG", port:-1, val:-1}),
  send:false
},
{
  name:"DI read test.",
  cmd:"di/read/0",
  expect:JSON.stringify({msg:"OK", port:0, val:1}).split("\"val")[0],
  send:false
},
{
  name:"DI read test. Illegal port",
  cmd:"di/read/aa",
  expect:JSON.stringify({msg:"NG", port:-1, val:-1}),
  send:false
},
{
  name:"DO write test.",
  cmd:"do/write/3?val=25",
  expect:JSON.stringify({msg:"OK", port:3, val:0}),
  send:false
},
{
  name:"DO write test. HIGH",
  cmd:"do/write/4?val=HIGH",
  expect:JSON.stringify({msg:"OK", port:4, val:1}),
  send:false
},
{
  name:"DO write test. LOW",
  cmd:"do/write/40?val=LOW",
  expect:JSON.stringify({msg:"OK", port:40, val:0}),
  send:false
},
{
  name:"DO write test. No query.",
  cmd:"do/write/3",
  expect:JSON.stringify({msg:"NG", error:"Query not found.", hint:"3"}),
  send:false
},
{
  name:"DO write test. Illegal port number.",
  cmd:"do/write/b?val=3",
  expect:JSON.stringify({msg:"NG", error:"Illegal port number.", hint:"b"}),
  send:false
},
{
  name:"DO write test. Illegal query.",
  cmd:"do/write/3?hoge",
  expect:JSON.stringify({msg:"NG", error:"val is not specified.", hint:"hoge"}),
  send:false
},
{
  name:"DO write test. Illegal value.",
  cmd:"do/write/3?val=hoge",
  expect:JSON.stringify({msg:"NG", error:"Illegal value.", hint:"hoge"}),
  send:false
},
{
  name:"Switch pin mode. INPUT",
  cmd:"d/mode/3?type=INPUT",
  expect:JSON.stringify({msg:"OK", type:"INPUT"}),
  send:false
},
{
  name:"Switch pin mode. OUTPUT",
  cmd:"d/mode/3?type=OUTPUT",
  expect:JSON.stringify({msg:"OK", type:"OUTPUT"}),
  send:false
},
{
  name:"Switch pin mode. INPUT_PULLUP",
  cmd:"d/mode/3?type=INPUT_PULLUP",
  expect:JSON.stringify({msg:"OK", type:"INPUT_PULLUP"}),
  send:false
}



];
var test_index = 0;
sp.on('data', function (data) {
  // 改行は消えて入ってくる.
  readData += data;
});

sp.on('close', function (err) {
  console.log('port closed');
});

sp.on('error', function (err) {
  console.error("error", err);
});

var task = null;
sp.on('open', function () {
  console.log("Wait for \"READY\" message.");
  task = setInterval(function(){
    if(test_index >= tests.length){
      clearInterval(task);
      console.log("finish");
      return;
    }

    var test_case = tests[test_index];
    if(test_case.send == false){
      // コマンド送信
      readData = "";
      console.log("**********************************");
      console.log("Start : " + test_case.name);
      console.log("**********************************");
      sendCommand(test_case.cmd, function(err, bytesWritten, cmd){
        // ちゃんと送信できたか確認.
        if(cmd.length != bytesWritten){
          console.log("Invalid send length .");
          console.log("cmd.length : " + cmd.length + ", bytesWritten : " + bytesWritten);
          errorExit();
        }
        test_case.send = true;
        startkeepAlive();
      });
    }else{
      // レスポンス待機
      // レスポンス評価
      if(readData.indexOf(test_case.expect) >= 0){
        clearKeepAlive();
        successMsg(readData, test_case.expect);
        // 次のテストに進める
        test_index++;
      }
    }

  }, 100);
});


/*
      */
