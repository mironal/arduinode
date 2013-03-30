var Arduinode = require("../../module/arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portName, {
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false,
});

arduinode.on("open", function(){
  arduinode.send("ai/read/2", function(err, resp){
    if(err) throw err;
    console.log(resp);
  });
});

arduinode.on("error", function(error){
  console.log("error : " + error);
});

