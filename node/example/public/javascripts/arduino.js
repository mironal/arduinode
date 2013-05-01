$(function(){
  var socket = io.connect(document.URL);

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


  socket.on("notify", function(data){
    console.log(data);
  });

  socket.on("notify-all", function(data){
    for(var i = 0; i < data.digital.length; i++){
      switch(data.digital[i].direction){
        case "INPUT":
          replace_each($("#dir-d" + i ).children("span"), ">");
          break;
        case "OUTPUT":
          replace_each($("#dir-d" + i ).children("span"), "<");
          break;
      }
      $("#d" + i).css("background", "lightgreen").text(data.digital[i].value);
    }
  });


  $(".port-value").on("click", function(){
    var self = $(this);
    var dir = $("#dir-" + self.attr("id")).text().trim();
    if(dir === "<<"){
      var port = self.attr("id").replace("d", "");
      var val = parseInt(self.text());
      if(val === 1){
        val = 0;
      }else{
        val = 1;
      }
      self.text(val);
      socket.emit("digitalWrite", {port:port, val:val});
    }
  });

  $(".direction span").on("click", function(){
    var div = $(this).parent();
    var spans = div.children("span");
    if(div.hasClass("serial-port") || spans.length < 1){
      return;
    }

    var text = $(spans[0]).text().trim();
    var port = parseInt(div.attr("id").replace("dir-d", ""));
    if(text === "<"){
      replace_each(spans, ">");
      socket.emit("pinMode", {port:port, mode:"INPUT"});
    }else if(text === ">"){
      replace_each(spans, "<");
      $("#d" + port).css("background", "lightgreen");
      socket.emit("pinMode", {port:port, mode:"OUTPUT"});
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
