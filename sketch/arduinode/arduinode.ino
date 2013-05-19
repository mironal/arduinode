#include <avr/pgmspace.h>

#define ARRAYSIZE(array) (sizeof(array) / sizeof(array[0]))

#define RESULT_MSG_PTR &result_msg_buf[0]

/**************************************************************************
                                型宣言
**************************************************************************/

// 各々のコマンドに対して処理を行う関数の型
typedef char* (*TASK_FUNC_PTR)(String str);

typedef void (*VOID_FUNC_PTR)(void);

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

// streamの転送間隔と時間計測に使用するカウンターの構造体.
struct STREAM_INFO {
  uint64_t interval_ms;
  uint64_t counter;
};

/**************************************************************************
                       ボード毎の違いを吸収するｱﾚ
**************************************************************************/
// Arduion Uno       : ATmega328P
// Arduino ADK       : ATmega2560
// Arduino Mega 2560 : ATmega2560
// Arduino 古いやつ  : ATmega168
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

volatile uint32_t interrupt_counter[6] = {0};

void interrupt0(void){
  ++interrupt_counter[0];
}
void interrupt1(void){
  ++interrupt_counter[1];
}
void interrupt2(void){
  ++interrupt_counter[2];
}
void interrupt3(void){
  ++interrupt_counter[3];
}
void interrupt4(void){
  ++interrupt_counter[4];
}
void interrupt5(void){
  ++interrupt_counter[5];
}

const VOID_FUNC_PTR INTERRUPT_FUNC_TBL[] = {
  interrupt0,
  interrupt1,
  interrupt2,
  interrupt3,
  interrupt4,
  interrupt5,
};

#else
/*******************
  Arduino Unoとか
*******************/

// A0 - A5
#define AI_MAX_PORT_NUM 6

// D0 - D13
#define DI_MAX_PORT_NUM 14


// AI Reference電圧の名前と値を保持するテーブル.
const struct STR_UINT8_PEAR AI_REF_TBL[] = {
  {"DEFAULT", DEFAULT},
  {"INTERNAL", INTERNAL},
  {"EXTERNAL", EXTERNAL}
};

volatile uint32_t interrupt_counter[2] = {0};
void interrupt0(void){
  ++interrupt_counter[0];
}

void interrupt1(void){
  ++interrupt_counter[1];
}

const VOID_FUNC_PTR INTERRUPT_FUNC_TBL[] = {
  interrupt0,
  interrupt1,
};

#endif

const struct STR_UINT8_PEAR INTERRUPT_MODE_TBL[] = {
  {"LOW", LOW},
  {"CHANGE", CHANGE},
  {"RISING", RISING},
  {"FALLING", FALLING}
};

const prog_char ILLEGAL_COMMAND[] PROGMEM       = "Illegal command.";
const prog_char ILLEGAL_TYPE[] PROGMEM          = "Illegal type.";
const prog_char ILLEGAL_QUERY[] PROGMEM         = "Illegal query.";
const prog_char ILLEGAL_VALUE[] PROGMEM         = "Illegal value.";
const prog_char ILLEGAL_INTR_NUMBER[] PROGMEM   = "Illegal interrupt number.";
const prog_char ILLEGAL_PORT_NUMBER[] PROGMEM   = "Illegal port number.";
const prog_char QUERY_NOT_FOUND[] PROGMEM       = "Query not found.";
const prog_char TYPE_IS_NOT_SPECIFIED[] PROGMEM = "type is not specified.";
const prog_char VAL_IS_NOT_SPECIFIED[] PROGMEM  = "val is not specified.";
const prog_char COMMAND_IS_TOO_LONG[] PROGMEM   = "Command is too long.";

