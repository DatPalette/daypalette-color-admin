import type { DictionaryItem } from '../../../common/types/palette-data.types';

export type CreateDictionaryItemDto = Omit<
  DictionaryItem,
  'deleteReason' | 'deletedAt' | 'isDeleted'
>;