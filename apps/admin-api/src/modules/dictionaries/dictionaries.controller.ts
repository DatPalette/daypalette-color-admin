import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import type { DeleteDictionaryItemDto } from './dto/delete-dictionary-item.dto';
import type { UpdateDictionaryDto } from './dto/update-dictionary.dto';
import { DictionariesService } from './dictionaries.service';

@Controller('api/dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get()
  getCollection(@Query('includeDeleted') includeDeleted?: string) {
    return this.dictionariesService.getCollection(includeDeleted === 'true');
  }

  @Put(':key')
  updateDictionary(
    @Param('key') key: string,
    @Body() payload: UpdateDictionaryDto,
  ) {
    return this.dictionariesService.updateDictionary(key, payload);
  }

  @Post(':key/items')
  createItem(
    @Param('key') key: string,
    @Body() payload: CreateDictionaryItemDto,
  ) {
    return this.dictionariesService.createItem(key, payload);
  }

  @Get(':key/items/:id/delete-check')
  getItemDeleteCheck(@Param('key') key: string, @Param('id') id: string) {
    return this.dictionariesService.getItemDeleteCheck(key, id);
  }

  @Delete(':key/items/:id')
  deleteItem(
    @Param('key') key: string,
    @Param('id') id: string,
    @Body() payload: DeleteDictionaryItemDto,
  ) {
    return this.dictionariesService.deleteItem(key, id, payload);
  }

  @Post(':key/items/:id/restore')
  restoreItem(@Param('key') key: string, @Param('id') id: string) {
    return this.dictionariesService.restoreItem(key, id);
  }
}
