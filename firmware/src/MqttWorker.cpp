#include "MqttWorker.h"

extern SystemConfig sysConfig; 

MqttWorker::MqttWorker() : client(espClient) {
    client.setBufferSize(1024); 
}

bool MqttWorker::loadCredentials() {
    if (!LittleFS.exists("/ca.crt") || !LittleFS.exists("/device.crt") || !LittleFS.exists("/device.key")) {
        Serial.println("⚠️ MqttWorker: Certificados não encontrados no disco.");
        return false;
    }

    String ca = LittleFS.open("/ca.crt").readString();
    String cert = LittleFS.open("/device.crt").readString();
    String key = LittleFS.open("/device.key").readString();

    espClient.setCACert(ca.c_str());
    espClient.setCertificate(cert.c_str());
    espClient.setPrivateKey(key.c_str());

    _credentialsLoaded = true;
    Serial.println("🔐 MqttWorker: Credenciais mTLS carregadas!");
    return true;
}

void MqttWorker::loop() {
    if (sysConfig.mqttServer.isEmpty()) return;

    if (!_credentialsLoaded) {
        if (!loadCredentials()) return; 
    }

    if (client.getServer().toString() != sysConfig.mqttServer) {
        int port = (sysConfig.mqttPort == 1883) ? 8883 : sysConfig.mqttPort;
        client.setServer(sysConfig.mqttServer.c_str(), port);
    }

    if (!client.connected()) {
        reconnect();
    }
    client.loop();
}

void MqttWorker::reconnect() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (!_credentialsLoaded) return;

    Serial.print("📡 Conectando MQTT Seguro... ");
    
    if (client.connect(sysConfig.deviceId.c_str())) {
        Serial.println("Conectado!");
    } else {
        Serial.print("Falha, rc=");
        Serial.print(client.state());
        
        char buf[256];
        espClient.lastError(buf, 256);
        Serial.printf(" (SSL Error: %s)\n", buf);
    }
}
bool MqttWorker::isConnected() {
    return client.connected();
}
bool MqttWorker::publishReading(String deviceId, const MeterReading &reading) {
    if (!client.connected()) return false;

    // 1. Criar o JSON
    // Tamanho calculado para garantir (Payload simples ~200 bytes)
    JsonDocument doc; 
    
    doc["device_id"] = deviceId;
    
    // Timestamp é opcional no backend (ele usa o server time se omitido)
    // doc["timestamp"] = millis(); 

    // Cria o objeto aninhado "channels": { "ID": { ... } }
    JsonObject channels = doc["channels"].to<JsonObject>();
    
    // A chave é o ID do canal (ex: "1", "2") convertido para string
    String channelKey = String(reading.channelId);
    JsonObject chData = channels[channelKey].to<JsonObject>();
    
    chData["voltage"] = reading.voltage;
    chData["current"] = reading.current;
    chData["power"] = reading.power;
    chData["total_kwh"] = reading.totalKwh;

    // 2. Serializar para String
    String jsonString;
    serializeJson(doc, jsonString);

    // 3. Publicar
    String topic = "energymeter/" + deviceId + "/data";
    
    // Aumenta o buffer se necessário (padrão é 256 bytes)
    client.setBufferSize(512); 
    
    return client.publish(topic.c_str(), jsonString.c_str());
}