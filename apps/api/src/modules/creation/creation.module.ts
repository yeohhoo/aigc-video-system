import { Module } from '@nestjs/common';
import { VolcengineModule } from '../../integrations/volcengine/volcengine.module';
import { CreationController } from './creation.controller';
import { CreationService } from './creation.service';

@Module({
  imports: [VolcengineModule],
  controllers: [CreationController],
  providers: [CreationService],
})
export class CreationModule {}
