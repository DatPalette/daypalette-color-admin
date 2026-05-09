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
import type { DeleteCollectionDto } from './dto/delete-collection.dto';
import type { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionsService } from './collections.service';

@Controller('api/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  getCollection(@Query('includeDeleted') includeDeleted?: string) {
    return this.collectionsService.getCollection(includeDeleted === 'true');
  }

  @Get(':id/delete-check')
  getDeleteCheck(@Param('id') id: string) {
    return this.collectionsService.getDeleteCheck(id);
  }

  @Put(':id')
  updateItem(@Param('id') id: string, @Body() payload: UpdateCollectionDto) {
    return this.collectionsService.updateItem(id, payload);
  }

  @Delete(':id')
  deleteItem(@Param('id') id: string, @Body() payload: DeleteCollectionDto) {
    return this.collectionsService.deleteItem(id, payload);
  }

  @Post(':id/restore')
  restoreItem(@Param('id') id: string) {
    return this.collectionsService.restoreItem(id);
  }
}
