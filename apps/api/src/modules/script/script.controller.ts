import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateScriptSceneDto } from './dto/create-script-scene.dto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { RegenerateScriptDto } from './dto/regenerate-script.dto';
import { UpdateScriptSceneDto } from './dto/update-script-scene.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScriptDto) {
    return this.scriptService.update(id, dto);
  }

  @Post(':id/scenes')
  addScene(@Param('id') id: string, @Body() dto: CreateScriptSceneDto) {
    return this.scriptService.addScene(id, dto);
  }

  @Patch(':id/scenes/:sceneId')
  updateScene(
    @Param('id') id: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: UpdateScriptSceneDto,
  ) {
    return this.scriptService.updateScene(id, sceneId, dto);
  }

  @Delete(':id/scenes/:sceneId')
  removeScene(@Param('id') id: string, @Param('sceneId') sceneId: string) {
    return this.scriptService.removeScene(id, sceneId);
  }

  @Post(':id/regenerate')
  regenerate(@Param('id') id: string, @Body() dto: RegenerateScriptDto) {
    return this.scriptService.regenerate(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scriptService.remove(id);
  }
}
