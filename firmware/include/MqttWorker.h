#pragma once
#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "AppConfig.h"

class MqttWorker {
public:
    MqttWorker();
    
    void loop();
    bool isConnected();
    bool publishReading(String deviceId, const MeterReading &reading);
    bool loadCredentials();
private:
    WiFiClientSecure espClient;
    PubSubClient client;
    SystemConfig* _config = nullptr; 
    bool _credentialsLoaded = false;
    void reconnect();
    
    // Tópico padrão: energymeter/{DEVICE_ID}/data
    // String getTopic(String deviceId);
};