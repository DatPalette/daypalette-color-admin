import { Controller, Get } from '@nestjs/common';
import { DictionariesService } from './dictionaries.service';

@Controller('api/dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get()
  getCollection() {
    return this.dictionariesService.getCollection();
  }
}