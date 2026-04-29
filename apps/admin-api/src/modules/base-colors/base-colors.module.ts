import { Module } from '@nestjs/common';
import { BaseColorsController } from './base-colors.controller';
import { BaseColorsService } from './base-colors.service';

@Module({
  controllers: [BaseColorsController],
  providers: [BaseColorsService],
})
export class BaseColorsModule {}