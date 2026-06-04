import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { MaterialService } from './material.service';

@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  list() {
    return this.materialService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.materialService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateMaterialDto) {
    return this.materialService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materialService.remove(id);
  }
}
