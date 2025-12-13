import { Module } from '@nestjs/common';
import { ChannelMapService } from './channel-map.service';

@Module({
  providers: [ChannelMapService],
  exports: [ChannelMapService],
})
export class ChannelMapModule {}
