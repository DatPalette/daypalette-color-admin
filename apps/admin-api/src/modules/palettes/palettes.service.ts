import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readPaletteDataFile } from '../../common/files/palette-data-reader';
import { writePaletteDataFile } from '../../common/files/palette-data-reader';
import type {
  BaseColorRecord,
  CollectionRecord,
  DictionariesDocument,
  PaletteDataCollectionDocument,
  PaletteDeleteCheckReference,
  PaletteDeleteCheckResult,
  PaletteReferenceSource,
  PaletteRecord,
} from '../../common/types/palette-data.types';
import type { CreatePaletteDto } from './dto/create-palette.dto';
import type { DeletePaletteDto } from './dto/delete-palette.dto';
import type { UpdatePaletteDto } from './dto/update-palette.dto';

type PaletteDictionaryKey = 'moodTag' | 'occasion' | 'seasonTag' | 'status' | 'styleTag';

function toPublicCollection(
  document: PaletteDataCollectionDocument<PaletteRecord>,
  includeDeleted = false,
): PaletteDataCollectionDocument<PaletteRecord> {
  return {
    ...document,
    items: includeDeleted ? document.items : document.items.filter((item) => item.status !== 'deleted'),
  };
}

function normalizeRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${fieldName} cannot be empty.`);
  }

  return normalizedValue;
}

function normalizeOptionalString(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Optional text fields must be strings.');
  }

  return value.trim();
}

function normalizeOptionalStringOrUndefined(value: unknown): string | undefined {
  const normalizedValue = normalizeOptionalString(value);

  return normalizedValue ? normalizedValue : undefined;
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an array of strings.`);
  }

  return Array.from(
    new Set(value.map((item) => normalizeRequiredString(item, `${fieldName} item`))),
  );
}

function normalizeReferenceSources(value: unknown): PaletteReferenceSource[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException('referenceSources must be an array.');
  }

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new BadRequestException(`referenceSources[${index}] must be an object.`);
    }

    const source = item as Record<string, unknown>;

    return {
      brandName: normalizeRequiredString(source.brandName, `referenceSources[${index}].brandName`),
      channelType: normalizeRequiredString(
        source.channelType,
        `referenceSources[${index}].channelType`,
      ),
      colorSummary: normalizeStringArray(
        source.colorSummary,
        `referenceSources[${index}].colorSummary`,
      ),
      itemCategory: normalizeRequiredString(
        source.itemCategory,
        `referenceSources[${index}].itemCategory`,
      ),
      notes: normalizeOptionalString(source.notes),
      observedAt: normalizeRequiredString(
        source.observedAt,
        `referenceSources[${index}].observedAt`,
      ),
      platform: normalizeRequiredString(source.platform, `referenceSources[${index}].platform`),
      sourceId: normalizeRequiredString(source.sourceId, `referenceSources[${index}].sourceId`),
      sourceUrl: normalizeRequiredString(source.sourceUrl, `referenceSources[${index}].sourceUrl`),
    };
  });
}

function assertPaletteOperationalMetadata(nextRecord: PaletteRecord): void {
  const isPublishableStatus = nextRecord.status === 'approved' || nextRecord.status === 'published';
  const referenceSources = nextRecord.referenceSources ?? [];

  if (
    isPublishableStatus &&
    nextRecord.reviewStatus !== undefined &&
    nextRecord.reviewStatus !== 'approved'
  ) {
    throw new BadRequestException(
      'reviewStatus must be approved before a palette can enter approved or published status.',
    );
  }

  if (nextRecord.referenceMethod === 'market-sampled' && isPublishableStatus && referenceSources.length > 0) {
    if (referenceSources.length < 3) {
      throw new BadRequestException(
        'Market-sampled palette requires at least 3 referenceSources before approval or publish.',
      );
    }

    const distinctPlatforms = new Set(referenceSources.map((item) => item.platform));
    const distinctBrands = new Set(referenceSources.map((item) => item.brandName));

    if (distinctPlatforms.size < 2) {
      throw new BadRequestException(
        'Market-sampled palette requires references from at least 2 distinct platforms.',
      );
    }

    if (distinctBrands.size < 2) {
      throw new BadRequestException(
        'Market-sampled palette requires references from at least 2 distinct brands.',
      );
    }
  }

  if (nextRecord.status === 'archived' && !nextRecord.archivedAt) {
    throw new BadRequestException('archivedAt is required when status is archived.');
  }
}

