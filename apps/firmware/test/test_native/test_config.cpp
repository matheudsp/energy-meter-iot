#include <unity.h>
#include <ArduinoJson.h>

// --- TRUQUES PARA O TESTE ---
#include "../mocks/Arduino.h"
#include "../mocks/LittleFS.h"

#define private public
#include "../../src/ConfigManager.cpp"

// --- FUNÇÕES OBRIGATÓRIAS DO UNITY (ADICIONE ISTO) ---
void setUp(void)
{
  // Roda antes de cada teste. Se precisar limpar algo, coloque aqui.
}

void tearDown(void)
{
  // Roda depois de cada teste.
}

// --- CASOS DE TESTE ---

void test_channel_index_parsing()
{
  // (Mantenha o código do teste igual estava)
  JsonDocument doc;
  doc["wifi"]["ssid"] = "TestNet";

  JsonObject meter = doc["meters"].add<JsonObject>();
  meter["id"] = 1;
  meter["channel_index"] = 99;
  meter["modbus_id"] = 10;
  meter["name"] = "Ar Condicionado";

  ConfigManager manager;
  // Lembre-se que agora o deserialize pede const JsonDocument&
  // O código do teste em si não muda, pois passamos o doc criado acima
  SystemConfig result = manager.deserialize(doc);

  TEST_ASSERT_EQUAL_INT(1, result.meters.size());
  TEST_ASSERT_EQUAL_INT(99, result.meters[0].channelIndex);
  TEST_ASSERT_EQUAL_STRING("Ar Condicionado", result.meters[0].name.c_str());
}

void test_legacy_compatibility()
{
  JsonDocument doc;
  JsonObject meter = doc["meters"].add<JsonObject>();
  meter["id"] = 5;
  // Sem channel_index

  ConfigManager manager;
  SystemConfig result = manager.deserialize(doc);

  TEST_ASSERT_EQUAL_INT(5, result.meters[0].channelIndex);
}

int main(int argc, char **argv)
{
  UNITY_BEGIN();
  RUN_TEST(test_channel_index_parsing);
  RUN_TEST(test_legacy_compatibility);
  UNITY_END();
  return 0;
}