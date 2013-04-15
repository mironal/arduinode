$(function(){
  var socket = io.connect("http://localhost");

  socket.on("event", function(data){
    var type = data.event;
    var port = data.data.port;
    var value = data.data.val;
    switch(type){
      case "ai":
        apply_value("#a" + port, value);
        break;
      case "di":
        apply_value("#d" + port, value);
        break;
      default:
        console.log("Unkown type.");
    }
  });


  var apply_value = function(selector, val){
    var div = $(selector);
    var old_val = div.text();
    div.text(val);
    if(old_val != val){
      div.css("background-color", "lightgreen");
    }else{
      div.css("background-color", "white");
    }
  }

});