function getAllowedDictionaryIds(
  dictionaries: DictionariesDocument,
  dictionaryKey: PaletteDictionaryKey,
): Set<string> {
  const dictionary = dictionaries.dictionaries[dictionaryKey];

  if (!dictionary) {
    throw new BadRequestException(`Dictionary ${dictionaryKey} is not configured.`);
  }

  return new Set(dictionary.items.filter((item) => !item.isDeleted).map((item) => item.id));
}

function assertDictionaryValue(
  value: string,
  fieldName: string,
  dictionaries: DictionariesDocument,
  dictionaryKey: PaletteDictionaryKey,
): void {
  if (!getAllowedDictionaryIds(dictionaries, dictionaryKey).has(value)) {
    throw new BadRequestException(`${fieldName} contains unsupported value: ${value}.`);
  }
}

function assertDictionaryValues(
  values: string[],
  fieldName: string,
  dictionaries: DictionariesDocument,
  dictionaryKey: PaletteDictionaryKey,
): void {
  const allowedIds = getAllowedDictionaryIds(dictionaries, dictionaryKey);

  for (const value of values) {
    if (!allowedIds.has(value)) {
      throw new BadRequestException(`${fieldName} contains unsupported value: ${value}.`);
    }
  }
}

function findPaletteOrThrow(
  document: PaletteDataCollectionDocument<PaletteRecord>,
  id: string,
): PaletteRecord {
  const item = document.items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new NotFoundException(`Palette ${id} was not found.`);
  }

  return item;
}

function assertBaseColorExists(
  id: string,
  fieldName: string,
  baseColorsDocument: PaletteDataCollectionDocument<BaseColorRecord>,
): void {
  const baseColor = baseColorsDocument.items.find((item) => item.id === id);

  if (!baseColor || baseColor.status === 'deleted') {
    throw new BadRequestException(`${fieldName} references unknown base color: ${id}.`);
  }
}

function assertCollectionIdsExist(
  ids: string[],
  collectionsDocument: PaletteDataCollectionDocument<CollectionRecord>,
): void {
  for (const id of ids) {
    const collection = collectionsDocument.items.find((item) => item.id === id);

    if (!collection || collection.status === 'deleted') {
      throw new BadRequestException(`sourceCollectionIds contains unknown collection: ${id}.`);
    }
  }
}

