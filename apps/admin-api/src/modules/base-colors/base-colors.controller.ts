import { Controller, Get } from '@nestjs/common';
import { BaseColorsService } from './base-colors.service';

@Controller('api/base-colors')
export class BaseColorsController {
  constructor(private readonly baseColorsService: BaseColorsService) {}

  @Get()
  getCollection() {
    return this.baseColorsService.getCollection();
  }
}