#pragma once
#include <Arduino.h>
#include <LittleFS.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "AppConfig.h"

#include "mbedtls/pk.h"
#include "mbedtls/x509_csr.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ctr_drbg.h"
#include "mbedtls/error.h"

class ProvisioningManager {
public:
    bool isProvisioned();

   
    bool performProvisioning(const String &apiUrl, const String &deviceId);

private:
   
    const char* PATH_CA   = "/ca.crt";
    const char* PATH_CERT = "/device.crt";
    const char* PATH_KEY  = "/device.key";

    bool generateCsr(String deviceId, String &outCsr, String &outPrivateKey);
    
    bool requestSigning(const String &apiUrl, const String &deviceId, const String &csr, String &outCert, String &outCa);
    
    bool saveFile(const char* path, const String &content);
};