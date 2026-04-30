import type { BaseColorRecord } from '../../../common/types/palette-data.types';

export type CreateBaseColorDto = Omit<
  BaseColorRecord,
  'deleteReason' | 'deletedAt' | 'previousStatus'
>;