import type { SamplingRunOperationType } from '@daypalette-color-admin/contracts';
import type { GenerateSamplingCandidatesDto } from '../../sampling-batches/dto/generate-sampling-candidates.dto';

export type CreateSamplingRunDto = {
  batchId: string;
  generateCandidates?: GenerateSamplingCandidatesDto;
  operationType?: SamplingRunOperationType;
};
