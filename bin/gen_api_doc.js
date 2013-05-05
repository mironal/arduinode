
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

var lastPreLine = false;
for(var i = 0; i < contents.length; i++){
  var c = contents[i];

  if(c === "```js" || c === "```c" || c === "```sh"){
    if(i > 0){
      if(contents[i - 1].length !== 0){
        var error = new Error();
        error.name = "InvalidFormatError";
        error.message = "line : " + i;
        throw error;
      }
    }
  }



  // ```の次の行が空行であることをチェック
  if(c === "```"){
    lastPreLine = true;
  }else if(lastPreLine === true && c.length === 0){
    lastPreLine = false;
  }else if(lastPreLine === true && c.length !== 0){
    var error = new Error();
    error.name = "InvalidFormatError";
    error.message = "line : " + i;
    throw error;
  }


  if(level1Header.test(c)){
    var title = c.match(/# (.*) </);
    var name = c.match(/<a name="(.*)">/);
    if( (title != null) &&
        (title.length > 1) &&
        (name != null) &&
        (name.length > 1) ){
          console.log("* [" + title[1] + "](#" + name[1] + ")");
        }
  }else if(level2Header.test(c)){
    var title = c.match(/## (.*) </);
    var name = c.match(/<a name="(.*)">/);
    if( (title != null) &&
        (title.length > 1) &&
        (name != null) &&
        (name.length > 1)){
          console.log("    * [" + title[1] + " : " + name[1].replace("#", "") + "](#" + name[1] + ")");
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

