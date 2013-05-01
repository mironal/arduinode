$(function(){
  var socket = io.connect(document.URL);

  // INPUT時にstreamのイベントが発行された時に実行される.
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
        move_allow("#dir-d" + port);
        break;
      default:
        console.log("Unkown type.");
    }
  });


  // OUTPUT、INPUTが切り替わった時やOUTPUT時にポートの値が
  // 変更された時に通知される.
  socket.on("notify", function(data){
    change_direction(data.port, data.direction, data.value);
  });

  // 接続時に現在のArduinoの状態が通知される.
  socket.on("notify-all", function(data){
    for(var i = 0; i < data.digital.length; i++){
      var status = data.digital[i];
      change_direction(i, status.direction, status.value);
    }
  });


  // OUTPUTの時に値の所がクリックされたら1と0を切り返る
  $(".port-value").on("click", function(){
    var self = $(this);
    var spans = $("#dir-" + self.attr("id")).children("span");

    if(self.hasClass("serial-port") || spans.length < 1){
      return;
    }

    var allow = $(spans[0]).text().trim();

    if( allow === "<"){
      var now = parseInt(self.text());
      var to = {port:0, val:0};
      to.port = self.attr("id").replace("d", "");
      if(now === 0){
        to.val = 1;
      }
      socket.emit("digitalWrite", to);
    }
  });


  // 矢印の所がクリックされたらINPUTとOUTPUTを切り替える
  $(".direction span").on("click", function(){
    var div = $(this).parent();
    var spans = div.children("span");
    if(div.hasClass("serial-port") || spans.length < 1){
      return;
    }

    var allow = $(spans[0]).text().trim();
    var port = parseInt(div.attr("id").replace("dir-d", ""));

    switch(allow){
      case ">":
      socket.emit("pinMode", {port:port, mode:"OUTPUT"});
        break;
      case "<":
      socket.emit("pinMode", {port:port, mode:"INPUT"});
        break;
      default:
        console.log("Unknown text : " + allow);
    }
  });


  // 矢印を動いている風に見せる.
  var move_allow = function(selector){
      var allow = $(selector);
      var spans = allow.children("span");

      spans.each(function(){
        var self = $(this);
        if(self.css("color") === "rgb(0, 0, 0)"){
          self.css("color", "red");
        }else{
          self.css("color", "black");
        }
      });
  }


  var change_direction = function(port, direction, value){
    switch(direction){
      case "INPUT":
        replace_to_input(port);
        break;
      case "OUTPUT":
        replace_to_output(port);
        break;
    }
    set_port_value(port, value);
  }


  var set_port_value = function(port, value){
    $("#d" + port).text(value);
  }

  var replace_to_output = function(port){
    replace_each($("#dir-d" + port).children("span"), "<");
    $("#d" + port).css("background-color", "lightgreen");
  }

  var replace_to_input = function(port){
    replace_each($("#dir-d" + port).children("span"), ">");
  }
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

  var replace_each = function(elems, text){
    elems.each(function(){
      $(this).text(text);
    });
  }
});
