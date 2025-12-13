import * as mqtt from 'mqtt';
import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';
import axios from 'axios';

// --- CONFIGURAÇÕES ---
const API_URL = process.env.API_URL || 'http://localhost:3000'; // URL da sua API NestJS
// Mudar para mqtts:// e porta 8883 (Segura)
const MQTT_URL = process.env.MQTT_URL || 'mqtts://localhost:8883';
const DEVICE_ID = process.env.DEVICE_ID || 'central_simulada_01';
const INTERVALO_MS = 5000;

// Pasta para salvar a identidade do dispositivo (persiste entre reinícios)
const DATA_DIR = path.join(__dirname, '../simulator_data');
const KEY_PATH = path.join(DATA_DIR, `${DEVICE_ID}.key`);
const CERT_PATH = path.join(DATA_DIR, `${DEVICE_ID}.crt`);
const CA_PATH = path.join(DATA_DIR, 'ca.crt');

// Estado global para acumular o kWh
const state = {
  ch1: { totalKwh: 100.0 },
  ch2: { totalKwh: 550.5 },
};

/**
 * Função Principal de Inicialização (Boot)
 */
async function bootstrap() {
  console.log(`🤖 Iniciando Dispositivo: ${DEVICE_ID}`);

  // 1. Garante que a pasta de dados existe
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let privateKeyPem: string;
  let certificatePem: string;
  let caPem: string;

  // 2. Verifica se o dispositivo já foi provisionado (tem arquivos?)
  if (
    fs.existsSync(KEY_PATH) &&
    fs.existsSync(CERT_PATH) &&
    fs.existsSync(CA_PATH)
  ) {
    console.log('📂 Identidade encontrada no disco. Carregando credenciais...');
    privateKeyPem = fs.readFileSync(KEY_PATH, 'utf8');
    certificatePem = fs.readFileSync(CERT_PATH, 'utf8');
    caPem = fs.readFileSync(CA_PATH, 'utf8');
  } else {
    // 3. Se não tem arquivos, inicia o AUTO-PROVISIONAMENTO
    console.log('✨ Dispositivo novo detectado. Iniciando Provisionamento...');

    try {
      // A. Gerar chaves RSA
      console.log('   🔑 Gerando par de chaves (2048 bits)...');
      const keys = forge.pki.rsa.generateKeyPair(2048);
      privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

      // B. Criar o CSR (Certificate Signing Request)
      console.log('   📝 Criando CSR...');
      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = keys.publicKey;
      // O CommonName DEVE ser o ID do dispositivo
      csr.setSubject([{ name: 'commonName', value: DEVICE_ID }]);
      csr.sign(keys.privateKey, forge.md.sha256.create());
      const csrPem = forge.pki.certificationRequestToPem(csr);

      // C. Enviar para o Backend assinar
      console.log(`   🌐 Enviando CSR para ${API_URL}/devices/provision...`);
      const response = await axios.post(`${API_URL}/devices/provision`, {
        serialNumber: DEVICE_ID,
        csr: csrPem,
      });

      certificatePem = response.data.certificate;
      caPem = response.data.caCertificate;

      // D. Salvar tudo no disco
      fs.writeFileSync(KEY_PATH, privateKeyPem);
      fs.writeFileSync(CERT_PATH, certificatePem);
      fs.writeFileSync(CA_PATH, caPem);
      console.log('   ✅ Provisionamento concluído e salvo!');
    } catch (error) {
      console.error('   ❌ Falha crítica no provisionamento:', error.message);
      if (error.response) {
        console.error('   Detalhes:', error.response.data);
        console.error(
          '   DICA: O dispositivo está cadastrado no banco de dados?',
        );
      }
      process.exit(1);
    }
  }

  // 4. Conectar ao MQTT com as credenciais obtidas
  connectToMqtt(privateKeyPem, certificatePem, caPem);
}

function connectToMqtt(key: string, cert: string, ca: string) {
  console.log(`📡 Conectando ao MQTT Seguro em ${MQTT_URL}...`);

  const client = mqtt.connect(MQTT_URL, {
    reconnectPeriod: 5000,
    clientId: DEVICE_ID, // Importante bater com o certificado
    // Configurações de Segurança mTLS
    key: key,
    cert: cert,
    ca: [ca],
    rejectUnauthorized: true, // Garante que não é um servidor falso
  });

  client.on('connect', () => {
    console.log(`🔒 CONECTADO via mTLS!`);
    console.log(`⏱️  Iniciando envio de telemetria a cada ${INTERVALO_MS}ms\n`);

    // Envia a primeira imediatamente
    enviarLeitura(client);

    // Loop de envio
    setInterval(() => {
      enviarLeitura(client);
    }, INTERVALO_MS);
  });

  client.on('error', (err) => {
    console.error('❌ Erro MQTT:', err.message);
  });

  client.on('close', () => {
    console.log('⚠️  Conexão MQTT fechada. Tentando reconectar...');
  });
}

// --- LÓGICA DE SIMULAÇÃO (Matemática) ---

function getNoise(amplitude: number) {
  return (Math.random() - 0.5) * 2 * amplitude;
}

function getLoadFactor() {
  const hour = new Date().getHours();
  if (hour >= 18 && hour <= 22) return 2.5; // Pico
  if (hour >= 0 && hour <= 6) return 0.2; // Madrugada
  return 1.0;
}

function enviarLeitura(client: mqtt.MqttClient) {
  const loadFactor = getLoadFactor();
  const timeInHours = INTERVALO_MS / 3600000;

  // Canal 1 (127V)
  const v1 = 127 + getNoise(3);
  const i1 = (Math.random() * 5 + 0.5) * loadFactor;
  const p1 = v1 * i1 * 0.95;
  state.ch1.totalKwh += (p1 / 1000) * timeInHours;

  // Canal 2 (220V)
  const v2 = 220 + getNoise(4);
  let i2 = (Math.random() * 3 + 1) * loadFactor;
  if (Math.random() > 0.9) i2 += 20; // Pico aleatório
  const p2 = v2 * i2 * 0.98;
  state.ch2.totalKwh += (p2 / 1000) * timeInHours;

  const payload = {
    device_id: DEVICE_ID,
    timestamp: Date.now(),
    channels: {
      '1': {
        voltage: parseFloat(v1.toFixed(1)),
        current: parseFloat(i1.toFixed(2)),
        power: parseFloat(p1.toFixed(1)),
        total_kwh: parseFloat(state.ch1.totalKwh.toFixed(3)),
      },
      '2': {
        voltage: parseFloat(v2.toFixed(1)),
        current: parseFloat(i2.toFixed(2)),
        power: parseFloat(p2.toFixed(1)),
        total_kwh: parseFloat(state.ch2.totalKwh.toFixed(3)),
      },
    },
  };

  const topic = `energymeter/${DEVICE_ID}/data`;
  client.publish(topic, JSON.stringify(payload));

  console.log(`[${new Date().toLocaleTimeString()}] 📤 Dados enviados.`);
  console.log(
    `   CH1: ${p1.toFixed(0)}W | Total: ${state.ch1.totalKwh.toFixed(3)} kWh`,
  );
  console.log(
    `   CH2: ${p2.toFixed(0)}W | Total: ${state.ch2.totalKwh.toFixed(3)} kWh`,
  );
}

// Iniciar
bootstrap();
