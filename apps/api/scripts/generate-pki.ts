import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';

// Configurações
const OUT_DIR = path.join(__dirname, '../certs');
const CA_CN = 'EnergyMeter Root CA';
const SERVER_CN = 'localhost';
const VALIDITY_YEARS = 10;

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('🔐 Iniciando geração de PKI com Node.js...');

function generateKeyPair(): forge.pki.rsa.KeyPair {
  // 2048 bits é um bom equilíbrio entre segurança e performance para RSA
  return forge.pki.rsa.generateKeyPair(2048);
}

function certToPem(cert: forge.pki.Certificate): string {
  return forge.pki.certificateToPem(cert);
}

function keyToPem(key: forge.pki.PrivateKey): string {
  return forge.pki.privateKeyToPem(key);
}

function toBase64(pem: string): string {
  return Buffer.from(pem).toString('base64');
}

// --- 1. GERAR CA (Autoridade Certificadora) ---
console.log('1️⃣  Gerando CA (Isso pode levar alguns segundos)...');
const caKeys = generateKeyPair();
const caCert = forge.pki.createCertificate();

caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = '01';
caCert.validity.notBefore = new Date();
caCert.validity.notAfter = new Date();
caCert.validity.notAfter.setFullYear(
  caCert.validity.notBefore.getFullYear() + VALIDITY_YEARS,
);

const caAttrs = [
  { name: 'commonName', value: CA_CN },
  { name: 'countryName', value: 'BR' },
  { shortName: 'ST', value: 'SP' },
  { name: 'organizationName', value: 'EnergyMeter IoT' },
];

caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs); // Auto-assinado

// Extensões para CA
caCert.setExtensions([
  { name: 'basicConstraints', cA: true, critical: true },
  { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
]);

// Assinar a CA com sua própria chave
caCert.sign(caKeys.privateKey, forge.md.sha256.create());

const caCertPem = certToPem(caCert);
const caKeyPem = keyToPem(caKeys.privateKey);

// Salvar arquivos CA
fs.writeFileSync(path.join(OUT_DIR, 'ca.crt'), caCertPem);
fs.writeFileSync(path.join(OUT_DIR, 'ca.key'), caKeyPem);

// --- 2. GERAR CERTIFICADO DO SERVIDOR (Mosquitto) ---
console.log('2️⃣  Gerando Certificado do Servidor...');
const serverKeys = generateKeyPair();
const serverCert = forge.pki.createCertificate();

serverCert.publicKey = serverKeys.publicKey;
serverCert.serialNumber = '02'; // Serial deve ser único
serverCert.validity.notBefore = new Date();
serverCert.validity.notAfter = new Date();
serverCert.validity.notAfter.setFullYear(
  serverCert.validity.notBefore.getFullYear() + VALIDITY_YEARS,
);

const serverAttrs = [
  { name: 'commonName', value: SERVER_CN },
  { name: 'organizationName', value: 'EnergyMe IoT' },
];

serverCert.setSubject(serverAttrs);
serverCert.setIssuer(caAttrs); // Assinado pela nossa CA

// Extensões para Servidor (importante ter SAN para clientes modernos)
serverCert.setExtensions([
  { name: 'basicConstraints', cA: false },
  { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
  { name: 'extKeyUsage', serverAuth: true },
  {
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
    ],
  },
]);

// Assinar o certificado do servidor com a CHAVE DA CA
serverCert.sign(caKeys.privateKey, forge.md.sha256.create());

const serverCertPem = certToPem(serverCert);
const serverKeyPem = keyToPem(serverKeys.privateKey);

// Salvar arquivos do Servidor
fs.writeFileSync(path.join(OUT_DIR, 'server.crt'), serverCertPem);
fs.writeFileSync(path.join(OUT_DIR, 'server.key'), serverKeyPem);

// --- 3. GERAR CERTIFICADO CLIENTE PARA O BACKEND (NOVO) ---
console.log('3️⃣  Gerando Certificado do Backend (NestJS)...');
const backendKeys = generateKeyPair();
const backendCert = forge.pki.createCertificate();

backendCert.publicKey = backendKeys.publicKey;
backendCert.serialNumber = '03'; // Serial único
backendCert.validity.notBefore = new Date();
backendCert.validity.notAfter = new Date();
backendCert.validity.notAfter.setFullYear(
  backendCert.validity.notBefore.getFullYear() + VALIDITY_YEARS,
);

// O Common Name (CN) DEVE ser "backend-system" para bater com o acl.conf
const backendAttrs = [
  { name: 'commonName', value: 'backend-system' },
  { name: 'organizationName', value: 'EnergyMe IoT' },
];

backendCert.setSubject(backendAttrs);
backendCert.setIssuer(caAttrs); // Assinado pela nossa CA

backendCert.setExtensions([
  { name: 'basicConstraints', cA: false },
  { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
  { name: 'extKeyUsage', clientAuth: true }, // Permite autenticação como cliente
]);

// Assinar o certificado do backend com a CHAVE DA CA
backendCert.sign(caKeys.privateKey, forge.md.sha256.create());

const backendCertPem = certToPem(backendCert);
const backendKeyPem = keyToPem(backendKeys.privateKey);

// Salvar arquivos do Backend (útil para debug ou uso local)
fs.writeFileSync(path.join(OUT_DIR, 'backend.crt'), backendCertPem);
fs.writeFileSync(path.join(OUT_DIR, 'backend.key'), backendKeyPem);

// ---  EXIBIR SAÍDA PARA O .ENV ---
console.log('\n✅ Certificados gerados com sucesso em:', OUT_DIR);
console.log(
  '📂 Configure o docker-compose para montar esta pasta no Mosquitto.',
);

console.log('\n📋 --- COPIE ABAIXO PARA SEU .ENV ---\n');
console.log(`CA_CERT_B64=${toBase64(caCertPem)}`);
console.log(`CA_KEY_B64=${toBase64(caKeyPem)}`);
console.log(`BACKEND_CERT_B64=${toBase64(backendCertPem)}`);
console.log(`BACKEND_KEY_B64=${toBase64(backendKeyPem)}`);
console.log('\n-------------------------------------\n');
