import { Controller, Get } from '@nestjs/common';
import { PalettesService } from './palettes.service';

@Controller('api/palettes')
export class PalettesController {
  constructor(private readonly palettesService: PalettesService) {}

  @Get()
  getCollection() {
    return this.palettesService.getCollection();
  }
}