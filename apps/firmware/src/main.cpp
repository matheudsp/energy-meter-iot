#include <Arduino.h>
#include "AppConfig.h"
#include "ConfigManager.h"
#include "NetworkManager.h"
#include "ModbusWorker.h"
#include "MqttWorker.h"
#include "ProvisioningManager.h"

// --- Definições de Hardware ---
#define LED_PIN 2       // LED azul on-board do ESP32 (GPIO 2)
#define BUTTON_PIN 0    // Botão BOOT do ESP32 (GPIO 0)

// Globais
SystemConfig sysConfig;
QueueHandle_t readingQueue; // Fila para passar dados do Modbus -> MQTT

// Instâncias dos Gerenciadores
ConfigManager configManager;
NetworkManager networkManager;
ModbusWorker modbusWorker;
ProvisioningManager provManager;
MqttWorker mqttWorker;

// Variáveis para controle do botão físico
unsigned long buttonPressTime = 0;
bool buttonPressed = false;

// --- Lógica do Botão Físico (Reset de Emergência) ---
void checkPhysicalButton() {
    // O botão BOOT é LOW quando pressionado (pull-up interno)
    if (digitalRead(BUTTON_PIN) == LOW) {
        if (!buttonPressed) {
            buttonPressed = true;
            buttonPressTime = millis();
            Serial.println("🔘 Botão pressionado...");
        }
        
        // Se segurar por mais de 5 segundos
        if ((millis() - buttonPressTime) > 5000) {
            Serial.println("⚠️ RESET DE FÁBRICA SOLICITADO PELO BOTÃO!");
            
            // Pisca o LED freneticamente para avisar o usuário
            for(int i=0; i<20; i++) {
                digitalWrite(LED_PIN, !digitalRead(LED_PIN));
                delay(50);
            }
            
            configManager.reset(); // Apaga o config.json
            ESP.restart();         // Reinicia (voltará em modo AP)
        }
    } else {
        if (buttonPressed) {
            buttonPressed = false;
            Serial.println("🔘 Botão solto.");
        }
    }
}

// --- Tarefa 1: Rede e WebServer (Core 0) ---
vvoid taskNetwork(void *parameter) {
    networkManager.begin(sysConfig);
    networkManager.setupWebServer(configManager);

    // Só tenta provisionar se tiver WiFi e ainda não tiver certificados
    while (!networkManager.isWifiConnected()) {
        vTaskDelay(pdMS_TO_TICKS(500));
    }

    if (!provManager.isProvisioned()) {
        Serial.println("⚠️ Dispositivo não autorizado. Tentando obter permissão...");
        
        // Assume que a API está no mesmo IP do Broker MQTT, porta 3000
        // (Ou adicione um campo 'apiUrl' no AppConfig.h para ser mais correto)
        String apiUrl = "http://" + sysConfig.mqttServer + ":3000";
        
        if (provManager.performProvisioning(apiUrl, sysConfig.deviceId)) {
            Serial.println("🎉 Autorização obtida! Reiniciando para aplicar segurança...");
            vTaskDelay(2000);
            ESP.restart(); // Reinicia para carregar limpo com os novos certs
        } else {
            Serial.println("⛔ Falha no provisionamento. Verifique se o dispositivo está cadastrado no backend.");
        }
    } else {
        // Se já está provisionado, carrega no MQTT
        mqttWorker.loadCredentials();
    }
  

    while (true) {
        networkManager.loop(); 
        mqttWorker.loop();     
        vTaskDelay(pdMS_TO_TICKS(10)); 
    }
}

// --- Tarefa 2: Leitura Modbus (Core 1) ---
void taskModbus(void *parameter) {
    modbusWorker.begin(); // Configura Serial2 (RS485)

    while (true) {
        unsigned long start = millis();

        // Itera sobre os medidores configurados
        for (const auto &meter : sysConfig.meters) {
            MeterReading reading;
            
            // Tenta ler do hardware RS485
            if (modbusWorker.readMeter(meter.modbusId, reading)) {
                
                //  Usa o channelIndex configurado manualmente
                reading.channelId = meter.channelIndex; 
                
                // Envia para a Fila
                xQueueSend(readingQueue, &reading, pdMS_TO_TICKS(100));
            }
            vTaskDelay(pdMS_TO_TICKS(50));
        }

        // Espera o intervalo configurado (Ex: 5 min)
        // Nota: Cálculo simplificado. O ideal é usar millis() diff para precisão.
        vTaskDelay(pdMS_TO_TICKS(sysConfig.interval * 1000));
    }
}

// --- Tarefa 3: Processador de Fila MQTT (Core 1) ---
void taskMqttPublisher(void *parameter) {
    MeterReading incomingReading;

    while (true) {
        // Fica bloqueado aqui até chegar algo na fila
        if (xQueueReceive(readingQueue, &incomingReading, portMAX_DELAY)) {
            
            // Chegou dado! Publica no broker
            if (networkManager.isWifiConnected()) {
                mqttWorker.publishReading(sysConfig.deviceId, incomingReading);
                Serial.printf(">> Enviado canal %d: %.2f kWh\n", incomingReading.channelId, incomingReading.totalKwh);
            } else {
                Serial.println("!! Sem WiFi, descartando leitura (bufferizar futuramente)");
            }
        }
    }
}

void setup() {
    Serial.begin(115200);
    
    // 1. Carregar Configurações
    if (!configManager.begin()) {
        Serial.println("Erro no LittleFS! Formatando...");
    }
    sysConfig = configManager.load();

    // 2. Criar Fila de Dados (Capacidade para 50 leituras)
    readingQueue = xQueueCreate(50, sizeof(MeterReading));

    // 3. Criar Tarefas
    // Core 0: Coisas de Rede (WiFi, WebServer)
    xTaskCreatePinnedToCore(taskNetwork, "NetTask", 4096, NULL, 1, NULL, 0);

    // Core 1: Coisas de Hardware e Lógica (Modbus, MQTT Publish)
    // Prioridade do Modbus é mais alta (2) para garantir precisão no tempo
    xTaskCreatePinnedToCore(taskModbus, "ModbusTask", 4096, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(taskMqttPublisher, "PubTask", 4096, NULL, 1, NULL, 1);

    Serial.println("--- EnergyMe Firmware Iniciado ---");
}

void loop() {
    checkPhysicalButton();

    // --- Lógica do LED de Status (Heartbeat Visual) ---
    // Aceso Fixo: Tudo Conectado (WiFi + MQTT)
    // Piscando Lento (1s): Só WiFi (sem MQTT)
    // Piscando Rápido (200ms): Modo AP ou Desconectado
    
    static unsigned long lastBlink = 0;
    int interval = 0;
    bool ledState = digitalRead(LED_PIN);

    // Verifica status usando os métodos que vamos adicionar abaixo
    if (networkManager.isApMode()) {
        interval = 200; // Modo AP = Rápido
    } else if (networkManager.isWifiConnected()) {
        if (mqttWorker.isConnected()) {
            digitalWrite(LED_PIN, HIGH); // Tudo OK = Aceso
            delay(100); // Pequeno delay para não comer CPU neste loop
            return;
        } else {
            interval = 1000; // Sem MQTT = Lento
        }
    } else {
        interval = 200; // Sem WiFi = Rápido
    }

    if (millis() - lastBlink > interval) {
        lastBlink = millis();
        digitalWrite(LED_PIN, !ledState);
    }
    
    delay(20); // Delay pequeno para debounce do botão e economia de CPU
}