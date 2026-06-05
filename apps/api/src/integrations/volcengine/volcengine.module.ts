import { Module } from '@nestjs/common';
import { VolcengineClient } from './volcengine.client';
import { VolcengineProvider } from './volcengine.provider';
import { VolcengineTtsService } from './volcengine-tts.service';

@Module({
  providers: [VolcengineClient, VolcengineProvider, VolcengineTtsService],
  exports: [VolcengineClient, VolcengineProvider, VolcengineTtsService],
})
export class VolcengineModule {}
