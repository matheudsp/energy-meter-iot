#pragma once
#include <iostream>
#include <string>
#include <cstring>
#include <stdint.h>
#include <vector>

// Simula a classe String do Arduino usando std::string
class String : public std::string
{
public:
  String() : std::string() {}
  String(const char *s) : std::string(s ? s : "") {}
  String(const std::string &s) : std::string(s) {}
  String(int i) : std::string(std::to_string(i)) {}

  // Método as<String>() do ArduinoJson precisa disso às vezes
  const char *c_str() const { return std::string::c_str(); }
};

// Simula Serial
class SerialMock
{
public:
  void begin(long) {}
  void println(const String &s) { std::cout << s << std::endl; }
  void print(const String &s) { std::cout << s; }
  void printf(const char *fmt, ...) {}
};
static SerialMock Serial;

// Simula funções de tempo
inline unsigned long millis() { return 0; }
inline void delay(int) {}