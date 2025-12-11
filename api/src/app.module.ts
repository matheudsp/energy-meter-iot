import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { ProvidersModule } from './providers/providers.module';
import { ModulesModule } from './modules/modules.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [AppConfigModule, ProvidersModule, ModulesModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
