#include <avr/pgmspace.h>

#define ARRAYSIZE(array) (sizeof(array) / sizeof(array[0]))

/**************************************************************************
                                型宣言
**************************************************************************/

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

/**************************************************************************
                       ボード毎の違いを吸収するｱﾚ
**************************************************************************/

#if defined(__AVR_ATmega1280__) || defined(__AVR_ATmega2560__) || defined(__AVR_ATmega1284P__) || defined(__AVR_ATmega644P__)
/*******************
  Arduino MEGAとか
*******************/

// A0 - A15
#define AI_MAX_PORT_NUM 16

// D0 - D49
#define DI_MAX_PORT_NUM 50

// AI Reference電圧の名前と値を保持するテーブル.
const struct STR_UINT8_PEAR AI_REF_TBL[] = {
  {"DEFAULT", DEFAULT},
  {"INTERNAL1V1", INTERNAL1V1},
  {"INTERNAL2V56", INTERNAL2V56},
  {"EXTERNAL", EXTERNAL}
};
#else
/*******************
  Arduino Unoとか
*******************/

// A0 - A5
#define AI_MAX_PORT_NUM 6

// D0 - D13
#define DI_MAX_PORT_NUM 14

struct STREAM_INFO {
  uint64_t interval_ms;
  uint64_t counter;
};

volatile struct STREAM_INFO ai_stream_info[AI_MAX_PORT_NUM];
volatile struct STREAM_INFO di_stream_info[DI_MAX_PORT_NUM];

// AI Reference電圧の名前と値を保持するテーブル.
const struct STR_UINT8_PEAR AI_REF_TBL[] = {
  {"DEFAULT", DEFAULT},
  {"INTERNAL", INTERNAL},
  {"EXTERNAL", EXTERNAL}
};

// 24時間のmsec表現

// タイマ割り込み
volatile uint32_t timer2_tcnt2 = 0;

void timer2Start(){
  float prescaler = 0.0;

  TIMSK2 &= ~(1<<TOIE2);
  TCCR2A &= ~((1<<WGM21) | (1<<WGM20));
  TCCR2B &= ~(1<<WGM22);
  ASSR &= ~(1<<AS2);
  TIMSK2 &= ~(1<<OCIE2A);

  if ((F_CPU >= 1000000UL) && (F_CPU <= 16000000UL)) {  // prescaler set to 64
    TCCR2B |= (1<<CS22);
    TCCR2B &= ~((1<<CS21) | (1<<CS20));
    prescaler = 64.0;
  } else if (F_CPU < 1000000UL) { // prescaler set to 8
    TCCR2B |= (1<<CS21);
    TCCR2B &= ~((1<<CS22) | (1<<CS20));
    prescaler = 8.0;
  } else { // F_CPU > 16Mhz,  prescaler set to 128
    TCCR2B |= ((1<<CS22) | (1<<CS20));
    TCCR2B &= ~(1<<CS21);
    prescaler = 128.0;
  }

  timer2_tcnt2 = 256 - (int)((float)F_CPU * 0.001 / prescaler);

  TCNT2 = timer2_tcnt2;
  TIMSK2 |= (1<<TOIE2);
}

void timer2Stop(){
  TIMSK2 &= ~(1<<TOIE2);
}

ISR(TIMER2_OVF_vect) {
  TCNT2 = timer2_tcnt2;

  int i = 0;
  for(; i < AI_MAX_PORT_NUM; ++i){
    ++ai_stream_info[i].counter;
  }
  for(i = 0; i < DI_MAX_PORT_NUM; ++i){
    ++di_stream_info[i].counter;
  }
}
#endif

const prog_char ILLEGAL_COMMAND[] PROGMEM       = "Illegal command.";
const prog_char ILLEGAL_TYPE[] PROGMEM          = "Illegal type.";
const prog_char ILLEGAL_QUERY[] PROGMEM         = "Illegal query.";
const prog_char ILLEGAL_VALUE[] PROGMEM         = "Illegal value.";
const prog_char ILLEGAL_PORT_NUMBER[] PROGMEM   = "Illegal port number.";
const prog_char QUERY_NOT_FOUND[] PROGMEM       = "Query not found.";
const prog_char TYPE_IS_NOT_SPECIFIED[] PROGMEM = "type is not specified.";
const prog_char VAL_IS_NOT_SPECIFIED[] PROGMEM  = "val is not specified.";
const prog_char COMMAND_IS_TOO_LONG[] PROGMEM   = "Command is too long.";


char read_buf[128];
int buf_index = 0;

// DI連続転送の有効・無効を管理する. bitが立っていると有効.
// megaのポート数に対応するため64bitにする.
//uint64_t di_stream_enable_ports = 0;

