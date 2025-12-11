#pragma once
#include <Arduino.h>
#include <vector>

// Estrutura de um medidor individual
struct MeterConfig {
    uint8_t id;         // ID interno (ex: 1, 2)
    uint8_t modbusId;   // Endereço no barramento RS485 (ex: 10, 11)
    String name;        // Ex: "Kitnet 101"
};

// Estrutura global de configuração
struct SystemConfig {
    // WiFi
    String wifiSsid;
    String wifiPass;
    bool apModeForce;

    // MQTT
    String mqttServer;
    int mqttPort;
    String deviceId;    // Ex: "central_condominio_01"
    int interval;       // Intervalo de envio em segundos

    // Medidores
    std::vector<MeterConfig> meters;
};

// Estrutura de Leitura (O que vai para a fila MQTT)
struct MeterReading {
    uint8_t channelId;
    float voltage;
    float current;
    float power;
    float totalKwh;
};