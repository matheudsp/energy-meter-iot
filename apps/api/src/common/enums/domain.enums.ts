export enum UserRole {
  ADMIN = 'ADMIN',
  INTEGRATOR = 'INTEGRATOR',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

export enum DeviceStatus {
  // PROVISIONED = 'PROVISIONED', // Cadastrado, aguardando conexão
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}
