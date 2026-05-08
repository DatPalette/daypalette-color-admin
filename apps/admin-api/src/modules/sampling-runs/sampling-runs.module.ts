import { Module } from '@nestjs/common';
import { SamplingBatchesModule } from '../sampling-batches/sampling-batches.module';
import { SamplingRunsController } from './sampling-runs.controller';
import { SamplingRunsService } from './sampling-runs.service';

@Module({
  imports: [SamplingBatchesModule],
  controllers: [SamplingRunsController],
  providers: [SamplingRunsService],
})
export class SamplingRunsModule {}