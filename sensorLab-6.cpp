#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// Firebase credentials
#define API_KEY "YOUR_API_KEY_HERE"
#define DATABASE_URL "YOUR_DATABASE"

#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

#define USER_EMAIL "YOUR_FIREBASE_USER_EMAIL"
#define USER_PASSWORD "YOUR_USER_PASSWORD"

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

// Heart rate calculation
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;

double avered = 0;
double aveir = 0;

double spo2 = 0;
double red = 0;
double ir = 0;

#define MAX_HR_VALUE 200
#define MIN_HR_VALUE 30

void setup() {
  Serial.begin(115200);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println("WiFi Connected");

  // Time
  configTime(0, 0, "pool.ntp.org");
  while (time(nullptr) < 100000) delay(200);

  // Firebase config
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

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("MAX30102 NOT FOUND");
  }
  
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int gas = analogRead(MQ135_PIN);
  
  long irValue = particleSensor.getIR();
  red = particleSensor.getRed();
  
  boolean bodyPresent = false;
  
  if (irValue > 50000) {
    bodyPresent = true;
    
    // Calculate BPM
    if (checkForBeat(irValue) == true) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60 / (delta / 1000.0);
      
      if (beatsPerMinute < MAX_HR_VALUE && beatsPerMinute > MIN_HR_VALUE) {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;
        beatAvg = 0;
        for (byte x = 0; x < RATE_SIZE; x++)
          beatAvg += rates[x];
        beatAvg /= RATE_SIZE;
      }
    }
    
    // Calculate SpO2 (simplified)
    double fred = red;
    double fir = irValue;
    
    if (millis() > 1000) {
      fir = fir + (irValue - fir) * 0.7;
      fred = fred + (red - fred) * 0.7;
      
      if (fred > 15000 && fir > 15000) {
        double spo2Calculated = 100 - 5 * (fred / fir);
        if (spo2Calculated > 70 && spo2Calculated < 100) {
          spo2 = spo2Calculated;
        }
      }
    }
  } else {
    beatAvg = 0;
    spo2 = 0;
  }

  Serial.printf("T:%.1f H:%.0f G:%d HR:%d SpO2:%.0f\n", temp, hum, gas, beatAvg, spo2);

  if (Firebase.ready() && firebaseReady) {
    Firebase.RTDB.setFloat(&fbdo, "/sensors/temperature", isnan(temp) ? 0 : temp);
    Firebase.RTDB.setFloat(&fbdo, "/sensors/humidity", isnan(hum) ? 0 : hum);
    Firebase.RTDB.setInt(&fbdo, "/sensors/gas", gas);
    Firebase.RTDB.setInt(&fbdo, "/sensors/heartRate", beatAvg);
    Firebase.RTDB.setFloat(&fbdo, "/sensors/spo2", spo2);
    Firebase.RTDB.setBool(&fbdo, "/sensors/bodyPresent", bodyPresent);
  }

  delay(1000);
}
