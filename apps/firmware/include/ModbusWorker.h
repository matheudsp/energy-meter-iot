#pragma once
#include <Arduino.h>
#include <ModbusMaster.h>
#include "AppConfig.h"

class ModbusWorker {
public:
    void begin();
    
    // Retorna true se a leitura foi bem sucedida
    bool readMeter(uint8_t modbusId, MeterReading &outReading);

private:
    ModbusMaster node;
    
    // Pinos do RS485 (ESP32)
    const int MAX485_DE = 4;  // Connect to RE & DE
    const int RX_PIN = 16;    // Serial2 RX
    const int TX_PIN = 17;    // Serial2 TX

    static void preTransmission();
    static void postTransmission();
};