//ESP32 Dev Module
#include "Arduino.h"
#include "DHTesp.h"
#include <Wire.h>
#include <Ticker.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <Firebase_ESP_Client.h>
#include "string.h"
#include <TimeLib.h>
#include <LittleFS.h>
//Provide the token generation process info.
#include <addons/TokenHelper.h>

// กำหนดขาของ DHT22
#define DHT_PIN 15 //pin 15
#define BH1750_ADDR  (0x5C) //RX
#define I2C_SDA_PIN  (21) //pin 21 green
#define I2C_SCL_PIN  (22) //pin 22 blue

#define DATABASE_URL "https://farmself-1beda-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define API_KEY "AIzaSyBg-VCiyYgtsqYAViFtxjD6lQmjLHSFdi8"
#define USER_EMAIL "s6304062636286@email.kmutnb.ac.th"
#define USER_PASSWORD "0923753720cs"
// #define USERID "J9cXVBN6KpOgwkdUBPKf5nQsSpJ2"
DHTesp dht;
Ticker tempTicker;
FirebaseData fbdo,fdbo_sut1h,fdbo_sut1m,fdbo_sut2h,fdbo_sut2m,fdbo_susoilt,fdbo_suluxt,fdbo_suls,fdbo_sups,fdbo_sdfc;
FirebaseAuth auth;
FirebaseConfig config;
AsyncWebServer server(80);
// กำหนดขาของเซ็นเซอร์ความชืนในดิน
const int soilMoisturePin = 34; // pin 34
const int relayPumpPin = 18; // ตั้งค่า pin ของ Relay สำหรับปั้มน้ำ
const int relayLightPin = 19; // ตั้งค่า pin ของ Relay สำหรับไฟ
int soilMoisture =0;
float humidity = 0;
float temperature = 0;
// Read light level from BH1750
uint16_t lux;
bool signupOK = false;
unsigned long sendDataPrevMillis = 0;
//Setwifi
String stationSSID = "IPHONE";//I PHONE
String stationPassword= "123456789";
const char* AP_ssid="ESP32AP";
const char* AP_password ="1234567890";
bool check_status_wifi = false;
const char* ntpServer = "asia.pool.ntp.org"; // เซิร์ฟเวอร์ NTP ในภูมิภาคเอเชีย
int timezone = 7 * 3600;
const char* TZ_INFO = "ICT7";
String  pumpstatus = "1"; // สถานะ (1: เปิด, 0: ปิด)
String  lightstatus = "1";
//user setting
String  user_pumpstatus = "0"; // สถานะของปั้มจากผู้ใช้ (1: เปิด, 0: ปิด)
String  user_lightstatus = "0";//สถานะของไฟจากผู้ใช้ (1: เปิด, 0: ปิด)
int user_moistureThreshold;
uint16_t user_luxThreshold;
struct usertime{
  int user_hr;
  int user_min;
};
usertime time1,time2;
int timestamp;
int Time_i= 12; // ส่งทุก 1 นาที 
String first_check ="0";

