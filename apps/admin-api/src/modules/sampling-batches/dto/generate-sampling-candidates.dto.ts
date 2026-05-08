export type GenerateSamplingCandidatesDto = {
  audience?: 'womenswear' | 'mixed';
  mode?: 'rules-only' | 'hybrid' | 'model-only';
  overwriteExisting?: boolean;
  resetExisting?: boolean;
  targetCount?: number;
};