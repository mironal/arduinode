#define ARRAYSIZE(array) (sizeof(array) / sizeof(array[0]))

char read_buf[128];
int buf_index = 0;

// 各々のコマンドに対して処理を行う関数の型
typedef String (*TASK_FUNC_PTR)(String str);

// コマンドの文字列の先頭の文字と処理する関数を保持する構造体
struct TASK_FUNC {
  char* prefix;
  TASK_FUNC_PTR func;
};

// Stringとuint8_tを保持する構造体.
struct STR_UINT8_PEAR {
  char* key;
  uint8_t value;
};

// DI Stream機能の情報.
struct DI_STREAM_INFO {
  // 読み込みを行うポート情報
  uint64_t ports;

  // Stream機能が有効かどうか
  bool enabled;
} di_stream_info;

struct AI_STREAM_INFO {
  // 読み込みを行うポート情報
  uint16_t ports;

  // Stream機能が有効かどうか
  bool enabled;
} ai_stream_info;



// pinModeの名前と値を保持するテーブル.
const struct STR_UINT8_PEAR PIN_MODE_TBL[] = {
  {"INPUT", INPUT},
  {"OUTPUT", OUTPUT},
  {"INPUT_PULLUP", INPUT_PULLUP}
};

// AI Reference電圧の名前と値を保持するテーブル.
const struct STR_UINT8_PEAR AI_REF_TBL[] = {
  {"DEFAULT", DEFAULT},
  {"INTERNAL", INTERNAL},
  {"EXTERNAL", EXTERNAL}
};

// prefixとタスク関数のテーブルを使ってキメる.
const struct TASK_FUNC TASK_FUNC_TBL[] = {
  /*
     Read AI port.
     format  => ai/read/{port}
     {port}  => port number.
     example => ai/read/0
   */
  {"ai/read/", &aiReadTask},

  /*
    Switch AI reference volt.
    format  => ai/ref?type={TYPE}
    {TYPE}  => DEFAULT | INTERNAL | EXTERNAL
    example => ai/ref?type=INTERNAL
   */
  {"ai/ref", &aiRefSwitchTask},

  /*
     Write AO port.
     format  => ao/write/{port}?val={val}
     {port}  => port number.
     {val}   => write value.
     example => ao/write/1?val=100
   */
  {"ao/write/", &aoWriteTask},

  /*
     Read DI port.
     format  => di/read/{port}
     {port}  => port number.
     example => di/read/2
   */
  {"di/read/", &diReadTask},


  /*
     Write DO port.
     format  => do/write/{port}?val={val}
     {port}  => port number.
     {val}   => write value. or HIGH | LOW
     example => do/write/3?val=1
     example => do/write/3?val=HIGH
   */
  {"do/write/", &doWriteTask},

  /*
     Swith digital pin mode.
     format  => d/mode/{port}?type={type}
     {port}  => port number.
     {type}  => INPUT | OUTPUT | INPUT_PULLUP
     example => d/mode/3?type=INPUT
   */
  {"d/mode/", &switchPinModeTask},

  /*
    DI連続転送ON
    format   => stream/di/on?{ports}
    {ports}  => 有効にするポート.対応するbitを1にする. 指定しない場合は前回と同じポートを使う.Defaultは0
    example  => stream/di/on?240
     240 = 0xf0 = 7 - 4番ポートを有効化


     streamのレスポンス

     streamのレスポンスはeventとして定義する

     {"event":"di", "datas":[
        {"msg":"OK","port":[port],"val":[val]},
        {"msg":"OK","port":[port],"val":[val]},
        ...
        {"msg":"OK","port":[port],"val":[val]}
     ]}
   */
  {"stream/di/on", &streamDiOnTask},

  /*
     DI連続転送OFF
     format => stream/di/off
   */
  {"stream/di/off", &streamDiOffTask},

  /*
    AI連続転送ON
    format   => stream/ai/on?{ports}
    {ports}  => 有効にするポート.対応するbitを1にする. 指定しない場合は前回と同じポートを使う.Defaultは0
    example  => stream/ai/on?15
     15 = 0xf = 3 - 0番ポートを有効化
   */
  {"stream/ai/on", &streamAiOnTask},

  /*
     AI連続転送OFF
     format => stream/ai/off
   */
  {"stream/ai/off", &streamAiOffTask},


  /*
    連続転送間隔設定
    format => stream/delay?{delayMillSec}
    {delayMillSec} => 変換間隔[msec]
   */
  //{"stream/delay", &setStreamDelayTask},

  /*
TODO: 紛らわしいので後で消す
     Close serial port.
     format => system/close
   */
  {"system/close", &closeSerial},


  /*
    Reset arduino.
    node-serialportではDTR信号の制御が出来ない(多分)ため
    関数内でスタックオーバーフローを発生させることで強制的にリセットをかける。
    リセットかけるとnode.jsが終了しない不具合を解決することが出来る。

    format => system/reset
   */
  {"system/reset", &resetTask}

};