void Firebase_SET(){
  if (Firebase.ready() && (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0)){
    sendDataPrevMillis = millis();
    Time_i++;
    Serial.printf(" Time_i: %d\n",Time_i);
    //Temperature
    if (Firebase.RTDB.setFloat(&fbdo, "Data/Temperature", temperature)){
      Serial.printf("PASSED temperature: %.2f\n", temperature);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
        Serial.println("Attempting to reconnect to Firebase...");
        Firebase.reconnectWiFi(true);
      }
    }
    //Humidity
    if (Firebase.RTDB.setFloat(&fbdo, "Data/Humidity", humidity)){
      Serial.printf("PASSED humidity: %.2f\n",humidity);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Firebase.reconnectWiFi(true); 
      }
    }
    //soilMoisture
    if (Firebase.RTDB.setFloat(&fbdo, "Data/Soilmoisture", soilMoisture)){
      Serial.printf("PASSED soilMoisture: %.2f\n",soilMoisture);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
        Firebase.reconnectWiFi(true);
      }
    }
    //Lux
    if (Firebase.RTDB.setInt(&fbdo, "Data/Lux", lux)){
      Serial.printf("PASSED lux: %u\n", lux);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
        Serial.println("Attempting to reconnect to Firebase...");
        Firebase.reconnectWiFi(true);
      }
    }
    //pumpstatus
    if (Firebase.RTDB.setString(&fbdo, "Data/Pumpstatus", pumpstatus)){
      Serial.printf("PASSED pumpstatus: %s\n", pumpstatus);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
        Serial.println("Attempting to reconnect to Firebase...");
        Firebase.reconnectWiFi(true);
      }
    }
    //lightstatus
    if (Firebase.RTDB.setString(&fbdo, "Data/Lightstatus", lightstatus)){
      Serial.printf("PASSED lightstatus: %s\n", lightstatus);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
        Serial.println("Attempting to reconnect to Firebase...");
        Firebase.reconnectWiFi(true);
      }
    }
    //first_check 
    if (Firebase.RTDB.setString(&fbdo, "Data/Firstcheck", first_check)){
      Serial.printf("PASSED first_check: %s\n", first_check);
    }
    else {
      Serial.println(fbdo.errorReason());
      if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
        Serial.println("Attempting to reconnect to Firebase...");
        Firebase.reconnectWiFi(true);
      }
    }
    Serial.println("Complete");
  }
  //Timestamp
  if(Time_i >= 12){
    Serial.println("Timestamp");
    if (Firebase.RTDB.setFloat(&fbdo, "Log/"+String(timestamp)+"/Temperature", temperature)){
    Serial.printf("PASSED temperature: %.2f\n", temperature);
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    }
    //Humidity
    if (Firebase.RTDB.setFloat(&fbdo, "Log/"+String(timestamp)+"/Humidity", humidity)){
      Serial.printf("PASSED humidity: %.2f\n",humidity);
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    } 
    //soilMoisture
    if (Firebase.RTDB.setFloat(&fbdo, "Log/"+String(timestamp)+"/Soilmoisture", soilMoisture)){
      Serial.printf("PASSED soilMoisture: %.2f\n",soilMoisture);
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    } 
    //Lux
    if (Firebase.RTDB.setInt(&fbdo, "Log/"+String(timestamp)+"/Lux", lux)){
      Serial.printf("PASSED lux: %u\n", lux);
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    }
    //Time
    if (Firebase.RTDB.setString(&fbdo, "Log/"+String(timestamp)+"/Timestamp", String(timestamp))){
      Serial.printf("PASSED timestamp: %u\n", String(timestamp));
    }
    else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    }
    Time_i=0;
    Serial.println("Complete log");
  }
}

