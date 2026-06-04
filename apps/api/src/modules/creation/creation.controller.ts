import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreationService } from './creation.service';
import { CreateCreationDto } from './dto/create-creation.dto';

@Controller('creations')
export class CreationController {
  constructor(private readonly creationService: CreationService) {}

  @Get()
  list() {
    return this.creationService.list();
  }

  @Get(':id/progress')
  getProgress(@Param('id') id: string) {
    return this.creationService.getProgress(id);
  }

  @Get(':id/traces')
  getTraces(@Param('id') id: string) {
    return this.creationService.getTraces(id);
  }

  @Get(':id/diagnostics')
  getDiagnostics(@Param('id') id: string) {
    return this.creationService.getDiagnostics(id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.creationService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateCreationDto) {
    return this.creationService.create(dto);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.creationService.start(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.creationService.retry(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.creationService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creationService.remove(id);
  }
}