//uint16_t ai_stream_enable_ports = 0;


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
    format  => stream/di/on/{port}?interval={msec}
    {port}  => 連続転送を有効にするポート番号
    {msec}  => DIポート読み取り間隔(ミリ秒)
    example => stream/di/on/1?interval=1000


   */
  {"stream/di/on/", &streamDiOnTask},

  /*
     DI連続転送OFF
     format => stream/di/off/{port}

     但しstream/di/off/allとやった場合は全てのポートの連続転送がOFFになる
   */
  {"stream/di/off/", &streamDiOffTask},

  /*
    AI連続転送ON
    format   => stream/ai/on/{port}?interval={msec}
    {port} => 連続転送を有効にするポート番号
    {msec}  => AIポート読み取り間隔(ミリ秒)
    example  => stream/ai/on/1
   */
  {"stream/ai/on/", &streamAiOnTask},

  /*
     AI連続転送OFF
     format => stream/ai/off/1

     但しstream/ai/off/allとやった場合は全てのポートの連続転送がOFFになる
   */
  {"stream/ai/off/", &streamAiOffTask},


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

  Serial.begin(115200);
  Serial.println("READY");
  pinMode(13, OUTPUT);
  timer2Start();
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
        Serial.println(NgReturnJson(COMMAND_IS_TOO_LONG));
        // なくなるまで読み捨てる.
        while(Serial.available() > 0){Serial.read();}
        memset(read_buf, 0, ARRAYSIZE(read_buf));
        buf_index = 0;
      }
    }
  }

  for(uint8_t i = 0; i < AI_MAX_PORT_NUM; i++){
    if(ai_stream_info[i].interval_ms){
      if(ai_stream_info[i].counter > ai_stream_info[i].interval_ms){
        ai_stream_info[i].counter = 0;
        Serial.println(wrapEventJson("ai", aiRead(i)));
      }
    }
  }

  for(uint8_t i = 0; i < DI_MAX_PORT_NUM; i++){
    if(di_stream_info[i].interval_ms){
      if(di_stream_info[i].counter > di_stream_info[i].interval_ms){
        di_stream_info[i].counter = 0;
        Serial.println(wrapEventJson("di", diRead(i)));
      }
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
  return NgReturnJson(ILLEGAL_COMMAND);
}

String switchPinModeTask(String portWithQuery){

  String valQuery;
  uint8_t port;

  String error = checkPortWithQuery(portWithQuery, &port, &valQuery);

  if(error){
    return error;
  }

  if(valQuery.startsWith("type=")){
    valQuery.replace("type=", "");
  }else{
    return NgReturnJson(TYPE_IS_NOT_SPECIFIED);
  }

  for(int i = 0; i < ARRAYSIZE(PIN_MODE_TBL); i++){
    if(valQuery == PIN_MODE_TBL[i].key){
      pinMode(port, PIN_MODE_TBL[i].value);
      return switchTypeReturnJson("OK", valQuery);
    }
  }
  return NgReturnJson(ILLEGAL_TYPE);
}

String checkHasQuery(String query, int *at){
  *at = query.indexOf('?');
  if(*at == -1){
    // queryが指定されていなかったら-1で返す.
    return NgReturnJson(QUERY_NOT_FOUND);
  }
  return NULL;
}

String checkPortWithQuery(String portWithQuery, uint8_t *port, String *query){

  int at = 0;
  String error = checkHasQuery(portWithQuery, &at);
  if(error){
    return error;
  }

  String portQuery = portWithQuery.substring(0, at);
  if(!isInt(portQuery)){
    return NgReturnJson(ILLEGAL_PORT_NUMBER);
  }
  *port = strToInt(portQuery);
  *query = portWithQuery.substring(at + 1);

  return NULL;
}


// {port}?interval={msec}なクエリーを分解.
String checkPortWithInterval(String portWithInterval, uint8_t *port, uint64_t *interval){

  String intervalQuery;

  String error = checkPortWithQuery(portWithInterval, port, &intervalQuery);
  if(error){
    return error;
  }

  // intervalが指定されていなかったらintervalを1にする.
  if(intervalQuery.startsWith("interval=")){
    intervalQuery.replace("interval=", "");
    // intervalに整数以外が指定されていたらエラー
    if(isInt(intervalQuery)){
      *interval = strToUInt64(intervalQuery);
      // 0はサンプリング停止なので1に書き換える.
      if(*interval == 0){
        *interval = 1;
      }
    }else{
      return NgReturnJson(ILLEGAL_VALUE);
    }
  }else{
    *interval = 1;
  }
  return NULL;
}

String checkPortWithValue(String portWithValue, uint8_t *port, int *val){

  String valQuery;

  String error = checkPortWithQuery(portWithValue, port, &valQuery);

  if(error){
    return error;
  }

  if(valQuery.startsWith("val=")){
    valQuery.replace("val=","");
  }else{
    return NgReturnJson(VAL_IS_NOT_SPECIFIED);
  }

  // HIGH, LOWのチェックはdoWriteTask用
  if(valQuery == "HIGH"){
    *val = 1;
  }else if(valQuery == "LOW"){
    *val = 0;
  }else if(isInt(valQuery)){
    *val = strToInt(valQuery);
  }else{
    return NgReturnJson(ILLEGAL_VALUE);
  }

  return NULL;
}

/*
   {port_num}?val={value}
   で入ってくる.
 */
String aoWriteTask(String portWithValue){
  uint8_t port = 0;
  int val = 0;

  String error = checkPortWithValue(portWithValue, &port, &val);
  if(error){
    return error;
  }

  analogWrite(port, val);
  return okIoJson(port, val);
}


String doWriteTask(String portWithValue){
  uint8_t port = 0;
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
  return okIoJson(port, val);
}


String checkPortQuery(String portQuery){
  if(!isInt(portQuery)){
    return NgReturnJson(ILLEGAL_PORT_NUMBER);
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
  return okIoJson(port, val);
}

/*
   ai/read/以下が入ってくる.
 */
String aiReadTask(String portQuery){
  String error = checkPortQuery(portQuery);
  if(error){
    return error;
  }
  uint8_t port = strToInt(portQuery);
  return aiRead(port);
}

String aiRead(uint8_t port){
  int val = analogRead(port);
  return okIoJson(port, val);
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
  return NgReturnJson(ILLEGAL_TYPE);
}


String streamDiOnTask(String portWithInterval){

  uint64_t interval;
  uint8_t port;

  String error = checkPortWithInterval(portWithInterval, &port, &interval);
  if(error){
    return error;
  }

  if(port >= DI_MAX_PORT_NUM){
    return NgReturnJson(ILLEGAL_PORT_NUMBER);
  }

  di_stream_info[port].interval_ms = interval;
  di_stream_info[port].counter = 0;

  // TODO: stream用のレスポンスを考える.
  return okIoJson(port, 1);
}

String streamDiOffTask(String query){

  if(query == "all"){
    for(uint8_t i = 0; i < DI_MAX_PORT_NUM; i++){
      di_stream_info[i].interval_ms = 0;
    }
    return okIoJson(0xff, 0);
  }

  String error = checkPortQuery(query);
  if(error){
    return error;
  }

  uint8_t port = strToInt(query);
  if(port >= DI_MAX_PORT_NUM){
    return NgReturnJson(ILLEGAL_PORT_NUMBER);
  }
  di_stream_info[port].interval_ms = 0;

  return okIoJson(port, 0);
}

String streamAiOnTask(String portWithInterval){

  uint64_t interval;
  uint8_t port;

  String error = checkPortWithInterval(portWithInterval, &port, &interval);
  if(error){
    return error;
  }

  if(port >= AI_MAX_PORT_NUM){
    return NgReturnJson(ILLEGAL_PORT_NUMBER);
  }

  ai_stream_info[port].interval_ms = interval;
  ai_stream_info[port].counter = 0;

  return okIoJson(port, 1);
}

String streamAiOffTask(String query){

  if(query == "all"){
    for(uint8_t i = 0; i < AI_MAX_PORT_NUM; i++){
      ai_stream_info[i].interval_ms = 0;
    }
    return okIoJson(0xff, 0);
  }

  String error = checkPortQuery(query);
  if(error){
    return error;
  }

  uint8_t port = strToInt(query);
  if(port >= AI_MAX_PORT_NUM){
    return NgReturnJson(ILLEGAL_PORT_NUMBER);
  }
  ai_stream_info[port].interval_ms = 0;

  return okIoJson(port, 0);
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



String okIoJson(uint8_t port, uint8_t val){
  String body = stringJson("msg", "OK") + ","
    + intJson("port", port) + ","
    + intJson("val", val);

  return wrapBrace(body);
}


/*

   {"event":"[type]", "data":{"msg":"OK", , , , }}

   的なjsonを作る.
 */
String wrapEventJson(String type, String dataJson){
  String body = stringJson("event", type) + ","
          + wrapDq("data") + ":" + dataJson;
  return wrapBrace(body);
}


String switchTypeReturnJson(String msg, String refType){
  String body = stringJson("msg", msg) + ","
    + stringJson("type", refType);

  return wrapBrace(body);
}


String NgReturnJson(const prog_char *err){
  char buf[60] = {0};
  strcpy_P(buf, err);
  String body = stringJson("msg", "NG") + ","
    + stringJson("error", buf);

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
