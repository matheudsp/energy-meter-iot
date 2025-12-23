#include "ConfigManager.h"

bool ConfigManager::begin()
{
    // Tenta montar o sistema de arquivos.
    // Se falhar (primeiro boot), formata automaticamente.
    if (!LittleFS.begin(true))
    {
        Serial.println("❌ Falha ao montar LittleFS");
        return false;
    }
    return true;
}

SystemConfig ConfigManager::load()
{
    SystemConfig config; // Começa vazia (ou com defaults do construtor se tiver)

    File file = LittleFS.open(CONFIG_FILE, "r");
    if (!file)
    {
        Serial.println("⚠️ Config não encontrada, criando padrão...");
        // Se não existir, salva uma padrão e retorna ela
        // Aqui você pode definir hardcoded defaults de emergência
        config.wifiSsid = "EnergyMeter_AP";
        config.apModeForce = true;
        config.interval = 60;
        save(config);
        return config;
    }

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, file);
    file.close();

    if (error)
    {
        Serial.print("❌ Erro ao ler JSON: ");
        Serial.println(error.c_str());
        return config; // Retorna vazia/default
    }

    return deserialize(doc);
}

bool ConfigManager::save(const SystemConfig &config)
{
    JsonDocument doc;
    serialize(config, doc);

    File file = LittleFS.open(CONFIG_FILE, "w");
    if (!file)
    {
        Serial.println("❌ Falha ao abrir arquivo para escrita");
        return false;
    }

    if (serializeJson(doc, file) == 0)
    {
        Serial.println("❌ Falha ao gravar JSON");
        file.close();
        return false;
    }

    file.close();
    Serial.println("✅ Configuração salva!");
    return true;
}

void ConfigManager::reset()
{
    if (LittleFS.exists(CONFIG_FILE))
    {
        LittleFS.remove(CONFIG_FILE);
        Serial.println("♻️ Configurações resetadas (arquivo deletado)");
    }
}

// --- Métodos Privados de Conversão (Mappers) ---

SystemConfig ConfigManager::deserialize(const JsonDocument &doc)
{
    SystemConfig c;

    // WiFi
    c.wifiSsid = doc["wifi"]["ssid"] | "";
    c.wifiPass = doc["wifi"]["pass"] | "";
    c.apModeForce = doc["wifi"]["ap_mode"] | false;

    // MQTT
    c.mqttServer = doc["mqtt"]["server"] | "";
    c.mqttPort = doc["mqtt"]["port"] | 1883;
    c.deviceId = doc["mqtt"]["device_id"] | "esp32_meter";
    c.interval = doc["mqtt"]["interval"] | 300;

    JsonArrayConst meters = doc["meters"].as<JsonArrayConst>();

    for (JsonObjectConst m : meters)
    {
        MeterConfig mc;
        mc.id = m["id"];
        mc.channelIndex = m["channel_index"] | m["id"];
        mc.modbusId = m["modbus_id"];
        mc.name = m["name"].as<String>();
        c.meters.push_back(mc);
    }

    return c;
}

void ConfigManager::serialize(const SystemConfig &config, JsonDocument &doc)
{
    // WiFi
    doc["wifi"]["ssid"] = config.wifiSsid;
    doc["wifi"]["pass"] = config.wifiPass;
    doc["wifi"]["ap_mode"] = config.apModeForce;

    // MQTT
    doc["mqtt"]["server"] = config.mqttServer;
    doc["mqtt"]["port"] = config.mqttPort;
    doc["mqtt"]["device_id"] = config.deviceId;
    doc["mqtt"]["interval"] = config.interval;

    // Meters Array
    JsonArray meters = doc["meters"].to<JsonArray>();
    for (const auto &m : config.meters)
    {
        JsonObject mObj = meters.add<JsonObject>();
        mObj["id"] = m.id;
        mObj["channel_index"] = m.channelIndex;
        mObj["modbus_id"] = m.modbusId;
        mObj["name"] = m.name;
    }
}