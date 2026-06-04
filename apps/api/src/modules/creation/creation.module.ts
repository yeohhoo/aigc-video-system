import { Module } from '@nestjs/common';
import { ProviderModule } from '../../integrations/provider.module';
import { CreationController } from './creation.controller';
import { CreationService } from './creation.service';

@Module({
  imports: [ProviderModule],
  controllers: [CreationController],
  providers: [CreationService],
})
export class CreationModule {}
