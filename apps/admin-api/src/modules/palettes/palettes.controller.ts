import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { CreatePaletteDto } from './dto/create-palette.dto';
import type { DeletePaletteDto } from './dto/delete-palette.dto';
import type { UpdatePaletteDto } from './dto/update-palette.dto';
import { PalettesService } from './palettes.service';

@Controller('api/palettes')
export class PalettesController {
  constructor(private readonly palettesService: PalettesService) {}

  @Get()
  getCollection(@Query('includeDeleted') includeDeleted?: string) {
    return this.palettesService.getCollection(includeDeleted === 'true');
  }

  @Post()
  createItem(@Body() payload: CreatePaletteDto) {
    return this.palettesService.createItem(payload);
  }

  @Get(':id/delete-check')
  getDeleteCheck(@Param('id') id: string) {
    return this.palettesService.getDeleteCheck(id);
  }

  @Put(':id')
  updateItem(@Param('id') id: string, @Body() payload: UpdatePaletteDto) {
    return this.palettesService.updateItem(id, payload);
  }

  @Delete(':id')
  deleteItem(@Param('id') id: string, @Body() payload: DeletePaletteDto) {
    return this.palettesService.deleteItem(id, payload);
  }

  @Post(':id/restore')
  restoreItem(@Param('id') id: string) {
    return this.palettesService.restoreItem(id);
  }
}