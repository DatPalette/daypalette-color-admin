import type { CollectionRecord } from '../../../common/types/palette-data.types';

export type UpdateCollectionDto = Omit<
  CollectionRecord,
  'deleteReason' | 'deletedAt' | 'id' | 'previousStatus'
>;
