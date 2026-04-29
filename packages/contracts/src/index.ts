export type AdminResourceKey =
  | 'dictionaries'
  | 'base-colors'
  | 'palettes'
  | 'collections'

export interface SoftDeleteMetadata {
  deletedAt?: string
  deleteReason?: string
  previousStatus?: string
}

export interface DictionaryOptionState {
  isActive: boolean
  isDeleted: boolean
}