import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './provider.interface';
import { ProviderType } from './provider.types';
import { MockModule } from './mock/mock.module';
import { MockProvider } from './mock/mock.provider';
import { VolcengineModule } from './volcengine/volcengine.module';
import { VolcengineProvider } from './volcengine/volcengine.provider';

@Module({
  imports: [ConfigModule, MockModule, VolcengineModule],
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, MockProvider, VolcengineProvider],
      useFactory: (
        configService: ConfigService,
        mockProvider: MockProvider,
        volcengineProvider: VolcengineProvider,
      ) => {
        const providerType = configService.get<ProviderType>('PROVIDER_TYPE') ?? 'mock';
        return providerType === 'volcengine' ? volcengineProvider : mockProvider;
      },
    },
  ],
  exports: [AI_PROVIDER],
})
export class ProviderModule {}
