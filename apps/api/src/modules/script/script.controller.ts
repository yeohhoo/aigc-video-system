import { Controller, Get } from '@nestjs/common';
import { ScriptService } from './script.service';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get()
  list() {
    return this.scriptService.list();
  }
}
