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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creationService.remove(id);
  }
}
