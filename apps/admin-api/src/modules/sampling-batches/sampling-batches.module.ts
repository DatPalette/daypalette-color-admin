import { Module } from '@nestjs/common';
import { SamplingBatchesController } from './sampling-batches.controller';
import { SamplingCandidateGenerationService } from './sampling-candidate-generation.service';
import { SamplingBatchesService } from './sampling-batches.service';
import { LlmBatchGenerationService } from './llm-batch-generation.service';

@Module({
  controllers: [SamplingBatchesController],
  providers: [
    SamplingBatchesService,
    SamplingCandidateGenerationService,
    LlmBatchGenerationService,
  ],
  exports: [SamplingBatchesService, LlmBatchGenerationService],
})
export class SamplingBatchesModule {}