function buildUpdatedPaletteRecord(
  id: string,
  payload: CreatePaletteDto | UpdatePaletteDto,
  baseColorsDocument: PaletteDataCollectionDocument<BaseColorRecord>,
  dictionaries: DictionariesDocument,
  collectionsDocument: PaletteDataCollectionDocument<CollectionRecord>,
): PaletteRecord {
  const nextStatus = normalizeRequiredString(payload.status, 'status');
  const nextRecord: PaletteRecord = {
    accentColorId: normalizeRequiredString(payload.accentColorId, 'accentColorId'),
    archiveReason:
      nextStatus === 'archived' ? normalizeOptionalStringOrUndefined(payload.archiveReason) : undefined,
    archivedAt:
      nextStatus === 'archived'
        ? normalizeOptionalStringOrUndefined(payload.archivedAt) ?? new Date().toISOString()
        : undefined,
    fitPhotoScenario: Boolean(payload.fitPhotoScenario),
    id,
    isPro: Boolean(payload.isPro),
    marketSignalSummary: normalizeOptionalStringOrUndefined(payload.marketSignalSummary),
    moodTags: normalizeStringArray(payload.moodTags, 'moodTags'),
    occasionId: normalizeRequiredString(payload.occasionId, 'occasionId'),
    primaryColorId: normalizeRequiredString(payload.primaryColorId, 'primaryColorId'),
    productionBatchId: normalizeOptionalStringOrUndefined(payload.productionBatchId),
    referenceMethod: normalizeOptionalStringOrUndefined(payload.referenceMethod),
    referenceSources: normalizeReferenceSources(payload.referenceSources),
    reviewNotes: normalizeOptionalStringOrUndefined(payload.reviewNotes),
    reviewStatus: normalizeOptionalStringOrUndefined(payload.reviewStatus),
    reviewedAt: normalizeOptionalStringOrUndefined(payload.reviewedAt),
    reviewer: normalizeOptionalStringOrUndefined(payload.reviewer),
    safetyLevel: normalizeRequiredString(payload.safetyLevel, 'safetyLevel'),
    seasonTags: normalizeStringArray(payload.seasonTags, 'seasonTags'),
    secondaryColorId: normalizeRequiredString(payload.secondaryColorId, 'secondaryColorId'),
    slug: normalizeRequiredString(payload.slug, 'slug'),
    sourceCollectionIds: normalizeStringArray(payload.sourceCollectionIds, 'sourceCollectionIds'),
    sourceType: normalizeRequiredString(payload.sourceType, 'sourceType'),
    status: nextStatus,
    styleTags: normalizeStringArray(payload.styleTags, 'styleTags'),
  };

  assertBaseColorExists(nextRecord.primaryColorId, 'primaryColorId', baseColorsDocument);
  assertBaseColorExists(nextRecord.secondaryColorId, 'secondaryColorId', baseColorsDocument);
  assertBaseColorExists(nextRecord.accentColorId, 'accentColorId', baseColorsDocument);
  assertDictionaryValue(nextRecord.occasionId, 'occasionId', dictionaries, 'occasion');
  assertDictionaryValue(nextRecord.status, 'status', dictionaries, 'status');
  assertDictionaryValues(nextRecord.moodTags, 'moodTags', dictionaries, 'moodTag');
  assertDictionaryValues(nextRecord.styleTags, 'styleTags', dictionaries, 'styleTag');
  assertDictionaryValues(nextRecord.seasonTags, 'seasonTags', dictionaries, 'seasonTag');
  assertCollectionIdsExist(nextRecord.sourceCollectionIds, collectionsDocument);

  if (nextRecord.status === 'deleted') {
    throw new BadRequestException('status cannot be deleted when creating or updating a palette.');
  }

  assertPaletteOperationalMetadata(nextRecord);

  return nextRecord;
}

function collectCollectionReferenceMatches(
  collection: CollectionRecord,
  targetId: string,
): PaletteDeleteCheckReference[] {
  const references: PaletteDeleteCheckReference[] = [];

  if (collection.coverPaletteId === targetId) {
    references.push({
      displayLabel: collection.nameZh || collection.nameEn || collection.id,
      id: collection.id,
      referenceField: 'coverPaletteId',
      resource: 'collection',
    });
  }

  if (collection.paletteIds.includes(targetId)) {
    references.push({
      displayLabel: collection.nameZh || collection.nameEn || collection.id,
      id: collection.id,
      referenceField: 'paletteIds',
      resource: 'collection',
    });
  }

  return references;
}

function buildPaletteDeleteCheck(
  target: PaletteRecord,
  collectionsDocument: PaletteDataCollectionDocument<CollectionRecord>,
): PaletteDeleteCheckResult {
  const blockingReferences = collectionsDocument.items
    .filter((collection) => collection.status !== 'deleted')
    .flatMap((collection) => collectCollectionReferenceMatches(collection, target.id));

  return {
    blockingReferences,
    canDelete: blockingReferences.length === 0,
    targetId: target.id,
    targetSlug: target.slug,
  };
}

@Injectable()
export class PalettesService {
  async getCollection(
    includeDeleted = false,
  ): Promise<PaletteDataCollectionDocument<PaletteRecord>> {
    const document = await readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>(
      'palettes.v1.json',
    );

    return toPublicCollection(document, includeDeleted);
  }

