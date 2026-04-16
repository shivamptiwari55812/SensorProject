#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

// Firebase credentials
#define API_KEY "AIzaSyBNvpNxWXTKTpbRnJEvOgdutVjF2rA_Okk"
#define DATABASE_URL "https://sensorlab-6-default-rtdb.asia-southeast1.firebasedatabase.app"

#define WIFI_SSID "Thousand Sunny"
#define WIFI_PASSWORD "11111111"

#define USER_EMAIL "test@test.com"
#define USER_PASSWORD "123456"

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Sensors
#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ135_PIN 34

DHT dht(DHTPIN, DHTTYPE);
MAX30105 particleSensor;

bool firebaseReady = false;

// MAX30102 buffers
#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];

int32_t spo2;
int8_t validSPO2;

int32_t heartRate;
int8_t validHeartRate;

void setup()
{
  Serial.begin(115200);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  // Time
  configTime(0, 0, "pool.ntp.org");
  while (time(nullptr) < 100000) delay(200);

  // Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  fbdo.setBSSLBufferSize(4096, 1024);
  fbdo.setResponseSize(4096);

  firebaseReady = Firebase.ready();
  Serial.println(firebaseReady ? "Firebase Ready" : "Firebase Failed");

  // Sensors
  dht.begin();
  Wire.begin(21, 22);

  // MAX30102 setup
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("MAX30102 NOT FOUND");
    while (1);
  }

  Serial.println("MAX30102 Initialized");

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x1F);
  particleSensor.setPulseAmplitudeIR(0x1F);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop()
{
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int gas = analogRead(MQ135_PIN);

  // Collect MAX30102 samples
  for (byte i = 0; i < BUFFER_SIZE; i++) {
    while (particleSensor.available() == false)
      particleSensor.check();

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  // Calculate HR and SpO2
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_SIZE,
    redBuffer,
    &spo2,
    &validSPO2,
    &heartRate,
    &validHeartRate
  );

  int bpm = 0;
  int oxygen = 0;
  bool bodyPresent = false;

  if (validHeartRate && validSPO2) {
    bpm = heartRate;
    oxygen = spo2;
    bodyPresent = true;
  }

  Serial.printf("T:%.1f H:%.0f G:%d HR:%d SpO2:%d\n",
                temp,
                hum,
                gas,
                bpm,
                oxygen);

  // Send to Firebase
  if (Firebase.ready() && firebaseReady) {
    Firebase.RTDB.setFloat(&fbdo, "/sensors/temperature", isnan(temp) ? 0 : temp);
    Firebase.RTDB.setFloat(&fbdo, "/sensors/humidity", isnan(hum) ? 0 : hum);
    Firebase.RTDB.setInt(&fbdo, "/sensors/gas", gas);
    Firebase.RTDB.setInt(&fbdo, "/sensors/heartRate", bpm);
    Firebase.RTDB.setInt(&fbdo, "/sensors/spo2", oxygen);
    Firebase.RTDB.setBool(&fbdo, "/sensors/bodyPresent", bodyPresent);
  }

  delay(500);
}