$(function(){
  var socket = io.connect("http://localhost");

  socket.on("ai",  function (datas) {
    _.each(datas, function(data){
      apply_value($("#a" + data.port), data.val);
    });
  });

  socket.on("di", function(datas){
    _.each(datas, function(data){
      apply_value($("#d" + data.port), data.val);
    });
  });

  socket.on("open", function(data){
    console.log("open");
    console.log(data);
  });

  var apply_value = function(div, val){
    var old_val = div.text();
    div.text(val);
    if(old_val != val){
      div.css("background-color", "lightgreen");
    }else{
      div.css("background-color", "white");
    }
  }

});
