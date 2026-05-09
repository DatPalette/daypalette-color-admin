import type { BaseColorRecord } from '../../../common/types/palette-data.types';

export type UpdateBaseColorDto = Omit<
  BaseColorRecord,
  'deleteReason' | 'deletedAt' | 'id' | 'previousStatus'
>;
