import type { PaletteRecord } from '../../../common/types/palette-data.types';

export type UpdatePaletteDto = Omit<
  PaletteRecord,
  'deleteReason' | 'deletedAt' | 'id' | 'previousStatus'
>;
