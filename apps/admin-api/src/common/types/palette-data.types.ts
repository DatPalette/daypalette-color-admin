export interface PaletteDataCollectionDocument<TItem> {
  items: TItem[];
  updatedAt: string;
  version: number;
}

export interface DictionaryFieldMapping {
  entity: string;
  field: string;
  selectionMode: 'mixed' | 'multi' | 'single';
}

export interface DictionaryItem {
  aliases?: string[];
  appliesTo?: string[];
  deleteReason?: string;
  deletedAt?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  id: string;
  isActive: boolean;
  isDeleted: boolean;
  labelEn: string;
  labelZh: string;
  sortOrder: number;
}

export interface DictionaryItemDeleteCheckReference {
  displayLabel: string;
  id: string;
  referenceField: string;
  resource: 'baseColor' | 'collection' | 'palette';
}

export interface DictionaryItemDeleteCheckResult {
  blockingReferences: DictionaryItemDeleteCheckReference[];
  canDelete: boolean;
  dictionaryKey: string;
  itemId: string;
  itemLabelEn: string;
  itemLabelZh: string;
}

export interface DictionaryNode {
  descriptionEn?: string;
  descriptionZh?: string;
  entityScopes: string[];
  fieldMappings: DictionaryFieldMapping[];
  items: DictionaryItem[];
  key: string;
  labelEn: string;
  labelZh: string;
  selectionMode: 'mixed' | 'multi' | 'single';
}

export interface DictionariesDocument {
  dictionaries: Record<string, DictionaryNode>;
  updatedAt: string;
  version: number;
}

export interface BaseColorRecord {
  colorFamily: string;
  deleteReason?: string;
  deletedAt?: string;
  hex: string;
  id: string;
  isNeutralCore: boolean;
  lightnessLevel: string;
  nameEn: string;
  nameZh: string;
  occasionTags: string[];
  previousStatus?: string;
  saturationLevel: string;
  seasonTags: string[];
  status: string;
  styleTags: string[];
  tone: string;
}

export interface PaletteRecord {
  accentColorId: string;
  archiveReason?: string;
  archivedAt?: string;
  deleteReason?: string;
  deletedAt?: string;
  fitPhotoScenario: boolean;
  id: string;
  isPro: boolean;
  marketSignalSummary?: string;
  moodTags: string[];
  occasionId: string;
  previousStatus?: string;
  primaryColorId: string;
  productionBatchId?: string;
  referenceMethod?: string;
  referenceSources?: PaletteReferenceSource[];
  reviewNotes?: string;
  reviewStatus?: string;
  reviewedAt?: string;
  reviewer?: string;
  safetyLevel: string;
  seasonTags: string[];
  secondaryColorId: string;
  slug: string;
  sourceCollectionIds: string[];
  sourceType: string;
  status: string;
  styleTags: string[];
}

export interface PaletteReferenceSource {
  brandName: string;
  channelType: string;
  colorSummary: string[];
  itemCategory: string;
  notes: string;
  observedAt: string;
  platform: string;
  sourceId: string;
  sourceUrl: string;
}

export interface CollectionRecord {
  coverPaletteId: string;
  deleteReason?: string;
  deletedAt?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  id: string;
  isPro: boolean;
  nameEn: string;
  nameZh: string;
  occasionTags: string[];
  paletteIds: string[];
  previousStatus?: string;
  releaseMode: string;
  status: string;
  styleTags: string[];
  themeType: string;
}

export interface BaseColorDeleteCheckReference {
  id: string;
  referenceField: 'accentColorId' | 'primaryColorId' | 'secondaryColorId';
  resource: 'palette';
  slug: string;
}

export interface BaseColorDeleteCheckResult {
  blockingReferences: BaseColorDeleteCheckReference[];
  canDelete: boolean;
  targetId: string;
  targetNameEn: string;
  targetNameZh: string;
}

export interface PaletteDeleteCheckReference {
  displayLabel: string;
  id: string;
  referenceField: 'coverPaletteId' | 'paletteIds';
  resource: 'collection';
}

export interface PaletteDeleteCheckResult {
  blockingReferences: PaletteDeleteCheckReference[];
  canDelete: boolean;
  targetId: string;
  targetSlug: string;
}

export interface CollectionDeleteCheckReference {
  displayLabel: string;
  id: string;
  referenceField: 'sourceCollectionIds';
  resource: 'palette';
}

export interface CollectionDeleteCheckResult {
  blockingReferences: CollectionDeleteCheckReference[];
  canDelete: boolean;
  targetId: string;
  targetNameEn: string;
  targetNameZh: string;
}