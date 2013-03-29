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

// Stringとuint8_tを保持する構造体.
struct STR_UINT8_PEAR {
  String key;
  uint8_t value;
};

// pinModeの名前と値を保持するテーブル.
const struct STR_UINT8_PEAR PIN_MODE_TBL[] = {
  {"INPUT", INPUT},
  {"OUTPUT", OUTPUT},
  {"INPUT_PULLUP", INPUT_PULLUP}
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
     {val}   => write value. or HIGH | LOW
     example => do/write/3?val=1
     example => do/write/3?val=HIGH
   */
  {String("do/write/"), &doWriteTask},

  /*
     Swith digital pin mode.
     format  => d/mode/{port}?type={type}
     {port}  => port number.
     {type}   => INPUT | OUTPUT | INPUT_PULLUP
     example => d/mode/3?type=INPUT
   */
  {String("d/mode/"), &switchPinModeTask},

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
        memset(read_buf, 0, buf_index);
        buf_index = 0;
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
  return NgReturnJson("Illegal command.", msg);
}

String switchPinModeTask(String portWithQuery){

  String valQuery;
  int port;

  String error = checkPortWithQuery(portWithQuery, &port, &valQuery);

  if(error){
    return error;
  }

  if(valQuery.startsWith("type=")){
    valQuery.replace("type=", "");
  }else{
    return NgReturnJson("type is not specified.", valQuery);
  }

  for(int i = 0; i < ARRAYSIZE(PIN_MODE_TBL); i++){
    if(valQuery == PIN_MODE_TBL[i].key){
      pinMode(port, PIN_MODE_TBL[i].value);
      return switchTypeReturnJson("OK", valQuery);
    }
  }
  return NgReturnJson("Illegal type", valQuery);
}

String checkPortWithQuery(String portWithQuery, int *port, String *query){
  int at = portWithQuery.indexOf('?');
  if(at == -1){
    // queryが指定されていなかったら-1で返す.
    return NgReturnJson("Query not found.", portWithQuery);
  }
  String portQuery = portWithQuery.substring(0, at);
  if(!isInt(portQuery)){
    return NgReturnJson("Illegal port number.", portQuery);
  }
  *port = strToInt(portQuery);
  *query = portWithQuery.substring(at + 1);

  return NULL;
}

String checkPortWithValue(String portWithValue, int *port, int *val){

  String valQuery;

  String error = checkPortWithQuery(portWithValue, port, &valQuery);

  if(error){
    return error;
  }

  if(valQuery.startsWith("val=")){
    valQuery.replace("val=","");
  }else{
    return NgReturnJson("val is not specified.", valQuery);
  }

  // HIGH, LOWのチェックはdoWriteTask用
  if(valQuery == "HIGH"){
    *val = 1;
  }else if(valQuery == "LOW"){
    *val = 0;
  }else if(isInt(valQuery)){
    *val = strToInt(valQuery);
  }else{
    return NgReturnJson("Illegal value.", valQuery);
  }

  return NULL;
}

/*
   {port_num}?val={value}
   で入ってくる.
 */
String aoWriteTask(String portWithValue){
  int port = 0;
  int val = 0;

  String error = checkPortWithValue(portWithValue, &port, &val);
  if(error){
    return error;
  }

  analogWrite(port, val);
  return ioWriteReturnJson("OK", port, val);
}


String doWriteTask(String portWithValue){
  int port = 0;
  int val = 0;

  String error = checkPortWithValue(portWithValue, &port, &val);
  if(error){
    return error;
  }

  if(val == 1){
    digitalWrite(port, HIGH);
  }else{
    digitalWrite(port, LOW);
    val = 0;
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
      return switchTypeReturnJson("OK", AI_REF_TBL[i]);
    }
  }
  ref.replace("?type=", "");
  return switchTypeReturnJson("NG", ref);
}

String switchTypeReturnJson(String msg, String refType){
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

String NgReturnJson(String err, String hint){
  String body = wrapDq("msg") + ":" + wrapDq("NG") + "," + wrapDq("error") + ":" + wrapDq(err) + "," + wrapDq("hint") + ":" + wrapDq(hint);
  return wraped('{', body, '}');
}

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
