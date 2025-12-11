#include "ProvisioningManager.h"

bool ProvisioningManager::isProvisioned() {
    return LittleFS.exists(PATH_CA) && 
           LittleFS.exists(PATH_CERT) && 
           LittleFS.exists(PATH_KEY);
}

bool ProvisioningManager::saveFile(const char* path, const String &content) {
    File f = LittleFS.open(path, "w");
    if (!f) return false;
    f.print(content);
    f.close();
    return true;
}

bool ProvisioningManager::performProvisioning(const String &apiUrl, const String &deviceId) {
    Serial.println("🔐 Iniciando Provisionamento Automático...");

    String csr, privateKey;
    
    if (!generateCsr(deviceId, csr, privateKey)) {
        Serial.println("❌ Falha ao gerar criptografia local.");
        return false;
    }

    String cert, ca;
    if (!requestSigning(apiUrl, deviceId, csr, cert, ca)) {
        Serial.println("❌ Falha na comunicação com a API.");
        return false;
    }

    if (saveFile(PATH_KEY, privateKey) && 
        saveFile(PATH_CERT, cert) && 
        saveFile(PATH_CA, ca)) {
        Serial.println("✅ Dispositivo provisionado e salvo com sucesso!");
        return true;
    }

    return false;
}

bool ProvisioningManager::generateCsr(String deviceId, String &outCsr, String &outPrivateKey) {
    Serial.println("... Gerando chaves RSA 2048 (isso pode demorar ~10s) ...");

    mbedtls_pk_context key;
    mbedtls_ctr_drbg_context ctr_drbg;
    mbedtls_entropy_context entropy;
    mbedtls_x509write_csr req;
    
    mbedtls_pk_init(&key);
    mbedtls_ctr_drbg_init(&ctr_drbg);
    mbedtls_entropy_init(&entropy);
    mbedtls_x509write_csr_init(&req);

    int ret;
    const char *pers = "energymeter_gen";

    if ((ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy, (const unsigned char *)pers, strlen(pers))) != 0) {
        Serial.printf("mbedtls_ctr_drbg_seed falhou: -0x%04x\n", -ret);
        return false;
    }

    if ((ret = mbedtls_pk_setup(&key, mbedtls_pk_info_from_type(MBEDTLS_PK_RSA))) != 0 ||
        (ret = mbedtls_rsa_gen_key(mbedtls_pk_rsa(key), mbedtls_ctr_drbg_random, &ctr_drbg, 2048, 65537)) != 0) {
        Serial.printf("Geração de chave falhou: -0x%04x\n", -ret);
        return false;
    }

    unsigned char output_buf[1600];
    memset(output_buf, 0, sizeof(output_buf));
    if (mbedtls_pk_write_key_pem(&key, output_buf, sizeof(output_buf)) != 0) {
        return false;
    }
    outPrivateKey = String((char *)output_buf);

    String subject = "CN=" + deviceId + ",O=EnergyMe IoT";
    if ((ret = mbedtls_x509write_csr_set_subject_name(&req, subject.c_str())) != 0) {
        return false;
    }
    
    mbedtls_x509write_csr_set_key(&req, &key);
    mbedtls_x509write_csr_set_md_alg(&req, MBEDTLS_MD_SHA256);

    memset(output_buf, 0, sizeof(output_buf));
    if ((ret = mbedtls_x509write_csr_pem(&req, output_buf, sizeof(output_buf), mbedtls_ctr_drbg_random, &ctr_drbg)) != 0) {
        return false;
    }
    outCsr = String((char *)output_buf);

    mbedtls_x509write_csr_free(&req);
    mbedtls_pk_free(&key);
    mbedtls_ctr_drbg_free(&ctr_drbg);
    mbedtls_entropy_free(&entropy);

    return true;
}

bool ProvisioningManager::requestSigning(const String &apiUrl, const String &deviceId, const String &csr, String &outCert, String &outCa) {
    HTTPClient http;
    String url = apiUrl + "/devices/provision"; 
    
    Serial.print("🌐 Conectando a: ");
    Serial.println(url);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    JsonDocument reqDoc;
    reqDoc["serialNumber"] = deviceId;
    reqDoc["csr"] = csr;
    
    String reqBody;
    serializeJson(reqDoc, reqBody);

    int httpCode = http.POST(reqBody);
    
    if (httpCode == 200 || httpCode == 201) {
        String response = http.getString();
        JsonDocument resDoc;
        deserializeJson(resDoc, response);
        
        outCert = resDoc["certificate"].as<String>();
        outCa   = resDoc["caCertificate"].as<String>();
        http.end();
        return true;
    } else {
        Serial.printf("❌ Erro API: %d\n", httpCode);
        Serial.println(http.getString());
        http.end();
        return false;
    }
}