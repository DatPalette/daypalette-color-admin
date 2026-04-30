import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { CreateBaseColorDto } from './dto/create-base-color.dto';
import type { DeleteBaseColorDto } from './dto/delete-base-color.dto';
import type { UpdateBaseColorDto } from './dto/update-base-color.dto';
import { BaseColorsService } from './base-colors.service';

@Controller('api/base-colors')
export class BaseColorsController {
  constructor(private readonly baseColorsService: BaseColorsService) {}

  @Get()
  getCollection(@Query('includeDeleted') includeDeleted?: string) {
    return this.baseColorsService.getCollection(includeDeleted === 'true');
  }

  @Post()
  createItem(@Body() payload: CreateBaseColorDto) {
    return this.baseColorsService.createItem(payload);
  }

  @Get(':id/delete-check')
  getDeleteCheck(@Param('id') id: string) {
    return this.baseColorsService.getDeleteCheck(id);
  }

  @Put(':id')
  updateItem(@Param('id') id: string, @Body() payload: UpdateBaseColorDto) {
    return this.baseColorsService.updateItem(id, payload);
  }

  @Delete(':id')
  deleteItem(@Param('id') id: string, @Body() payload: DeleteBaseColorDto) {
    return this.baseColorsService.deleteItem(id, payload);
  }

  @Post(':id/restore')
  restoreItem(@Param('id') id: string) {
    return this.baseColorsService.restoreItem(id);
  }
}