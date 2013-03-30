var Arduinode = require("../../module/arduinode").Arduinode;

var portName = "/dev/tty.usbmodem1411";

var arduinode = new Arduinode(portName, function(){
  arduinode.send("ao/write/1?val=22", function(err, resp){
    if(err) throw err;
    console.log(resp);
  });
});


arduinode.on("error", function(error){
  console.log("error : " + error);
});

