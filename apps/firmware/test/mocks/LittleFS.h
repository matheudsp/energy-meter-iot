#pragma once
#include "Arduino.h"

class File
{
public:
  operator bool() const { return true; }
  void close() {}

  // Usado por algumas libs
  size_t readBytes(char *buffer, size_t length) { return 0; }

  // --- MÉTODOS PARA ARDUINOJSON v7 ---

  int read() { return -1; }

  size_t write(uint8_t c) { return 1; }
  size_t write(const uint8_t *buffer, size_t length) { return length; }
};

class LittleFSMock
{
public:
  bool begin(bool fmt) { return true; }
  bool exists(const char *path) { return false; }
  bool remove(const char *path) { return true; }

  File open(const char *path, const char *mode)
  {
    return File();
  }
};

static LittleFSMock LittleFS;