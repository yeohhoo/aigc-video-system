import { Module } from '@nestjs/common';
import { VolcengineClient } from './volcengine.client';
import { VolcengineProvider } from './volcengine.provider';

@Module({
  providers: [VolcengineClient, VolcengineProvider],
  exports: [VolcengineClient, VolcengineProvider],
})
export class VolcengineModule {}