void setup() {
  buf_index = 0;
  memset(read_buf,0,128);

  di_stream_info.ports = 0;
  di_stream_info.enabled = false;

  ai_stream_info.ports = 0;
  ai_stream_info.enabled = false;

  Serial.begin(115200);
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
      if(++buf_index >= ARRAYSIZE(read_buf)){
        Serial.println(NgReturnJson("Command is too long.", "Less than 127 characters, including newlines" ));
        // なくなるまで読み捨てる.
        while(Serial.available() > 0){Serial.read();}
        memset(read_buf, 0, ARRAYSIZE(read_buf));
        buf_index = 0;
      }
    }
  }

  // enabledがtrueかつ、portsのどれか一つが有効になっていれば
  // 変換を行う
  if(di_stream_info.enabled &&
     di_stream_info.ports != 0){
    Serial.print(eventResponseHeader("di"));
    bool first = true;
    for(int i = 0; i < 14; i++){
      if(bitRead(di_stream_info.ports, i) == 1){
        if(first){
          first = false;
        }else{
          Serial.print(",");
        }
        Serial.print(diRead(i));
      }
    }
    Serial.println("]}");
  }

  if(ai_stream_info.enabled &&
     ai_stream_info.ports != 0){
    Serial.print(eventResponseHeader("ai"));
    bool first = true;
    for(int i = 0; i < 14; i++){
      if(bitRead(ai_stream_info.ports, i) == 1){
        if(first){
          first = false;
        }else{
          Serial.print(",");
        }
        Serial.print(aiRead(i));
      }
    }
    Serial.println("]}");
  }
}

String eventResponseHeader(String event){
  return "{" + stringJson("event", event) + "," + wrapDq("datas") + ":[";
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
  return NgReturnJson("Illegal type.", valQuery);
}

String checkHasQuery(String query, int *at){
  *at = query.indexOf('?');
  if(*at == -1){
    // queryが指定されていなかったら-1で返す.
    return NgReturnJson("Query not found.", query);
  }
  return NULL;
}

