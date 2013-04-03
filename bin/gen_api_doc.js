
/*

  /***で始まるコメントをmarkdownのドキュメントとみなす

 */


var fs = require("fs");
var argv = process.argv;
if(argv.length < 3){
  console.log("ファイル名が指定されていません");
  process.exit(1);
}

var filename = argv[2];

var file = fs.readFileSync(filename, {encoding:"utf8"});

var contents = file.split("\n");

var startRegex = new RegExp(/^\/\*\*\*$/);
var endRegex = new RegExp(/\*\//);
var isDoc = false;
var level1Header = new RegExp(/^# .*$/);
var level2Header = new RegExp(/^## .*$/);

console.log("# 目次");

for(var i = 0; i < contents.length; i++){
  var c = contents[i];
  if(level1Header.test(c)){
    var title = c.match(/# (.*)$/);
    if( (title != null) &&
        (title.length > 1)){
          console.log("* [" + title[1] + "](#" + title[1] + ")");
        }
  }else if(level2Header.test(c)){
    var title = c.match(/## (.*)$/);
    if( (title != null) &&
        (title.length > 1) ){
          console.log("    * [" + title[1] + "](#" + title[1] + ")");
        }
  }
}


for(var i = 0; i < contents.length; i++){
  var c = contents[i];
  if((isDoc === false) && startRegex.test(c)){
    isDoc = true;
  }else if((isDoc === true) && endRegex.test(c)){
    isDoc = false;
  }else if(isDoc){
    console.log(c);
  }
}

