import { Module, Global } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module';
import { InfluxModule } from './database/influx/influx.module';
import { AccessControlModule } from './access-control/access-control.module';

@Global()
@Module({
  imports: [PrismaModule, InfluxModule, AccessControlModule],
  providers: [],
  exports: [],
})
export class ProvidersModule {}
