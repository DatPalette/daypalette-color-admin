import type { SamplingBatchDocument } from '@daypalette-color-admin/contracts';

export type UpsertSamplingBatchDto = Omit<SamplingBatchDocument, 'updatedAt' | 'summary' | 'version'> & {
  summary?: SamplingBatchDocument['summary'];
  updatedAt?: string;
  version?: number;
};