const prog_char JSON_FORMAT_NG[] PROGMEM               = "{\"msg\":\"NG\",\"error\":\"%s\"}";
const prog_char JSON_FORMAT_SWITCH_TYPE[] PROGMEM      = "{\"msg\":\"OK\",\"type\":\"%s\"}";
const prog_char JSON_FORMAT_WRAP_EVENT[] PROGMEM       = "{\"event\":\"%s\",\"data\":%s}";
const prog_char JSON_FORMAT_INTERRUPT[] PROGMEM        = "{\"msg\":\"OK\",\"num\":%d,\"count\":%d}";
const prog_char JSON_FORMAT_ATTACH_INTERRUPT[] PROGMEM = "{\"msg\":\"OK\",\"num\":%d,\"mode\":\"%s\"}";
const prog_char JSON_FORMAT_DETACH_INTERRUPT[] PROGMEM = "{\"msg\":\"OK\",\"num\":%d}";
const prog_char JSON_FORMAT_IO[] PROGMEM               = "{\"msg\":\"OK\",\"port\":%d,\"val\":%d}";
const prog_char JSON_FORMAT_READY[] PROGMEM            = "{\"msg\":\"READY\"}";

// リクエスト受信バッファ
char read_buf[128];
int buf_index = 0;

// レスポンスバッファ
char result_msg_buf[128];

volatile struct STREAM_INFO ai_stream_info[AI_MAX_PORT_NUM];
volatile struct STREAM_INFO di_stream_info[DI_MAX_PORT_NUM];

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
     format  => a/read/{port}
     {port}  => port number.
     example => a/read/0
   */
  {"a/read/", &aiReadTask},

  /*
    Switch AI reference volt.
    format  => a/ref?type={TYPE}
    {TYPE}  => DEFAULT | INTERNAL | EXTERNAL
    example => a/ref?type=INTERNAL
   */
  {"a/ref", &aiRefSwitchTask},

  /*
     Write AO port.
     format  => a/write/{port}?val={val}
     {port}  => port number.
     {val}   => write value.
     example => a/write/1?val=100
   */
  {"a/write/", &aoWriteTask},

  /*
     Read DI port.
     format  => d/read/{port}
     {port}  => port number.
     example => d/read/2
   */
  {"d/read/", &diReadTask},


  /*
     Write DO port.
     format  => d/write/{port}?val={val}
     {port}  => port number.
     {val}   => write value. or HIGH | LOW
     example => d/write/3?val=1
     example => d/write/3?val=HIGH
   */
  {"d/write/", &doWriteTask},

  /*
     Swith digital pin mode.
     format  => d/mode/{port}?type={type}
     {port}  => port number.
     {type}  => INPUT | OUTPUT | INPUT_PULLUP
     example => d/mode/3?type=INPUT
   */
  {"d/mode/", &switchPinModeTask},


  /*
     attachInterrupt
     format  => d/int/on/{num}?type={type}
     {num}   => number of interrupt.
     {type}  => LOW | CHANGE | RISING | FALLING
     example => d/int/on/0?type=LOW

     LOW ピンがLOWのとき発生
     CHANGE ピンの状態が変化したときに発生
     RISING ピンの状態がLOWからHIGHに変わったときに発生
     FALLING ピンの状態がHIGHからLOWに変わったときに発生

     // TODO: typeじゃなくてmodeにしたい
   */
  {"d/int/on/", &attachInterruptTask},


  /*
     detachInterrupt
     format  => d/int/off/{num}
     {num}   => number of interrupt.
     example => d/int/off/0
   */
  {"d/int/off/", &detachInterruptTask},

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
    Reset arduino.
    node-serialportではDTR信号の制御が出来ない(多分)ため
    関数内でスタックオーバーフローを発生させることで強制的にリセットをかける。
    リセットかけるとnode.jsが終了しない不具合を解決することが出来る。

    format => system/reset
   */
  {"system/reset", &resetTask}

};

bool standby = true;

void setup() {
  buf_index = 0;
  memset(read_buf,0,128);
  standby = true;
  Serial.begin(115200);
  timer2Start();
}


void loop() {
  if(standby){
    // Mega ADKの場合、delayを入れないとメッセージをnode側で受信できない.
    // 原因不明
    delay(100);
    Serial.println(initJson());
    standby = false;
  }

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

  for(uint8_t i = 0; i < ARRAYSIZE(interrupt_counter); i++){
    if(interrupt_counter[i] > 0){
      Serial.println(wrapEventJson("int", interruptJson(i, interrupt_counter[i])));
      interrupt_counter[i] = 0;
    }
  }

}


