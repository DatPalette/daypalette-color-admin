import { Module } from '@nestjs/common';
import { SamplingBatchesController } from './sampling-batches.controller';
import { SamplingCandidateGenerationService } from './sampling-candidate-generation.service';
import { SamplingBatchesService } from './sampling-batches.service';

@Module({
  controllers: [SamplingBatchesController],
  providers: [SamplingBatchesService, SamplingCandidateGenerationService],
})
export class SamplingBatchesModule {}