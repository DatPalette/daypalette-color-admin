import { Module } from '@nestjs/common';
import { BaseColorsModule } from './modules/base-colors/base-colors.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { DictionariesModule } from './modules/dictionaries/dictionaries.module';
import { HealthModule } from './modules/health/health.module';
import { PalettesModule } from './modules/palettes/palettes.module';
import { SamplingBatchesModule } from './modules/sampling-batches/sampling-batches.module';
import { SamplingRunsModule } from './modules/sampling-runs/sampling-runs.module';
import { ImageExtractionModule } from './modules/image-extraction/image-extraction.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    HealthModule,
    DictionariesModule,
    BaseColorsModule,
    PalettesModule,
    CollectionsModule,
    SamplingBatchesModule,
    SamplingRunsModule,
    ImageExtractionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
