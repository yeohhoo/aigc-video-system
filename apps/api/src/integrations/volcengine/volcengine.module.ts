import { Module } from '@nestjs/common';
import { VolcengineClient } from './volcengine.client';

@Module({
  providers: [VolcengineClient],
  exports: [VolcengineClient],
})
export class VolcengineModule {}
