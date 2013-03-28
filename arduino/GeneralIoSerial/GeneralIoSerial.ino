#define ARRAYSIZE(array) (sizeof(array) / sizeof(array[0]))

char read_buf[128];
int buf_index = 0;

const char* AI_REF_TBL[] = {
  "DEFAULT",
  "INTERNAL",
  "EXTERNAL"
};

const uint8_t AI_REF_VAL_TBL[] = {
  DEFAULT,
  INTERNAL,
  EXTERNAL
};

// 各々のコマンドに対して処理を行う関数の型
typedef String (*TASK_FUNC_PTR)(String str);

// コマンドの文字列の先頭の文字と処理する関数を保持する構造体
struct TASK_FUNC {
  String prefix;
  TASK_FUNC_PTR func;
};

// prefixとタスク関数のテーブルを使ってキメる.
const struct TASK_FUNC TASK_FUNC_TBL[] = {
  /*
     Read AI port.
     format  => ai/read/{port}
     {port}  => port number.
     example => ai/read/0
   */
  {String("ai/read/"), &aiReadTask},

  /*
    Switch AI reference volt.
    format  => ai/ref?type={TYPE}
    {TYPE}  => DEFAULT | INTERNAL | EXTERNAL
    example => ai/ref?type=INTERNAL
   */
  {String("ai/ref"), &aiRefSwitchTask},

  /*
     Write AO port.
     format  => ao/write/{port}?val={val}
     {port}  => port number.
     {val}   => write value.
     example => ao/write/1?val=100
   */
  {String("ao/write/"), &aoWriteTask},

  /*
     Read DI port.
     format  => di/read/{port}
     {port}  => port number.
     example => di/read/2
   */
  {String("di/read/"), &diReadTask},


  /*
     Write DO port.
     format  => do/write/{port}?val={val}
     {port}  => port number.
     {val}   => write value.
     example => do/write/3?val=1
   */
  {String("do/write/"), &doWriteTask},



  /*
     Close serial port.
     format => system/close
   */
  {String("system/close"), &closeSerial}
};

void setup() {
  memset(read_buf,0,128);
  Serial.begin(9600);
  Serial.println("READY");
}

void loop() {
  if(Serial.available() > 0){
    while(Serial.available() > 0){
      read_buf[buf_index] = Serial.read();
      if(read_buf[buf_index] == (char)10){
        String msg = String(read_buf);
        msg.trim();
        Serial.println(task(msg));
        buf_index = 0;
        memset(read_buf,0,128);
        break;
      }
      buf_index++;
    }
  }
}


String task(String msg){
  // 関数テーブルからタスクを決定する.
  // prefixは空文字と置換される.
  for(int i = 0; i < ARRAYSIZE(TASK_FUNC_TBL); i++){
    if(msg.startsWith(TASK_FUNC_TBL[i].prefix)){
      msg.replace(TASK_FUNC_TBL[i].prefix, "");
      return TASK_FUNC_TBL[i].func(msg);
    }
  }
  // TODO JSONでエスケープするべき文字が入っていると受信した側でヤバイ気がする.
  return '{' + wrapDq("msg") + ":" + wrapDq("NG")
    + "," + wrapDq("cmd") + ":" + wrapDq(msg) + '}';
}


/* この辺のコードがめっちゃ2重化してるのはとりあえず気にしない. */

/*
   {port_num}?val={value}
   で入ってくる.
 */
String aoWriteTask(String portWithValue){
  int port = strToInt(portWithValue);
  int at = portWithValue.indexOf('?');
  if(at == -1){
    // queryが指定されていなかったら-1で返す.
    return ioWriteReturnJson("NG", port, -1);
  }
  String valQuery = portWithValue.substring(at + 1);
  if(valQuery.startsWith("val=")){
    valQuery.replace("val=","");
  }else{
    return ioWriteReturnJson("NG", port, -2);
  }
  if(!isInt(valQuery)){
    return ioWriteReturnJson("NG", port, -3);
  }

  int val = strToInt(valQuery);
  analogWrite(port, val);
  return ioWriteReturnJson("OK", port, val);
}

