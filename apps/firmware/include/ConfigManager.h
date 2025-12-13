#pragma once
#include <Arduino.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include "AppConfig.h"

class ConfigManager {
public:
    // Inicializa o sistema de arquivos (LittleFS)
    bool begin();

    // Carrega o arquivo JSON para a struct SystemConfig
    SystemConfig load();

    // Salva a struct SystemConfig de volta para o JSON
    bool save(const SystemConfig &config);

    // Restaura as configurações de fábrica (apaga o json atual)
    void reset();

private:
    const char* CONFIG_FILE = "/config.json";
    
    // Converte JSON -> Struct
    SystemConfig deserialize(const JsonDocument &doc);
    
    // Converte Struct -> JSON
    void serialize(const SystemConfig &config, JsonDocument &doc);
};