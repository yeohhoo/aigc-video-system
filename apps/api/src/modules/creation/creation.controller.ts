import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreationService } from './creation.service';
import { CreateCreationTaskDto } from './dto/create-creation-task.dto';

@Controller('creations')
export class CreationController {
  constructor(private readonly creationService: CreationService) {}

  @Get()
  list() {
    return this.creationService.list();
  }

  @Post()
  create(@Body() dto: CreateCreationTaskDto) {
    return this.creationService.create(dto);
  }
}
