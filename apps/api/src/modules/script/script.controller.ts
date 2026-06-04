import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { ScriptService } from './script.service';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get('references')
  listReferences() {
    return this.scriptService.listReferences();
  }

  @Get('references/:id')
  getReferenceById(@Param('id') id: string) {
    return this.scriptService.getReferenceById(id);
  }

  @Get('templates')
  listTemplates() {
    return this.scriptService.listTemplates();
  }

  @Get('templates/:id')
  getTemplateById(@Param('id') id: string) {
    return this.scriptService.getTemplateById(id);
  }

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