String doWriteTask(String portWithValue){
  int port = strToInt(portWithValue);
  int at = portWithValue.indexOf('?');
  if(at == -1){
    // queryが指定されていなかったら-1で返す.
    return ioWriteReturnJson("NG", port, -1);
  }
  String valQuery = portWithValue.substring(at + 1);
  if(valQuery.startsWith("val=")){
    valQuery.replace("val=","");
  }else{
    return ioWriteReturnJson("NG", port, -2);
  }
  if(!isInt(valQuery)){
    return ioWriteReturnJson("NG", port, -3);
  }

  int val = strToInt(valQuery);
  if(val == 1){
    digitalWrite(port, HIGH);
  }else{
    digitalWrite(port, LOW);
  }
  return ioWriteReturnJson("OK", port, val);
}

String ioWriteReturnJson(String msg, int port, int val){
  String body = wrapDq("msg") + ":"+wrapDq(msg)
    + "," + wrapDq("port") + ":" + String(port)
    + "," + wrapDq("val") + ":" + String(val);
  return wraped('{', body, '}');
}

String diReadTask(String portQuery){
  if(!isInt(portQuery)){
    return ioReadReturnJson("NG", -1, -1);
  }
  int port = strToInt(portQuery);
  int val = digitalRead(port);
  return ioReadReturnJson("OK", port, val);
}

String aiReadTask(String portQuery){
  if(!isInt(portQuery)){
    return ioReadReturnJson("NG", -1, -1);
  }
  int port = strToInt(portQuery);
  int val = analogRead(port);
  return ioReadReturnJson("OK", port, val);

}

String ioReadReturnJson(String msg, int port, int val){
  String body = wrapDq("msg") + ":" + wrapDq(msg)
    + "," + wrapDq("port") + ":" + String(port)
    + "," + wrapDq("val") + ":" + String(val);
  return wraped('{', body, '}');
}

/*
   AIリファレンス電圧切替.
 */
String aiRefSwitchTask(String ref){
  for(int i = 0; i < ARRAYSIZE(AI_REF_TBL); i++){
    if(ref.endsWith(AI_REF_TBL[i])){
      analogReference(AI_REF_VAL_TBL[i]);
      return aiSwitchRefReturnJson("OK", AI_REF_TBL[i]);
    }
  }
  ref.replace("?type=", "");
  return aiSwitchRefReturnJson("NG", ref);
}

String aiSwitchRefReturnJson(String msg, String refType){
  String body = wrapDq("msg") + ":" + wrapDq(msg)
    + "," + wrapDq("type") + ":" + wrapDq(refType);
  return wraped('{', body, '}');
}


// シリアルを閉じる.
String closeSerial(String empty){
  Serial.end();
  return "";
}

/*
   Utility functions.
 */

String wrapDq(String str){
  return wrapChar(str, '"');
}

String wrapChar(String str, char wrap){
  return wraped(wrap, str, wrap);
}

String wraped(char before, String body, char after){
  return before + body + after;
}

boolean isInt(String str){
  for(int i = 0; i < str.length(); i++){
    char c = str[i];
    if( !((c >= '0') && (c <= '9')) ){
      return false;
    }
  }
  return true;
}

// strの先頭から数値を解析してintにして返す
// 234hogeを渡すと234が返ってくる
// 128文字以上の数が含まれるとシヌ。そもそもintが2byteなので速攻で死ぬ
int strToInt(String str){
  char buf[128] = {0};
  int b_i = 0;
  /// 123という並びで来たら、321という並びでbufに格納される
  for(int i = 0; i < str.length(); i++){
    char c = str[i];
    if( (c >= '0') && (c <= '9') ){
      buf[b_i++] = c;
    }else{
      break;
    }
  }

  int rslt = 0;
  if(b_i > 0){
    for(int i = 0; i < b_i; i++){
      rslt += (int)(buf[i] - '0') * intPow(10, (b_i - 1) - i);
    }
  }
  return rslt;
}

int intPow(int base, int e){
  if( e == 0){
    return 1;
  }
  if( base == 0){
    return 0;
  }
  int rslt = 1;
  for(int i = 0; i < e; i++){
    rslt *= base;
  }
  return rslt;
}
