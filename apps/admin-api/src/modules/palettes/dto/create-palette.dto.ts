import type { PaletteRecord } from '../../../common/types/palette-data.types';

export type CreatePaletteDto = Omit<
  PaletteRecord,
  'deleteReason' | 'deletedAt' | 'previousStatus'
>;
