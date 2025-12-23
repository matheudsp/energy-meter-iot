#include "NetworkManager.h"

NetworkManager::NetworkManager() : server(80) {}

String NetworkManager::macToHex() {
    uint64_t mac = ESP.getEfuseMac(); 
    uint32_t high = (uint32_t)((mac >> 32) & 0xFFFF);
    uint32_t low  = (uint32_t)(mac & 0xFFFFFFFF);
    
    char buffer[13];
    sprintf(buffer, "%04X%08X", high, low); // Ex: A1B2C3D4E5F6
    return String(buffer);
}
String NetworkManager::getDeviceId() {
    return macToHex();
}

void NetworkManager::begin(SystemConfig &config) {
    _config = &config;

    _config->deviceId = getDeviceId();
    Serial.println("🔒 Device ID (MAC): " + _config->deviceId);

    WiFi.mode(WIFI_AP_STA); 

    if (_config->apModeForce || _config->wifiSsid == "") {
        Serial.println("⚠️ Modo AP Forçado ou sem WiFi configurado.");
        startAP();
    } else {
        connectWiFi();
    }
}

void NetworkManager::startAP() {
    _apMode = true;
    
    String ssid = "Energy_" + getDeviceId();
    String pass = "12345678"; 

    Serial.print("📡 Iniciando Hotspot: ");
    Serial.println(ssid);

    WiFi.softAP(ssid.c_str(), pass.c_str());

    IPAddress IP = WiFi.softAPIP();
    Serial.print("🌐 Endereço do Painel: http://");
    Serial.println(IP);
}

void NetworkManager::connectWiFi() {
    Serial.print("ww Conectando ao WiFi: ");
    Serial.println(_config->wifiSsid);

    WiFi.begin(_config->wifiSsid.c_str(), _config->wifiPass.c_str());

    // Tentamos por 10 segundos. Se falhar, não travamos o loop (o loop() vai tratar retry)
    // Mas para UX inicial, esperamos um pouco.
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✅ WiFi Conectado!");
        Serial.print("📍 IP: ");
        Serial.println(WiFi.localIP());
        _apMode = false;
        // Se quisermos desligar o AP quando conecta:
        // WiFi.softAPdisconnect(true); 
    } else {
        Serial.println("\n❌ Falha ao conectar. Subindo AP de emergência...");
        startAP();
    }
}

void NetworkManager::loop() {

    if (_shouldReboot) {
        delay(5000); // Espera um pouco para a resposta HTTP sair
        ESP.restart();
    }

    // Reconnection Manager
    // Se não estiver em modo AP forçado e o WiFi caiu
    if (!_config->apModeForce && !_apMode) {
        if (WiFi.status() != WL_CONNECTED) {
            unsigned long now = millis();
            if (now - _lastWifiCheck > 60000) { // Tenta reconectar a cada 60s
                _lastWifiCheck = now;
                Serial.println("🔄 Tentando reconectar WiFi...");
                WiFi.reconnect();
            }
        }
    }
}

bool NetworkManager::isWifiConnected() {
    return WiFi.status() == WL_CONNECTED;
}
bool NetworkManager::isApMode() {
    return _apMode;
}
// --- CONFIGURAÇÃO DO SERVIDOR WEB (API) ---

void NetworkManager::setupWebServer(ConfigManager &configManager) {
    // Rota Principal (Serve o HTML do LittleFS)
   server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

    // API: Obter Configurações Atuais
    server.on("/api/config", HTTP_GET, [this](AsyncWebServerRequest *request){
        JsonDocument doc;
        // Preenche o JSON com os dados atuais da memória
        doc["wifi"]["ssid"] = _config->wifiSsid;
        doc["wifi"]["ap_mode"] = _config->apModeForce;
        doc["mqtt"]["server"] = _config->mqttServer;
        doc["mqtt"]["port"] = _config->mqttPort;
        doc["mqtt"]["device_id"] = _config->deviceId;
        doc["system"]["serial_id"] = getDeviceId(); // Envia o Serial ID para o frontend mostrar

        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });

    // API: Salvar Novas Configurações
    // Recebe um JSON, atualiza a struct e manda o ConfigManager salvar no disco
    server.on("/api/save", HTTP_POST, 
        [](AsyncWebServerRequest *request){},
        NULL,
        [this, &configManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {  
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, data);

            if (error) {
                request->send(400, "application/json", "{\"status\":\"error\",\"msg\":\"Invalid JSON\"}");
                return;
            }

            // Atualiza WiFi e MQTT
            _config->wifiSsid = doc["wifi"]["ssid"] | _config->wifiSsid;
            _config->wifiPass = doc["wifi"]["pass"] | _config->wifiPass;
            _config->mqttServer = doc["mqtt"]["server"] | _config->mqttServer;
            _config->mqttPort = doc["mqtt"]["port"] | _config->mqttPort;
            _config->interval = doc["mqtt"]["interval"] | _config->interval;
            
          if (doc.containsKey("meters")) {
                _config->meters.clear(); // Limpa a lista antiga da memória
                JsonArray meters = doc["meters"];
                for (JsonObject m : meters) {
                    MeterConfig mc;
                    mc.id = m["id"];
                    mc.channelIndex = m["channel_index"] | m["id"]; 
                    mc.modbusId = m["modbus_id"];
                    mc.name = m["name"].as<String>();
                    _config->meters.push_back(mc);
                }
            }
            
            //  Configurações de sistema
            _config->apModeForce = false; 

            //  Salva no LittleFS
            if (configManager.save(*_config)) {
                request->send(200, "application/json", "{\"status\":\"success\",\"msg\":\"Configurações salvas. Reiniciando...\"}");
                
                // Evita chamar delay() longo aqui dentro do callback assíncrono
                // O ideal é setar uma flag, mas para o MVP, um delay curto antes do restart funciona
                delay(100); 
                _shouldReboot = true; 
            } else {
                request->send(500, "application/json", "{\"status\":\"error\",\"msg\":\"Falha ao gravar no disco\"}");
            }
        }
    );

    // API: Reiniciar Gateway
    server.on("/api/restart", HTTP_POST, [](AsyncWebServerRequest *request){
        request->send(200, "application/json", "{\"msg\":\"Rebooting...\"}");
        // Delay não bloqueante para garantir envio da resposta
        // Usamos um timer simples do hardware ou flag
        // Mas no contexto Async, o delay direto trava. 
        // O ideal é setar uma flag global shouldReboot = true;
        // Para simplificar aqui:
        delay(100); 
        _shouldReboot = true;
    });

    // API: Factory Reset
    server.on("/api/reset", HTTP_POST, [this, &configManager](AsyncWebServerRequest *request){
        configManager.reset(); // Apaga o arquivo config.json
        request->send(200, "application/json", "{\"msg\":\"Resetted. Rebooting as AP...\"}");
        delay(1000);
        _shouldReboot = true;
    });

    // API: Scan de Redes WiFi (Para o usuário escolher no dropdown)
    server.on("/api/scan", HTTP_GET, [](AsyncWebServerRequest *request){
        int n = WiFi.scanNetworks();
        JsonDocument doc;
        JsonArray array = doc.to<JsonArray>();
        
        for (int i = 0; i < n; ++i) {
            JsonObject net = array.add<JsonObject>();
            net["ssid"] = WiFi.SSID(i);
            net["rssi"] = WiFi.RSSI(i);
            net["secure"] = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });

    // Inicia o servidor
    server.begin();
    Serial.println("🌍 WebServer Iniciado");
}