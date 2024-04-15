#include "Arduino.h"
#include <TimeLib.h>
#include "WiFi.h"
#include "esp_camera.h"
#include "soc/soc.h"           // Disable brownout problems
#include "soc/rtc_cntl_reg.h"  // Disable brownout problems
#include "driver/rtc_io.h"
#include <LittleFS.h>
#include <FS.h>
#include "SPIFFS.h"
#include <SD.h>
#include <Firebase_ESP_Client.h>
//Provide the token generation process info.
#include <addons/TokenHelper.h>
#include "string.h"
#include <ESPAsyncWebServer.h>
// Insert Firebase project API Key
#define API_KEY "AIzaSyBg-VCiyYgtsqYAViFtxjD6lQmjLHSFdi8"
// Insert Firebase storage bucket ID e.g bucket-name.appspot.com
#define STORAGE_BUCKET_ID "farmself-1beda.appspot.com"
#define USER_EMAIL "s6304062636286@email.kmutnb.ac.th"
#define USER_PASSWORD "0923753720cs"
#define DATABASE_URL "https://farmself-1beda-default-rtdb.asia-southeast1.firebasedatabase.app/"
// Photo File Name to save in LittleFS
#define FILE_PHOTO_PATH "/photo.jpg"
#define BUCKET_PHOTO "/Streaming/photo.jpg"
//AP ESP32-CAM preset
const char* AP_ssid = "ESP32-CAM";
const char* AP_password = "1234567890";
AsyncWebServer server(80);
//Replace with your network credentials
String ssid = "1IPHONE";
String password = "0820db02";
String user_lightstatus = "0";
String user_pumpstatus = "0";
String first_check ="0";
//record photo preset
const char* ntpServer = "asia.pool.ntp.org"; // เซิร์ฟเวอร์ NTP ในภูมิภาคเอเชีย
int timezone = 7 * 3600;
const char* TZ_INFO = "ICT7";
unsigned long lastPhotoTimestamp = 0;
const unsigned long PHOTO_INTERVAL = 60; // 1 minute interval for testing
// OV2640 camera module pins (CAMERA_MODEL_AI_THINKER)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
boolean takeNewPhoto = true;
//Define Firebase Data objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig configF;
bool check_status_wifi = false;
void fcsUploadCallback(FCS_UploadStatusInfo info);
// Capture Photo and Save it to LittleFS
void capturePhotoSaveLittleFS(char FILE_PHOTO_PATHS[100]) {

  camera_fb_t* fb = NULL;

  // Skip first 3 frames (increase/decrease number as needed).
  for (int i = 0; i < 4; i++) {
    fb = esp_camera_fb_get();
    esp_camera_fb_return(fb);
    fb = NULL;
  }
    
  // Take a new photo
  fb = NULL;  
  fb = esp_camera_fb_get();  
  if(!fb) {
    Serial.println("Camera capture failed");
    delay(1000);
  }  

  // Photo file name
   // Dispose first pictures because of bad quality
  Serial.printf("Picture file name: %s\n", FILE_PHOTO_PATHS);
  File file = LittleFS.open(FILE_PHOTO_PATHS, FILE_WRITE);

  // Insert the data in the photo file
  if (!file) {
    Serial.println("Failed to open file in writing mode");
  }
  else {
    file.write(fb->buf, fb->len); // payload (image), payload length
    Serial.print("The picture has been saved in ");
    Serial.print(FILE_PHOTO_PATHS);
    Serial.print(" - Size: ");
    Serial.print(fb->len);
    Serial.println(" bytes");
  }
  // Close the file
  file.close();
  esp_camera_fb_return(fb);
}
void initWiFi(){
  WiFi.begin(ssid.c_str(), password.c_str());
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    //Serial.println("Connecting to WiFi...");
  }
  check_status_wifi = true;
  Serial.println("Connected to WiFi");
}
void initCamera(){
 // OV2640 camera module
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG; // ตั้งค่ารูปแบบของรูปภาพเป็น JPEG
  config.jpeg_quality = 10; // ตั้งค่าคุณภาพของภาพ JPEG
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_LATEST;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 1;
  } else {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 1;
  }
  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    //ESP.restart();
  } 
}
void setTimeZone() {
  configTime(timezone, 0, ntpServer,"time.nist.gov");
  setenv("TZ", TZ_INFO, 1);
  tzset();
}
void read_from_text(){
  Serial.println("Can raed");
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
  Serial.print("wifiConfig: ");
  Serial.println(wifiConfig);
  file_r.close();
  // แยกข้อมูล SSID และ Password จากข้อมูลที่อ่านได้
  int separatorIndex = wifiConfig.indexOf(",");
  if (separatorIndex == -1) {
    Serial.println("Invalid wifi_config.txt file format");
    //return;
  }
  ssid = wifiConfig.substring(0, separatorIndex).c_str();
  password = wifiConfig.substring(separatorIndex + 1).c_str();
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("Password: ");
  Serial.println(password);
}
void save_to_text(){
  Serial.println("Enter save");
  File file_s = LittleFS.open("/wifi_config.txt", "w");
  if (!file_s) {
    Serial.println("Failed to open wifi_config.txt for writing");
    //return;
  }
  // เขียนข้อมูล SSID และ Password ลงในไฟล์
  file_s.print(ssid);
  file_s.print(",");
  file_s.print(password);
  file_s.close();

  Serial.println("WiFi configuration saved successfully");
}
void Firebase_GET(){
  //lightStatus
  if (Firebase.RTDB.getString(&fbdo, "users/LightStatus/value")) {
    user_lightstatus = fbdo.stringData().c_str();
    Serial.print("LightStatus: ");
    Serial.println(user_lightstatus);
  }
  else {
    Serial.println(fbdo.errorReason());
  }
  //PumpStatus
  if (Firebase.RTDB.getString(&fbdo, "users/PumpStatus/value")) {
    user_pumpstatus = fbdo.stringData().c_str();
    Serial.print("PumpStatus: ");
    Serial.println(user_pumpstatus);
  }
  else {
    Serial.println(fbdo.errorReason());
  }
  //first_check
  if (Firebase.RTDB.getString(&fbdo, "Data/Firstcheck")) {
    first_check = fbdo.stringData().c_str();
    Serial.print("first_check: ");
    Serial.println(first_check);
  }
  else {
    Serial.println(fbdo.errorReason());
  }
}
void handleRoot( AsyncWebServerRequest *request) {
  String html = "<html><body><center>";
  html += "<h1>ESP32-CAM WiFi Configuration</h1>";
  if(check_status_wifi == false){
    html += "<h3>Not connected to wifi</h3>";
  }
  else{
    html += "<h3>connected to wifi ssid: "+ssid+"</h3>";
  }
  html += "<form action='/save' method='POST'>";
  html += "SSID: <input type='text' name='ssid' value='" + ssid + "'><br><br>";  // เพิ่ม value='" + stationSSID + "'
  html += "Password: <input type='password' name='password'><br><br>";  // เพิ่ม value='" + stationPassword + "'
  html += "<input type='submit' value='Save' style='font-size: 24px;'>";
  html += "</form><center></body></html>";
  request->send(200, "text/html", html);
}
void handleSave(AsyncWebServerRequest *request) {
  ssid = request->arg("ssid");
  password = request->arg("password");
  Serial.println("New SSID:" + ssid);
  Serial.println("New Password:" + password);
  String script = "<script>window.location.href = 'http://192.168.4.1/';</script>";
  save_to_text();
  read_from_text();
  initWiFi();
  request->send(200, "text/html", script);
}
void fcsUploadCallback(FCS_UploadStatusInfo info){
    if (info.status == firebase_fcs_upload_status_init){
        Serial.printf("Uploading file %s (%d) to %s\n", info.localFileName.c_str(), info.fileSize, info.remoteFileName.c_str());
    }
    else if (info.status == firebase_fcs_upload_status_upload)
    {
      //Serial.printf("Uploaded %d%s, Elapsed time %d ms\n", (int)info.progress, "%", info.elapsedTime);
    }
    else if (info.status == firebase_fcs_upload_status_complete)
    {
      if (LittleFS.remove(FILE_PHOTO_PATH)) {
        Serial.println("File deleted successfully");
      } 
      else {
        Serial.println("Error deleting file");
      }
        Serial.println("Upload completed\n");
        FileMetaInfo meta = fbdo.metaData();
        Serial.printf("Name: %s\n", meta.name.c_str());
        Serial.printf("Bucket: %s\n", meta.bucket.c_str());
        Serial.printf("contentType: %s\n", meta.contentType.c_str());
        Serial.printf("Size: %d\n", meta.size);
        Serial.printf("Generation: %lu\n", meta.generation);
        Serial.printf("Metageneration: %lu\n", meta.metageneration);
        Serial.printf("ETag: %s\n", meta.etag.c_str());
        Serial.printf("CRC32: %s\n", meta.crc32.c_str());
        Serial.printf("Tokens: %s\n", meta.downloadTokens.c_str());
        Serial.printf("Download URL: %s\n\n", fbdo.downloadURL().c_str());
    }
    else if (info.status == firebase_fcs_upload_status_error){
        Serial.printf("Upload failed, %s\n", info.errorMsg.c_str());
    }
}
void setup() {
  // Turn-off the 'brownout detector'
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  // Serial port for debugging purposes
  Serial.begin(115200);
  WiFi.mode(WIFI_AP_STA);
  // Set ESP32-CAM as AP
  WiFi.softAP(AP_ssid, AP_password);
  // Start web server
  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST,handleSave);
  server.begin();
  Serial.println("HTTP server started");
  read_from_text();//อ่าน ssid และ password จากไฟล์ text
  initWiFi();// เชื่อมต่อไวไฟ
  initCamera();
  IPAddress IP = WiFi.softAPIP();
  //Firebase
  // Assign the api key
  configF.api_key = API_KEY;
  //Assign the user sign in credentials
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  //Assign the callback function for the long running token generation task
  configF.token_status_callback = tokenStatusCallback; //see addons/TokenHelper.h
  configF.database_url = DATABASE_URL;
  Firebase.begin(&configF, &auth);
  Firebase.reconnectWiFi(true);
  setTimeZone();
  configTime(0, 0, ntpServer);
  takeNewPhoto = true;
}
void loop(){
  Firebase_GET();
  if(user_lightstatus == "0" && user_pumpstatus == "0" && first_check =="0"){
    Serial.println("System off");
  }
  else{
    time_t now;
    struct tm timeinfo;
    time(&now);
    int timestamp = now;
    localtime_r(&now, &timeinfo);
    configTime(timezone, 0, ntpServer);
    if((timeinfo.tm_hour == 8 && timeinfo.tm_min == 0 && timeinfo.tm_sec <= 1) || 
      (timeinfo.tm_hour == 12 && timeinfo.tm_min == 0 && timeinfo.tm_sec <= 1) || 
      (timeinfo.tm_hour == 16 && timeinfo.tm_min == 0 && timeinfo.tm_sec <= 1)
      &&(now - lastPhotoTimestamp >= PHOTO_INTERVAL)){
      Serial.println("Record Photo");
      if (takeNewPhoto) {// Format the filename with date and time
        char filename[50];
        char BUCKETREC_PHOTO[50];
        sprintf(filename, "/%d.jpg",timestamp);
        sprintf(BUCKETREC_PHOTO, "/Record/%d",timestamp);
        capturePhotoSaveLittleFS(filename);// Capture and save the photo
        takeNewPhoto = false;
        if (Firebase.ready()){// Upload the photo to Firebase Storage mem_storage_type_flash
          if (Firebase.Storage.upload(&fbdo, STORAGE_BUCKET_ID, filename, mem_storage_type_flash,BUCKETREC_PHOTO, "image/jpeg", fcsUploadCallback)){
            Serial.printf("\nDownload URL: %s\n", fbdo.downloadURL().c_str());
          }
          else{
            Serial.println(fbdo.errorReason());
          }
        }
        if (LittleFS.remove(filename)) {
        Serial.println("File deleted successfully");
        } 
        else {
          Serial.println("Error deleting file");
        }
      }
      lastPhotoTimestamp = now;
    }
    else{
      if (takeNewPhoto) {
        capturePhotoSaveLittleFS(FILE_PHOTO_PATH);//#define FILE_PHOTO_PATH "/photo.jpg"
        takeNewPhoto = false;
        if (Firebase.ready()){
          if (Firebase.Storage.upload(&fbdo, STORAGE_BUCKET_ID, FILE_PHOTO_PATH, mem_storage_type_flash , BUCKET_PHOTO , "image/jpeg" ,fcsUploadCallback)){
            if (Firebase.RTDB.setString(&fbdo, "Data/Streaming/", fbdo.downloadURL().c_str())){
              Serial.println("Realtime");
              Serial.printf("\nDownload URL: %s\n", fbdo.downloadURL().c_str());
            }
            else {
              Serial.println("FAILED");
              Serial.println("REASON: " + fbdo.errorReason());
            }
          }
          else{
            Serial.println(fbdo.errorReason());
          }
        }
      } 
    }
    takeNewPhoto = true;//Check if it's time to take a photo  
  }
  delay(100); // Add a small delay to improve stability
}

// FRAMESIZE_UXGA: 1600x1200 pixels
// FRAMESIZE_SXGA: 1280x1024 pixels
// FRAMESIZE_XGA: 1024x768 pixels
// FRAMESIZE_SVGA: 800x600 pixels
// FRAMESIZE_VGA: 640x480 pixels
// FRAMESIZE_CIF: 400x296 pixels
// FRAMESIZE_QVGA: 320x240 pixels
// FRAMESIZE_HQVGA: 240x176 pixels
// FRAMESIZE_QCIF: 176x144 pixels
// FRAMESIZE_T7: 160x120 pixels
// FRAMESIZE_T9: 128x96 pixels