void Firebase_GET(){
  //9 GET
  //time 1 hour 
  if (Firebase.RTDB.readStream(&fdbo_sut1h)) {
    if(fdbo_sut1h.streamAvailable()){
      time1.user_hr = fdbo_sut1h.intData();
      Serial.print("time 1 hour: ");
      Serial.println(time1.user_hr);
    }
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
  //time 1 minute 
  if (Firebase.RTDB.readStream(&fdbo_sut1m)) {
    if(fdbo_sut1m.streamAvailable()){
      time1.user_min = fdbo_sut1m.intData();
      Serial.print("time 1 min: ");
      Serial.println(time1.user_min);
    }
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
  //time 2 hour 
  if (Firebase.RTDB.readStream(&fdbo_sut2h)) {
    if(fdbo_sut2h.streamAvailable()){
      time2.user_hr = fdbo_sut2h.intData();
      Serial.print("time 2 hour: ");
      Serial.println(time2.user_hr);
    }
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
  //time 2 minute 
  if (Firebase.RTDB.readStream(&fdbo_sut2m)) {
    if(fdbo_sut2m.streamAvailable()){
      time2.user_min = fdbo_sut2m.intData();
      Serial.print("time 2 min: ");
      Serial.println(time2.user_min);;
    }
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
  //user_moistureThreshold 
  if (Firebase.RTDB.readStream(&fdbo_susoilt)) {
     if(fdbo_susoilt.streamAvailable()){
      user_moistureThreshold = fdbo_susoilt.intData();
      Serial.print("user_moistureThreshold: ");
      Serial.println(user_moistureThreshold);
    }
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
  //user_lixtureThreshold 
  if (Firebase.RTDB.readStream(&fdbo_suluxt)) {
    if(fdbo_suluxt.streamAvailable()){
      user_luxThreshold = fdbo_suluxt.intData();
      Serial.print("user_luxThreshold: ");
      Serial.println(user_luxThreshold);
    } 
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
  //first_check 
  if (Firebase.RTDB.readStream(&fdbo_sdfc)){
    if(fdbo_sdfc.streamAvailable()){
      first_check = fdbo_sdfc.stringData().c_str();
     Serial.printf("first_check %s\n", first_check);
    } 
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  } 
  //lightStatus 
  if (Firebase.RTDB.readStream(&fdbo_suls)) {
    if(fdbo_suls.streamAvailable()){
      user_lightstatus = fdbo_suls.stringData().c_str();
      Serial.print("LightStatus: ");
      Serial.println(user_lightstatus);
    } 
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
     Firebase.reconnectWiFi(true);
    }
  }
    //PumpStatus 
  if (Firebase.RTDB.readStream(&fdbo_sups)) {
    if(fdbo_sups.streamAvailable()){
      user_pumpstatus = fdbo_sups.stringData().c_str();
      Serial.print("PumpStatus: ");
      Serial.println(user_pumpstatus);;
    } 
  }
  else {
    Serial.println(fbdo.errorReason());
    if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
      Serial.println("Attempting to reconnect to Firebase...");
      Firebase.reconnectWiFi(true);
    }
  }
}



bool BH1750_read( uint8_t addr, uint16_t *lux ){
  uint8_t buf[2];
  *lux = 0.0;
  Wire.beginTransmission( addr ); // send the addr/write byte
  // One-shot, Hi-Resolution Mode (1 Lux Resolution) 
  Wire.write( 0x20 ); // send the instruction to start measurement
  if( Wire.endTransmission() > 0 ) {
    Serial.println( "No response from the device!" );
    return false;
  }
  delay(150); // wait at least 150 msec.
  Wire.requestFrom( addr, 2, true );
  if ( Wire.available() == 2 ) {
    buf[0] = Wire.read(); 
    buf[1] = Wire.read(); 
  } else {
    return false;
  }
  uint32_t value = buf[0];
  value  = (value << 8) | buf[1];
  value /= 1.2; // convert raw data to Lux
  *lux = value;
  return true;
}

void getTemperature() {
  // Empty function to trigger temperature reading from DHT22
}

void connectToWiFi() {
  // ใช้ค่า SSID และ Password ของ Station จากตัวแปร
  WiFi.begin(stationSSID.c_str(), stationPassword.c_str());
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi...");
  }
  check_status_wifi = true;
  Serial.println("Connected to WiFi");
}

void handleRoot(AsyncWebServerRequest *request){
  String html = "<html><body><center>";
  html += "<h1>ESP32 WiFi Configuration</h1>";
  if(check_status_wifi == false){
    html += "<h3>Not connected to wifi</h3>";
  }
  else{
    html += "<h3>connected to wifi ssid: "+stationSSID+"</h3>";
  }
  html += "<form action='/save' method='POST'>";
  html += "SSID: <input type='text' name='ssid' value='" + stationSSID + "'><br><br>";  // เพิ่ม value='" + stationSSID + "'
  html += "Password: <input type='password' name='password'><br><br>";  
  html += "<input type='submit' value='Save' style='font-size: 24px;'>";
  html += "</form><center></body></html>";
  request->send(200, "text/html", html);
}

void handleSave(AsyncWebServerRequest *request){
  stationSSID = request->arg("ssid");
  stationPassword = request->arg("password");
  String script = "<script>window.location.href = 'http://192.168.4.1/';</script>";
  save_to_text();
  read_from_text();
  //Connect to the updated WiFi
  connectToWiFi();

  request->send(200, "text/html",script);
}
  
void save_to_text(){
  Serial.println("Enter save");
  File file_s = LittleFS.open("/wifi_config.txt", "w");
  if (!file_s) {
    Serial.println("Failed to open wifi_config.txt for writing");
    //return;
  }
  // เขียนข้อมูล SSID และ Password ลงในไฟล์
  file_s.print(stationSSID);
  file_s.print(",");
  file_s.print(stationPassword);
  file_s.close();

  Serial.println("WiFi configuration saved successfully");
}

void read_from_text(){
  if (!LittleFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    //return;
  }
  // อ่านข้อมูล SSID และ Password จากไฟล์เชิงข้อมูล
  File file_r = LittleFS.open("/wifi_config.txt","r");
  if (!file_r) {
    Serial.println("Failed to open wifi_config.txt file");
    //return;
  }

  // อ่านข้อมูล SSID และ Password จากไฟล์
  String wifiConfig = file_r.readString();
  file_r.close();

  // แยกข้อมูล SSID และ Password จากข้อมูลที่อ่านได้
  int separatorIndex = wifiConfig.indexOf(",");
  if (separatorIndex == -1) {
    Serial.println("Invalid wifi_config.txt file format");
    //return;
  }
  
  stationSSID = wifiConfig.substring(0, separatorIndex).c_str();
  stationPassword = wifiConfig.substring(separatorIndex + 1).c_str();

  Serial.print("SSID: ");
  Serial.println(stationSSID);
  Serial.print("Password: ");
  Serial.println(stationPassword);
}
void setTimeZone() {
  configTime(timezone, 0, ntpServer,"time.nist.gov");
  setenv("TZ", TZ_INFO, 1);
  tzset();
}
void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA_PIN,I2C_SCL_PIN);
  // DHT Setup
  dht.setup(DHT_PIN, DHTesp::DHT22);
  // BH1750 on
  Wire.setClock( 400000 );// set I2C speed to 400kHz
  tempTicker.attach(5, getTemperature);// Start reading temperature and humidity every 5 seconds
  pinMode(soilMoisturePin, INPUT); // ตั้งค่าขาที่เชื่อมต่อกับเซ็นเซอร์ความชืนในดินเป็นขาอินพุต
  pinMode(relayPumpPin, OUTPUT); // ตั้งค่าขา Relay สำหรับปั้มน้ำ เป็น Output
  pinMode(relayLightPin, OUTPUT); // ตั้งค่าขา Relay สำหรับไฟ เป็น Output
  //Access Point
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_ssid, AP_password);
  // Redirect to the configuration page
  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
 
  read_from_text();
  //station
  connectToWiFi();
  //Firebase
  //Assign the api key (required) 
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.token_status_callback = tokenStatusCallback; 
  //Assign the RTDB URL (required)
  config.database_url = DATABASE_URL;
  // auth.token.uid = USERID;
  Firebase.reconnectWiFi(true);
  fbdo.setResponseSize(4096);
  //config.max_token_generation_retry = 12;
   /* Sign up */
  if (Firebase.signUp(&config, &auth, "", "")){
    signupOK = true;
    Serial.print("signupOK: ");
    Serial.println(signupOK);
  }
  else{
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  //stream
  if(!Firebase.RTDB.beginStream(&fdbo_sut1h,"users/Time1/hour")){
    Serial.printf("fdbo_sut1h %s\n", fdbo_sut1h.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_sut1m,"users/Time1/minute")){
    Serial.printf("fdbo_sut1m %s\n", fdbo_sut1m.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_sut2h,"users/Time2/hour")){
    Serial.printf("fdbo_sut2h %s\n", fdbo_sut2h.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_sut2m,"users/Time2/minute")){
    Serial.printf("fdbo_sut2m %s\n", fdbo_sut2m.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_susoilt,"users/MoistureThreshold/value")){
    Serial.printf("fdbo_susoilt %s\n", fdbo_susoilt.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_suluxt,"users/LuxThreshold/value")){
    Serial.printf("fdbo_suluxt %s\n", fdbo_suluxt.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_suls,"users/LightStatus/value")){
    Serial.printf("fdbo_sut1h %s\n", fdbo_suls.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_sups,"users/PumpStatus/value")){
    Serial.printf("fdbo_sut1h %s\n", fdbo_sups.errorReason().c_str());
  }
  if(!Firebase.RTDB.beginStream(&fdbo_sdfc,"Data/Firstcheck")){
    Serial.printf("fdbo_sdfc %s\n", fdbo_sdfc.errorReason().c_str());
  }
}

void loop() {
  if(Firebase.isTokenExpired()){
    Firebase.refreshToken(&config);
    Serial.println("refreshToken");
  }
  Firebase_GET();
  if(user_lightstatus == "0" && user_pumpstatus == "0" && first_check =="0"){
    digitalWrite(relayPumpPin, HIGH);
    digitalWrite(relayLightPin, HIGH);
    pumpstatus="0";
    lightstatus="0";
    if (Firebase.ready() && (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0)){
      sendDataPrevMillis = millis();
      //pumpstatus
      if (Firebase.RTDB.setString(&fbdo, "Data/Pumpstatus", pumpstatus)){
        Serial.printf("PASSED pumpstatus: %u\n", pumpstatus);
      }
      else {
        Serial.println(fbdo.errorReason());
        if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
          Serial.println("Attempting to reconnect to Firebase...");
          Firebase.reconnectWiFi(true);
        }
      }
      //lightstatus
      if (Firebase.RTDB.setString(&fbdo, "Data/Lightstatus", lightstatus)){
        Serial.printf("PASSED: %u\n", lightstatus);
      }
      else {
        Serial.println(fbdo.errorReason());
        if(fbdo.errorReason() =="token is not ready (revoked or expired)"){
          Serial.println("Attempting to reconnect to Firebase...");
          Firebase.reconnectWiFi(true);
        }
      }
    }
    Serial.println("System off");
    //enterDeepSleep();
    delay(1000);
  }
  else{
    //set time 
    time_t now;
    struct tm timeinfo;
    time(&now);
    localtime_r(&now, &timeinfo);
    configTime(timezone, 0, ntpServer);
    timestamp = now;

    // Read temperature and humidity from DHT22
    humidity = dht.getHumidity();
    temperature = dht.getTemperature();
    soilMoisture = analogRead(soilMoisturePin);
    soilMoisture = map(soilMoisture, 0, 4095, 100, 0);
    if ( BH1750_read(BH1750_ADDR, &lux) ) 
    {
      // ควบคุม Relay สำหรับไฟ
      if (lux <= user_luxThreshold && user_lightstatus == "1") 
      {
        digitalWrite(relayLightPin, LOW); // เปิด Relay สำหรับไฟ
        lightstatus = "1";//light working
      } 
      else 
      {
        digitalWrite(relayLightPin, HIGH); // ปิด Relay สำหรับไฟ
        lightstatus = "0";
      }
    } 
    else 
    {
      Serial.println( "Sensor reading error!" );
    };
    // ควบคุม Relay สำหรับปั้มน้ำ
    if(first_check == "0" ){
      if(user_pumpstatus == "1"){
        while(soilMoisture <= user_moistureThreshold){
        Firebase_GET();
        if(user_lightstatus == "0" && user_pumpstatus == "0"){
          return;
        }  
        digitalWrite(relayPumpPin, LOW); // เปิด Relay สำหรับปั้มน้ำ
        digitalWrite(relayLightPin, HIGH);
        soilMoisture = analogRead(soilMoisturePin);
        soilMoisture = map(soilMoisture, 0, 4095, 100, 0); 
        Firebase_SET();
        Serial.println( "stage 1" );
        }
        first_check = "1";
        Serial.println( "stage 2" );
      }
    }
    if ((soilMoisture <= user_moistureThreshold) && 
    (user_pumpstatus == "1") && 
    ((timeinfo.tm_hour == time1.user_hr && 
      timeinfo.tm_min >= time1.user_min && 
      timeinfo.tm_min <= time1.user_min + 2) || 
     (timeinfo.tm_hour == time2.user_hr && 
      timeinfo.tm_min >= time2.user_min && 
      timeinfo.tm_min <= time2.user_min + 2)))
    {
      digitalWrite(relayPumpPin, LOW); // เปิด Relay สำหรับปั้มน้ำ
      pumpstatus = "1";//pump working
    } 
    else
    {
      digitalWrite(relayPumpPin, HIGH); // ปิด Relay สำหรับปั้มน้ำ
      pumpstatus = "0";
    }
    Firebase_SET();
  }
}