import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreationModule } from './modules/creation/creation.module';
import { MaterialModule } from './modules/material/material.module';
import { ScriptModule } from './modules/script/script.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MaterialModule, ScriptModule, CreationModule],
})
export class AppModule {}
