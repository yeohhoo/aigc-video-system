import { Module } from '@nestjs/common';
import { VolcengineClient } from './volcengine.client';
import { VolcengineImageService } from './volcengine-image.service';
import { VolcengineProvider } from './volcengine.provider';
import { VolcengineTtsService } from './volcengine-tts.service';

@Module({
  providers: [VolcengineClient, VolcengineProvider, VolcengineImageService, VolcengineTtsService],
  exports: [VolcengineClient, VolcengineProvider, VolcengineImageService, VolcengineTtsService],
})
export class VolcengineModule {}
