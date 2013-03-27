char read_buf[128];
int buf_index = 0;

void setup() {
  memset(read_buf,0,128);
  Serial.begin(9600);
  Serial.println("READY");
}


/*
DI/DOの設定
di/
do/


AI分解能の設定
DEFAULT: 電源電圧(5V)が基準電圧となります。これがデフォルトです
INTERNAL: 内蔵基準電圧を用います。ATmega168と328Pでは1.1Vです
EXTERNAL: AREFピンに供給される電圧(0V～5V)を基準電圧とします


*/

#define AI_REF_TBL_SIZE  3

const char* AI_REF_TBL[AI_REF_TBL_SIZE] = {
  "DEFAULT",
  "INTERNAL",
  "EXTERNAL"
};
const uint8_t AI_REF_VAL_TBL[] = {
  DEFAULT,
  INTERNAL,
  EXTERNAL
};

void loop() {
  if(Serial.available() > 0){
    while(Serial.available() > 0){
      read_buf[buf_index] = Serial.read();
      if(read_buf[buf_index] == (char)10){
        String msg = String(read_buf);
        msg.trim();
        //Serial.println(msg);
        Serial.println(task(msg));
        buf_index = 0;
        memset(read_buf,0,128);
        break;
      }
      buf_index++;
    }
  }
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

/*
AI
ai/ref?type={TYPE}
ai/read/{port}

AO
ao/write/{port}?val={value}
*/
String task(String msg){
  if(msg.startsWith("ai/")){
    msg.replace("ai/","");
    return aiTask(msg);
  }else if(msg.startsWith("ao/")){
    msg.replace("ao/","");
    return aoTask(msg);
  }
  return String("NG : ") + msg;
}

String aoTask(String ao){
  if(ao.startsWith("write/")){
    ao.replace("write/", "");
    return aoWriteTask(ao);
  }
}

/*
   {port_num}?val={value}
   で入ってくる.
 */
String aoWriteTask(String portWithValue){
  int port = strToInt(portWithValue);
  int at = portWithValue.indexOf('?');
  if(at == -1){
    // queryが指定されていなかったら-1で返す.
    return aoWriteRetuenString("NG", port, -1);
  }
  String valQuery = portWithValue.substring(at + 1);
  if(valQuery.startsWith("val=")){
    valQuery.replace("val=","");
  }else{
    return aoWriteRetuenString("NG", port, -2);
  }
  if(!isInt(valQuery)){
    return aoWriteRetuenString("NG", port, -3);
  }

  int val = strToInt(valQuery);
  analogWrite(port, val);
  return aoWriteRetuenString("OK", port, val);
}

String aoWriteRetuenString(String msg, int port, int val){
  String body = wrapDq("msg") + ":"+wrapDq(msg) + "," + wrapDq("port") + ":" + String(port) + "," + wrapDq("val") + ":" + String(val);

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

String aiTask(String ai){
  if(ai.startsWith("ref?")){
      ai.replace("ref?", "");
      return aiSwitchRef(ai);
  }else if(ai.startsWith("read/")){
    ai.replace("read/", "");
    return aiReadTask(ai);
  }
  return String("NG : ") + ai;
}

String aiReadTask(String port){
  return "";
}


/*
   AIリファレンス電圧切替.
 */
String aiSwitchRef(String ref){
  for(int i = 0; i < AI_REF_TBL_SIZE; i++){
    if(ref.endsWith(AI_REF_TBL[i])){
      analogReference(AI_REF_VAL_TBL[i]);
      return aiSwitchRefReturn("OK", AI_REF_TBL[i]);
    }
  }
  ref.replace("type=", "");
  return aiSwitchRefReturn("NG", ref);
  return String("NG : ai/ref, type=") + ref;
}

String aiSwitchRefReturn(String msg, String refType){
    String body = wrapDq("msg") + ":" + wrapDq(msg) + "," + wrapDq("type") + ":" + wrapDq(refType);
    return wraped('{', body, '}');
}




