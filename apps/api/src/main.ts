import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const caCert = Buffer.from(configService.getOrThrow('CA_CERT_B64'), 'base64');
  const backendCert = Buffer.from(
    configService.getOrThrow('BACKEND_CERT_B64'),
    'base64',
  );
  const backendKey = Buffer.from(
    configService.getOrThrow('BACKEND_KEY_B64'),
    'base64',
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: process.env.MQTT_URL,
      rejectUnauthorized: true,
      ca: [caCert],
      cert: backendCert,
      key: backendKey,
      clientId: 'backend-service-' + Math.random().toString(16).substring(2, 8),
    },
  });
  app.enableCors({
    origin: '*', //only dev, warn!
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  setupSwagger(app);
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  logger.log(`API running on ${process.env.PORT ?? 3000}`);
  logger.log(`MQTT Microservice is listening on ${process.env.MQTT_URL}`);
}
bootstrap();
