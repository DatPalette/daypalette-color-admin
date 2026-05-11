import { Module } from '@nestjs/common';
import { ImageExtractionController } from './image-extraction.controller';
import { ImageExtractionService } from './image-extraction.service';

@Module({
  controllers: [ImageExtractionController],
  providers: [ImageExtractionService],
})
export class ImageExtractionModule {}