char* task(String msg){
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

char* switchPinModeTask(String portWithQuery){

  String valQuery;
  uint8_t port;

  char* error = checkPortWithQuery(portWithQuery, &port, &valQuery);

  if(error){
    return error;
  }

  error = checkPortRange(port);
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
      char buf[16] = {0};
      valQuery.toCharArray(buf, ARRAYSIZE(buf));
      return switchTypeReturnJson(buf);
    }
  }
  return NgReturnJson(ILLEGAL_TYPE);
}


/*
   {port_num}?val={value}
   で入ってくる.
 */
char* aoWriteTask(String portWithValue){
  uint8_t port = 0;
  int val = 0;

  char* error = checkPortWithValue(portWithValue, &port, &val);
  if(error){
    return error;
  }

  error = checkPortRange(port);
  if(error){
    return error;
  }

  analogWrite(port, val);
  return okIoJson(port, val);
}


char* doWriteTask(String portWithValue){
  uint8_t port = 0;
  int val = 0;

  char* error = checkPortWithValue(portWithValue, &port, &val);
  if(error){
    return error;
  }

  error = checkPortRange(port);
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


char* diReadTask(String portQuery){
  char* error = checkPortQuery(portQuery);
  if(error){
    return error;
  }
  uint8_t port = strToInt(portQuery);

  error = checkPortRange(port);
  if(error){
    return error;
  }

  return diRead(port);
}

char* diRead(uint8_t port){
  uint8_t val = digitalRead(port);
  return okIoJson(port, val);
}

/*
   ai/read/以下が入ってくる.
 */
char* aiReadTask(String portQuery){
  char* error = checkPortQuery(portQuery);
  if(error){
    return error;
  }
  uint8_t port = strToInt(portQuery);


  error = checkPortRange(port);
  if(error){
    return error;
  }

  return aiRead(port);
}

char* aiRead(uint8_t port){
  uint16_t val = analogRead(port);
  return okIoJson(port, val);
}


/*
   AIリファレンス電圧切替.
 */
char* aiRefSwitchTask(String ref){
  int at = 0;
  char* error = checkHasQuery(ref, &at);
  if(error){
    return error;
  }

  for(int i = 0; i < ARRAYSIZE(AI_REF_TBL); i++){
    if(ref.endsWith(AI_REF_TBL[i].key)){
      analogReference(AI_REF_TBL[i].value);
      return switchTypeReturnJson(AI_REF_TBL[i].key);
    }
  }
  ref.replace("?type=", "");
  return NgReturnJson(ILLEGAL_TYPE);
}


char* streamDiOnTask(String portWithInterval){

  uint64_t interval;
  uint8_t port;

  char* error = checkPortWithInterval(portWithInterval, &port, &interval);
  if(error){
    return error;
  }

  error = checkPortRange(port);
  if(error){
    return error;
  }

  di_stream_info[port].interval_ms = interval;
  di_stream_info[port].counter = 0;

  // TODO: stream用のレスポンスを考える.
  return okIoJson(port, 1);
}

char* streamDiOffTask(String query){

  if(query == "all"){
    for(uint8_t i = 0; i < DI_MAX_PORT_NUM; i++){
      di_stream_info[i].interval_ms = 0;
    }
    return okIoJson(0xff, 0);
  }

  char* error = checkPortQuery(query);
  if(error){
    return error;
  }

  uint8_t port = strToInt(query);
  error = checkPortRange(port);
  if(error){
    return error;
  }

  di_stream_info[port].interval_ms = 0;

  return okIoJson(port, 0);
}

char* streamAiOnTask(String portWithInterval){

  uint64_t interval;
  uint8_t port;

  char* error = checkPortWithInterval(portWithInterval, &port, &interval);
  if(error){
    return error;
  }

  error = checkPortRange(port);
  if(error){
    return error;
  }

  ai_stream_info[port].interval_ms = interval;
  ai_stream_info[port].counter = 0;

  return okIoJson(port, 1);
}

char* streamAiOffTask(String query){

  if(query == "all"){
    for(uint8_t i = 0; i < AI_MAX_PORT_NUM; i++){
      ai_stream_info[i].interval_ms = 0;
    }
    return okIoJson(0xff, 0);
  }

  char* error = checkPortQuery(query);
  if(error){
    return error;
  }

  uint8_t port = strToInt(query);
  error = checkPortRange(port);
  if(error){
    return error;
  }

  ai_stream_info[port].interval_ms = 0;

  return okIoJson(port, 0);
}


/*
   LOWは何も繋げていないと大量に割込が入ってくるので注意
*/
char* attachInterruptTask(String queryWithType){

  char type[16 + 1] = {0};
  uint8_t num = 0;

  char* error = checkPortWithType(queryWithType, &num, &type[0]);
  if(error){
    return error;
  }

  error = checkInterruptRange(num);
  if(error){
    return error;
  }

  for(uint8_t i = 0; i < ARRAYSIZE(INTERRUPT_MODE_TBL); i++){
    if(strcmp(type, INTERRUPT_MODE_TBL[i].key) == 0){
      attachInterrupt(num, INTERRUPT_FUNC_TBL[num], INTERRUPT_MODE_TBL[i].value);
      return okAttachInterruptJson(num, i);
    }
  }

  return NgReturnJson(ILLEGAL_TYPE);
}

char* detachInterruptTask(String queryWithPort){

  char* error = checkPortQuery(queryWithPort);
  if(error){
    return error;
  }

  uint8_t num = strToInt(queryWithPort);

  error = checkInterruptRange(num);
  if(error){
    return error;
  }

  detachInterrupt(num);
  return okDetachInterruptJson(num);
}

// スタックオーバーフローにより強制的にリセット
char* resetTask(String empty){
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


char* initJson(){
  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_READY);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf
      );

  return RESULT_MSG_PTR;
}

