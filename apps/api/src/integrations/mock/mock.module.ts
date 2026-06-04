import { Module } from '@nestjs/common';
import { MockProvider } from './mock.provider';

@Module({
  providers: [MockProvider],
  exports: [MockProvider],
})
export class MockModule {}
