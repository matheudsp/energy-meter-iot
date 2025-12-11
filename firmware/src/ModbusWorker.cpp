#include "ModbusWorker.h"

// Controle de fluxo do RS485 (Half-Duplex)
// Precisamos de ponteiros globais/estáticos porque a lib ModbusMaster usa callbacks C
int globalDePin = 4; 

void ModbusWorker::preTransmission() {
    digitalWrite(globalDePin, HIGH); // Habilita TX
}

void ModbusWorker::postTransmission() {
    digitalWrite(globalDePin, LOW);  // Habilita RX
}

void ModbusWorker::begin() {
    pinMode(MAX485_DE, OUTPUT);
    digitalWrite(MAX485_DE, LOW);
    globalDePin = MAX485_DE;

    // Inicia Serial2 (Hardware Serial) para RS485
    // 9600 8N1 é o padrão da maioria dos medidores
    Serial2.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
    
    node.begin(1, Serial2); // ID inicial temporário
    node.preTransmission(preTransmission);
    node.postTransmission(postTransmission);
    
    Serial.println("🔌 Modbus RS485 Iniciado");
}

bool ModbusWorker::readMeter(uint8_t modbusId, MeterReading &outReading) {
    node.setSlaveId(modbusId);

    // Exemplo para medidores comuns (DDS238 / Eastron)
    // Atenção: Consulte o manual do seu medidor para os endereços exatos (Hex)
    // Muitas vezes: 
    // 0x000C (12) = Voltagem
    // 0x000D (13) = Corrente
    // 0x000E (14) = Potência
    // 0x0100 ou 0x0000 = Energia Total (kWh) - geralmente são 2 registradores (float/double)

    uint8_t result;
    
    // Leitura 1: Dados instantâneos (Tensão, Corrente, Potência)
    // Lendo 10 registradores a partir do endereço 0x000C
    result = node.readHoldingRegisters(0x000C, 10); 
    
    if (result == node.ku8MBSuccess) {
        // Conversão depende do medidor (ex: valor bruto / 10 ou / 100)
        // DDS238 costuma enviar com 1 casa decimal (int 2205 = 220.5V)
        
        outReading.voltage = node.getResponseBuffer(0) / 10.0f; 
        outReading.current = node.getResponseBuffer(1) / 100.0f;
        outReading.power   = node.getResponseBuffer(3); // Às vezes é direto em Watts
        
    } else {
        Serial.printf("❌ Erro Modbus ID %d: %02X\n", modbusId, result);
        return false;
    }

    // Leitura 2: Energia Acumulada (Total kWh)
    // Geralmente em outro endereço, ex: 0x0000 ou 0x0100
    // Energia costuma ser um valor de 32 bits (2 words)
    result = node.readHoldingRegisters(0x0000, 2);
    
    if (result == node.ku8MBSuccess) {
        // Combina 2 registradores de 16 bits em um uint32
        uint32_t highWord = node.getResponseBuffer(0);
        uint32_t lowWord  = node.getResponseBuffer(1);
        uint32_t combined = (highWord << 16) | lowWord;
        
        outReading.totalKwh = combined / 100.0f; // Ex: 123456 -> 1234.56 kWh
        return true;
    }

    return false;
}