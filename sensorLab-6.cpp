#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "time.h"

// WIFI
#define WIFI_SSID "Thousand Sunny"
#define WIFI_PASSWORD "11111111"

// Firebase
#define API_KEY "AIzaSyBNvpNxWXTKTpbRnJEvOgdutVjF2rA_Okk"
#define DATABASE_URL "https://sensorlab-6-default-rtdb.firebaseio.com/"

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

// Heart Rate
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;

long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

float spo2 = 0;

#define MAX_HR_VALUE 200
#define MIN_HR_VALUE 30

bool firebaseReady = false;

// NTP
const char* ntpServers[] = {
  "pool.ntp.org",
  "time.google.com",
  "time.cloudflare.com"
};

void connectWiFi()
{
  Serial.println("Connecting WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
    retry++;

    if(retry > 20)
    {
      Serial.println("\nRestarting WiFi...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      retry = 0;
    }
  }

  Serial.println("\nWiFi Connected");
  Serial.println(WiFi.localIP());
}

void syncTime()
{
  Serial.println("Syncing time...");

  for(int i=0;i<3;i++)
  {
    configTime(0,0,ntpServers[i]);

    int retry = 0;

    while(time(nullptr) < 100000 && retry < 20)
    {
      delay(500);
      Serial.print(".");
      retry++;
    }

    if(time(nullptr) > 100000)
    {
      Serial.println("\nTime synced");
      return;
    }

    Serial.println("\nServer failed");
  }

  Serial.println("NTP failed - using fallback time");
}

void setup()
{
  Serial.begin(115200);

  Serial.print("Free Heap: ");
  Serial.println(ESP.getFreeHeap());

  connectWiFi();
  syncTime();

  // Firebase config
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.reconnectWiFi(true);

  fbdo.setBSSLBufferSize(2048,512);
  fbdo.setResponseSize(1024);

  Firebase.begin(&config, &auth);

  firebaseReady = Firebase.ready();

  Serial.println(firebaseReady ? "Firebase Ready" : "Firebase Starting");

  // Sensors
  dht.begin();

  Wire.begin(21,22);

  if(!particleSensor.begin(Wire, I2C_SPEED_STANDARD))
  {
    Serial.println("MAX30102 NOT FOUND");
  }
  else
  {
    Serial.println("MAX30102 Ready");
  }

  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop()
{
  if(WiFi.status() != WL_CONNECTED)
  {
    connectWiFi();
  }

  if(!Firebase.ready())
  {
    Serial.println("Firebase reconnecting...");
    Firebase.begin(&config,&auth);
  }

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  int gas = analogRead(MQ135_PIN);

  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  bool bodyPresent = false;

  if(irValue > 50000)
  {
    bodyPresent = true;

    if(checkForBeat(irValue))
    {
      long delta = millis() - lastBeat;
      lastBeat = millis();

      beatsPerMinute = 60 / (delta / 1000.0);

      if(beatsPerMinute < MAX_HR_VALUE && beatsPerMinute > MIN_HR_VALUE)
      {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;

        beatAvg = 0;

        for(byte i=0;i<RATE_SIZE;i++)
        beatAvg += rates[i];

        beatAvg /= RATE_SIZE;
      }
    }

    if(redValue > 15000 && irValue > 15000)
    {
      spo2 = 100 - 5 * ((float)redValue / (float)irValue);
    }
  }
  else
  {
    beatAvg = 0;
    spo2 = 0;
  }

  Serial.printf(
  "T:%.1f H:%.1f Gas:%d HR:%d SpO2:%.1f\n",
  temp,hum,gas,beatAvg,spo2);

  if(Firebase.ready())
  {
    Firebase.RTDB.setFloat(&fbdo,"/sensors/temperature",temp);
    Firebase.RTDB.setFloat(&fbdo,"/sensors/humidity",hum);
    Firebase.RTDB.setInt(&fbdo,"/sensors/gas",gas);
    Firebase.RTDB.setInt(&fbdo,"/sensors/heartRate",beatAvg);
    Firebase.RTDB.setFloat(&fbdo,"/sensors/spo2",spo2);
    Firebase.RTDB.setBool(&fbdo,"/sensors/bodyPresent",bodyPresent);

    Serial.println("Firebase Updated");
  }

  delay(2000);
}