char* okIoJson(uint8_t port, uint16_t val){

  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_IO);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      port,
      val);

  return RESULT_MSG_PTR;
}

char* okAttachInterruptJson(uint8_t num, uint8_t mode){

  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_ATTACH_INTERRUPT);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      num,
      INTERRUPT_MODE_TBL[mode].key);
  return RESULT_MSG_PTR;
}

char* okDetachInterruptJson(uint8_t num){
  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_DETACH_INTERRUPT);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      num);
  return RESULT_MSG_PTR;
}

char* interruptJson(uint8_t num, uint32_t count){

  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_INTERRUPT);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      num,
      count);
  return RESULT_MSG_PTR;
}


/*

   {"event":"[type]", "data":{"msg":"OK", , , , }}

   的なjsonを作る.
 */
char* wrapEventJson(char* type, char* dataJson){
  // 同じバッファを参照してしまうので、一旦コピーする.
  char buf[64] = {0};
  strcpy(buf, dataJson);

  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_WRAP_EVENT);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      type,
      buf);
  return RESULT_MSG_PTR;
}


char* switchTypeReturnJson(char* refType){

  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_SWITCH_TYPE);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      refType);

  return RESULT_MSG_PTR;
}


char* NgReturnJson(const prog_char *err){
  char buf[30] = {0};
  strcpy_P(buf, err);

  char format_buf[64] = {0};
  strcpy_P(format_buf, JSON_FORMAT_NG);

  snprintf(result_msg_buf, ARRAYSIZE(result_msg_buf),
      format_buf,
      buf);

  return RESULT_MSG_PTR;
}

/*
   queryのエラーチェックを行う奴
 */


char* checkHasQuery(String query, int *at){
  *at = query.indexOf('?');
  if(*at == -1){
    // queryが指定されていなかったら-1で返す.
    return NgReturnJson(QUERY_NOT_FOUND);
  }
  return NULL;
}

char* checkPortQuery(String portQuery){
  if(!isInt(portQuery)){
   return NgReturnJson(ILLEGAL_PORT_NUMBER);
  }
  return NULL;
}