String checkPortWithQuery(String portWithQuery, int *port, String *query){

  int at = 0;
  String error = checkHasQuery(portWithQuery, &at);
  if(error){
    return error;
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
  return okIoJson("OK", port, val);
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
  return okIoJson("OK", port, val);
}


String checkPortQuery(String portQuery){
  if(!isInt(portQuery)){
    return NgReturnJson("Illegal port number.", portQuery);
  }
  return NULL;
}

String diReadTask(String portQuery){
  String error = checkPortQuery(portQuery);
  if(error){
    return error;
  }
  uint8_t port = strToInt(portQuery);
  return diRead(port);
}

String diRead(uint8_t port){
  int val = digitalRead(port);
  return okIoJson("OK", port, val);
}

/*
   ai/read/以下が入ってくる.
 */
String aiReadTask(String portQuery){
  String error = checkPortQuery(portQuery);
  if(error){
    return error;
  }
  int port = strToInt(portQuery);
  return aiRead(port);
}

String aiRead(uint8_t port){
  int val = analogRead(port);
  return okIoJson("OK", port, val);
}



/*
   AIリファレンス電圧切替.
 */
String aiRefSwitchTask(String ref){
  int at = 0;
  String error = checkHasQuery(ref, &at);
  if(error){
    return error;
  }

  for(int i = 0; i < ARRAYSIZE(AI_REF_TBL); i++){
    if(ref.endsWith(AI_REF_TBL[i].key)){
      analogReference(AI_REF_TBL[i].value);
      return switchTypeReturnJson("OK", AI_REF_TBL[i].key);
    }
  }
  ref.replace("?type=", "");
  return NgReturnJson("Illegal type.", ref);
}


String streamDiOnTask(String query){

  int at = query.indexOf('?');
  if(at >= 0){
    String portsQuery = query.substring(at + 1);
    if(!isInt(portsQuery)){
      return NgReturnJson("Illegal query.", query);
    }
    di_stream_info.ports = strToUInt64(portsQuery);
  }
  // queryがない場合はportsを変更せずにstreamをenableにする.
  di_stream_info.enabled = true;

  return okStreamJson(di_stream_info.enabled, di_stream_info.ports);
}

String streamDiOffTask(String empty){
  di_stream_info.enabled = false;
  return okStreamJson(di_stream_info.enabled, di_stream_info.ports);
}

String streamAiOnTask(String query){
  int at = query.indexOf('?');
  if(at >= 0){
    String portsQuery = query.substring(at + 1);
    if(!isInt(portsQuery)){
      return NgReturnJson("Illegal query.", query);
    }
    ai_stream_info.ports = strToUInt64(portsQuery);
  }
  // queryがない場合はportsを変更せずにstreamをenableにする.
  ai_stream_info.enabled = true;

  return okStreamJson(ai_stream_info.enabled, ai_stream_info.ports);
}

String streamAiOffTask(String empty){
  ai_stream_info.enabled = false;
  return okStreamJson(ai_stream_info.enabled, ai_stream_info.ports);
}


// シリアルを閉じる.
String closeSerial(String empty){
  Serial.end();
  return "";
}


// スタックオーバーフローにより強制的にリセット
String resetTask(String empty){
  resetTask("");
  return "";
}

/*
   Utility functions.
 */



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

uint64_t strToUInt64(String str){
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

  uint64_t rslt = 0;
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

/*
   JSON変換関連
 */

// portsはDI_STREAM_INFOのportsに合わせてuint64_tにしている
String okStreamJson(bool enabled, uint64_t ports){
  String body = stringJson("msg", "OK") + ","
    + boolJson("enabled", enabled) + ","
    + intJson("ports", ports);

  return wrapBrace(body);
}


String okIoJson(String msg, int port, int val){
  String body = stringJson("msg", msg) + ","
    + intJson("port", port) + ","
    + intJson("val", val);

  return wrapBrace(body);
}


String switchTypeReturnJson(String msg, String refType){
  String body = stringJson("msg", msg) + ","
    + stringJson("type", refType);

  return wrapBrace(body);
}


String NgReturnJson(String err, String hint){
  String body = stringJson("msg", "NG") + ","
    + stringJson("error", err) + ""
    + stringJson("hint", hint);

  return wrapBrace(body);
}

String boolJson(String key, bool value){
  String str = value ? "true" : "false";
  return wrapDq(key) + ":" + str;
}

String intJson(String key, int value){
  return wrapDq(key) + ":" + String(value);
}

String stringJson(String key, String value){
  return wrapDq(key) + ":" + wrapDq(value);
}

/*
   文字列を囲んだりする奴
 */

String wrapBrace(String str){
  return wraped('{', str, '}');
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
