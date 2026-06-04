import { Module } from '@nestjs/common';
import { ProviderModule } from '../../integrations/provider.module';
import { CreationPipelineService } from './creation-pipeline.service';
import { CreationController } from './creation.controller';
import { CreationService } from './creation.service';

@Module({
  imports: [ProviderModule],
  controllers: [CreationController],
  providers: [CreationService, CreationPipelineService],
})
export class CreationModule {}
