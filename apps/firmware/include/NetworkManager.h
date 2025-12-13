#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include "AppConfig.h"
#include "ConfigManager.h"

class NetworkManager {
public:
    NetworkManager();
    
    // Inicia a conexão (tenta WiFi ou sobe AP)
    void begin(SystemConfig &config);
    
    // Configura as rotas do servidor web
    void setupWebServer(ConfigManager &configManager);
    

    // Chamado no loop principal (para reconexão se cair)
    void loop();
    
    // Retorna true se estiver conectado à internet
    bool isWifiConnected();
    bool isApMode();
    // Retorna o ID único do hardware (ex: "A1B2C3D4")
    String getDeviceId();

private:
    AsyncWebServer server;
    SystemConfig* _config; // Ponteiro para a config atual
    unsigned long _lastWifiCheck = 0;
    bool _apMode = false;
    bool _shouldReboot = false;
    void startAP();
    void connectWiFi();
    String macToHex(); // Helper para gerar o ID
};