char* checkPortWithQuery(String portWithQuery, uint8_t *port, String *query){

  int at = 0;
  char* error = checkHasQuery(portWithQuery, &at);
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
char* checkPortWithInterval(String portWithInterval, uint8_t *port, uint64_t *interval){

  String intervalQuery;

  char* error = checkPortWithQuery(portWithInterval, port, &intervalQuery);
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

// {port}?type={type string}なqueryを分解.
// typeのバッファに16文字コピーを行うので、
// typeのバッファサイズは16以上にすること。
// またtypeの文字列は16文字未満の文字列とすること.
char* checkPortWithType(String portWithType, uint8_t *port, char *type){
  String typeQuery;

  char* error = checkPortWithQuery(portWithType, port, &typeQuery);
  if(error){
    return error;
  }

  if(typeQuery.startsWith("type=")){
    typeQuery.replace("type=", "");
    if(typeQuery.length() > 16){
      return NgReturnJson(ILLEGAL_QUERY);
    }
    typeQuery.toCharArray(type, 16);
  }else{
    return NgReturnJson(ILLEGAL_QUERY);
  }
  return NULL;
}

char* checkPortWithValue(String portWithValue, uint8_t *port, int *val){

  String valQuery;

  char* error = checkPortWithQuery(portWithValue, port, &valQuery);

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
 * ポート番号の範囲をチェック.
 * analogポートの数とdigitalポートの数の和を超えていたらエラー.
 * analogWriteはdigitalポートを使ったり
 * analogポートををDigital出力に使用することもできるので、
 * そのあたりに対応するために緩いチェックを行う.
 */
char* checkPortRange(uint8_t port){
  if(port < (AI_MAX_PORT_NUM + DI_MAX_PORT_NUM)){
    return NULL;
  }
  return NgReturnJson(ILLEGAL_PORT_NUMBER);
}

char* checkInterruptRange(uint8_t num){
  if(num >= ARRAYSIZE(INTERRUPT_FUNC_TBL)){
    return NgReturnJson(ILLEGAL_INTR_NUMBER);
  }
  return NULL;
}

/**************************************************************************
                        タイマ割り込みに関するｱﾚ
**************************************************************************/

volatile uint32_t timer2_tcnt2 = 0;

void timer2Start(){
  float prescaler = 0.0;
#if defined (__AVR_ATmega168__) || defined (__AVR_ATmega328P__) || defined(__AVR_ATmega1280__) || defined (__AVR_ATmega2560__)
  TIMSK2 &= ~(1<<TOIE2);
  TCCR2A &= ~((1<<WGM21) | (1<<WGM20));
  TCCR2B &= ~(1<<WGM22);
  ASSR &= ~(1<<AS2);
  TIMSK2 &= ~(1<<OCIE2A);

  if ((F_CPU >= 1000000UL) && (F_CPU <= 16000000UL)) {  // prescaler set to 64
    TCCR2B |= (1<<CS22);
    TCCR2B &= ~((1<<CS21) | (1<<CS20));
    prescaler = 64.0;
  } else if (F_CPU < 1000000UL) {  // prescaler set to 8
    TCCR2B |= (1<<CS21);
    TCCR2B &= ~((1<<CS22) | (1<<CS20));
    prescaler = 8.0;
  } else { // F_CPU > 16Mhz, prescaler set to 128
    TCCR2B |= ((1<<CS22) | (1<<CS20));
    TCCR2B &= ~(1<<CS21);
    prescaler = 128.0;
  }

  timer2_tcnt2 = 256 - (int)((float)F_CPU * 0.001 / prescaler);

  TCNT2 = timer2_tcnt2;
  TIMSK2 |= (1<<TOIE2);
#endif
}

void timer2Stop(){
#if defined (__AVR_ATmega168__) || defined (__AVR_ATmega328P__) || defined(__AVR_ATmega1280__) || defined (__AVR_ATmega2560__)
  TIMSK2 &= ~(1<<TOIE2);
#endif
}

ISR(TIMER2_OVF_vect) {
  TCNT2 = timer2_tcnt2;
  // MEGAとかだとシリアル読みこぼしが発生するので、ここで割り込みを許可しておく.
  sei();

  int i = 0;
  for(; i < AI_MAX_PORT_NUM; ++i){
    ++ai_stream_info[i].counter;
  }
  for(i = 0; i < DI_MAX_PORT_NUM; ++i){
    ++di_stream_info[i].counter;
  }
}

