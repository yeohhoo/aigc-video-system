import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { ScriptService } from './script.service';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get()
  list() {
    return this.scriptService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.scriptService.getById(id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateScriptDto) {
    return this.scriptService.generate(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scriptService.remove(id);
  }
}