  async createItem(
    payload: CreatePaletteDto,
  ): Promise<PaletteDataCollectionDocument<PaletteRecord>> {
    const [document, baseColorsDocument, dictionaries, collectionsDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>('palettes.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>('base-colors.v1.json'),
      readPaletteDataFile<DictionariesDocument>('dictionaries.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>('collections.v1.json'),
    ]);

    if (document.items.some((item) => item.id === payload.id)) {
      throw new ConflictException(`Palette ${payload.id} already exists.`);
    }

    const nextItem = buildUpdatedPaletteRecord(
      payload.id,
      payload,
      baseColorsDocument,
      dictionaries,
      collectionsDocument,
    );

    if (document.items.some((item) => item.slug === nextItem.slug)) {
      throw new ConflictException(`Palette slug ${nextItem.slug} already exists.`);
    }

    const nextDocument: PaletteDataCollectionDocument<PaletteRecord> = {
      ...document,
      items: [...document.items, nextItem],
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('palettes.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async getDeleteCheck(id: string): Promise<PaletteDeleteCheckResult> {
    const [document, collectionsDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>('palettes.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>('collections.v1.json'),
    ]);
    const target = findPaletteOrThrow(document, id);

    return buildPaletteDeleteCheck(target, collectionsDocument);
  }

  async updateItem(
    id: string,
    payload: UpdatePaletteDto,
  ): Promise<PaletteDataCollectionDocument<PaletteRecord>> {
    const [document, baseColorsDocument, dictionaries, collectionsDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>('palettes.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>('base-colors.v1.json'),
      readPaletteDataFile<DictionariesDocument>('dictionaries.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>('collections.v1.json'),
    ]);

    const nextItem = buildUpdatedPaletteRecord(
      id,
      payload,
      baseColorsDocument,
      dictionaries,
      collectionsDocument,
    );

    if (findPaletteOrThrow(document, id).status === 'deleted') {
      throw new ConflictException(`Palette ${id} is deleted and must be restored instead of updated.`);
    }

    if (document.items.some((item) => item.id !== id && item.slug === nextItem.slug)) {
      throw new ConflictException(`Palette slug ${nextItem.slug} already exists.`);
    }

    const nextDocument: PaletteDataCollectionDocument<PaletteRecord> = {
      ...document,
      items: document.items.map((item) => (item.id === id ? nextItem : item)),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('palettes.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async deleteItem(
    id: string,
    payload: DeletePaletteDto,
  ): Promise<PaletteDataCollectionDocument<PaletteRecord>> {
    const [document, collectionsDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>('palettes.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>('collections.v1.json'),
    ]);
    const target = findPaletteOrThrow(document, id);

    if (target.status === 'deleted') {
      throw new ConflictException(`Palette ${id} is already deleted.`);
    }

    const deleteCheck = buildPaletteDeleteCheck(target, collectionsDocument);

    if (!deleteCheck.canDelete) {
      throw new ConflictException({
        deleteCheck,
        message: 'Palette is still referenced by active collections.',
      });
    }

    const nextDocument: PaletteDataCollectionDocument<PaletteRecord> = {
      ...document,
      items: document.items.map((item) =>
        item.id === id
          ? {
              ...item,
              deleteReason: normalizeOptionalString(payload?.deleteReason),
              deletedAt: new Date().toISOString(),
              previousStatus: item.status,
              status: 'deleted',
            }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('palettes.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async restoreItem(id: string): Promise<PaletteDataCollectionDocument<PaletteRecord>> {
    const document = await readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>(
      'palettes.v1.json',
    );
    const target = findPaletteOrThrow(document, id);

    if (target.status !== 'deleted') {
      throw new ConflictException(`Palette ${id} is not deleted.`);
    }

    const nextDocument: PaletteDataCollectionDocument<PaletteRecord> = {
      ...document,
      items: document.items.map((item) =>
        item.id === id
          ? {
              ...item,
              deleteReason: undefined,
              deletedAt: undefined,
              previousStatus: undefined,
              status: item.previousStatus || 'approved',
            }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('palettes.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }
}