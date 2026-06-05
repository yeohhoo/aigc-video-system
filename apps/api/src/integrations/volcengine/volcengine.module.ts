import { Module } from '@nestjs/common';
import { VolcengineClient } from './volcengine.client';
import { VolcengineImageService } from './volcengine-image.service';
import { VolcengineProvider } from './volcengine.provider';
import { VolcengineTtsService } from './volcengine-tts.service';
import { VolcengineVideoService } from './volcengine-video.service';

@Module({
  providers: [
    VolcengineClient,
    VolcengineProvider,
    VolcengineImageService,
    VolcengineTtsService,
    VolcengineVideoService,
  ],
  exports: [
    VolcengineClient,
    VolcengineProvider,
    VolcengineImageService,
    VolcengineTtsService,
    VolcengineVideoService,
  ],
})
export class VolcengineModule {}
