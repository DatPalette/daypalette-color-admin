import type {
  LlmBatchGenerateParams,
  SamplingRunOperationType,
} from '@daypalette-color-admin/contracts';

export type CreateSamplingRunDto = {
  batchId: string;
  llmBatchGenerate?: LlmBatchGenerateParams;
  operationType?: SamplingRunOperationType;
};
