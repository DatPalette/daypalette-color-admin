import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  readPaletteDataFile,
  writePaletteDataFile,
} from '../../common/files/palette-data-reader';
import type {
  CollectionRecord,
  CollectionDeleteCheckReference,
  CollectionDeleteCheckResult,
  DictionariesDocument,
  PaletteDataCollectionDocument,
  PaletteRecord,
} from '../../common/types/palette-data.types';
import type { DeleteCollectionDto } from './dto/delete-collection.dto';
import type { UpdateCollectionDto } from './dto/update-collection.dto';

type CollectionDictionaryKey =
  | 'occasion'
  | 'releaseMode'
  | 'status'
  | 'styleTag'
  | 'themeType';

function toPublicCollection(
  document: PaletteDataCollectionDocument<CollectionRecord>,
  includeDeleted = false,
): PaletteDataCollectionDocument<CollectionRecord> {
  return {
    ...document,
    items: includeDeleted
      ? document.items
      : document.items.filter((item) => item.status !== 'deleted'),
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

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an array of strings.`);
  }

  return Array.from(
    new Set(
      value.map((item) => normalizeRequiredString(item, `${fieldName} item`)),
    ),
  );
}

function getAllowedDictionaryIds(
  dictionaries: DictionariesDocument,
  dictionaryKey: CollectionDictionaryKey,
): Set<string> {
  const dictionary = dictionaries.dictionaries[dictionaryKey];

  if (!dictionary) {
    throw new BadRequestException(
      `Dictionary ${dictionaryKey} is not configured.`,
    );
  }

  return new Set(
    dictionary.items.filter((item) => !item.isDeleted).map((item) => item.id),
  );
}

function assertDictionaryValue(
  value: string,
  fieldName: string,
  dictionaries: DictionariesDocument,
  dictionaryKey: CollectionDictionaryKey,
): void {
  if (!getAllowedDictionaryIds(dictionaries, dictionaryKey).has(value)) {
    throw new BadRequestException(
      `${fieldName} contains unsupported value: ${value}.`,
    );
  }
}

function assertDictionaryValues(
  values: string[],
  fieldName: string,
  dictionaries: DictionariesDocument,
  dictionaryKey: CollectionDictionaryKey,
): void {
  const allowedIds = getAllowedDictionaryIds(dictionaries, dictionaryKey);

  for (const value of values) {
    if (!allowedIds.has(value)) {
      throw new BadRequestException(
        `${fieldName} contains unsupported value: ${value}.`,
      );
    }
  }
}

function findCollectionOrThrow(
  document: PaletteDataCollectionDocument<CollectionRecord>,
  id: string,
): CollectionRecord {
  const item = document.items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new NotFoundException(`Collection ${id} was not found.`);
  }

  return item;
}

function assertPaletteExists(
  id: string,
  fieldName: string,
  palettesDocument: PaletteDataCollectionDocument<PaletteRecord>,
): void {
  const palette = palettesDocument.items.find((item) => item.id === id);

  if (!palette || palette.status === 'deleted') {
    throw new BadRequestException(
      `${fieldName} references unknown palette: ${id}.`,
    );
  }
}

function assertPaletteIdsExist(
  ids: string[],
  palettesDocument: PaletteDataCollectionDocument<PaletteRecord>,
): void {
  for (const id of ids) {
    assertPaletteExists(id, 'paletteIds', palettesDocument);
  }
}

function assertCoverPaletteIncluded(
  coverPaletteId: string,
  paletteIds: string[],
): void {
  if (!paletteIds.includes(coverPaletteId)) {
    throw new BadRequestException(
      'coverPaletteId must also appear in paletteIds.',
    );
  }
}

function buildUpdatedCollectionRecord(
  id: string,
  payload: UpdateCollectionDto,
  palettesDocument: PaletteDataCollectionDocument<PaletteRecord>,
  dictionaries: DictionariesDocument,
): CollectionRecord {
  const nextRecord: CollectionRecord = {
    coverPaletteId: normalizeRequiredString(
      payload.coverPaletteId,
      'coverPaletteId',
    ),
    descriptionEn: normalizeOptionalString(payload.descriptionEn),
    descriptionZh: normalizeOptionalString(payload.descriptionZh),
    id,
    isPro: Boolean(payload.isPro),
    nameEn: normalizeRequiredString(payload.nameEn, 'nameEn'),
    nameZh: normalizeRequiredString(payload.nameZh, 'nameZh'),
    occasionTags: normalizeStringArray(payload.occasionTags, 'occasionTags'),
    paletteIds: normalizeStringArray(payload.paletteIds, 'paletteIds'),
    releaseMode: normalizeRequiredString(payload.releaseMode, 'releaseMode'),
    status: normalizeRequiredString(payload.status, 'status'),
    styleTags: normalizeStringArray(payload.styleTags, 'styleTags'),
    themeType: normalizeRequiredString(payload.themeType, 'themeType'),
  };

  assertPaletteExists(
    nextRecord.coverPaletteId,
    'coverPaletteId',
    palettesDocument,
  );
  assertPaletteIdsExist(nextRecord.paletteIds, palettesDocument);
  assertCoverPaletteIncluded(nextRecord.coverPaletteId, nextRecord.paletteIds);
  assertDictionaryValues(
    nextRecord.occasionTags,
    'occasionTags',
    dictionaries,
    'occasion',
  );
  assertDictionaryValues(
    nextRecord.styleTags,
    'styleTags',
    dictionaries,
    'styleTag',
  );
  assertDictionaryValue(
    nextRecord.releaseMode,
    'releaseMode',
    dictionaries,
    'releaseMode',
  );
  assertDictionaryValue(
    nextRecord.themeType,
    'themeType',
    dictionaries,
    'themeType',
  );
  assertDictionaryValue(nextRecord.status, 'status', dictionaries, 'status');

  if (nextRecord.status === 'deleted') {
    throw new BadRequestException(
      'status cannot be deleted when updating a collection.',
    );
  }

  return nextRecord;
}

function collectPaletteReferenceMatches(
  palette: PaletteRecord,
  targetId: string,
): CollectionDeleteCheckReference[] {
  if (!palette.sourceCollectionIds.includes(targetId)) {
    return [];
  }

  return [
    {
      displayLabel: palette.slug,
      id: palette.id,
      referenceField: 'sourceCollectionIds',
      resource: 'palette',
    },
  ];
}

function buildCollectionDeleteCheck(
  target: CollectionRecord,
  palettesDocument: PaletteDataCollectionDocument<PaletteRecord>,
): CollectionDeleteCheckResult {
  const blockingReferences = palettesDocument.items
    .filter((palette) => palette.status !== 'deleted')
    .flatMap((palette) => collectPaletteReferenceMatches(palette, target.id));

  return {
    blockingReferences,
    canDelete: blockingReferences.length === 0,
    targetId: target.id,
    targetNameEn: target.nameEn,
    targetNameZh: target.nameZh,
  };
}

@Injectable()
export class CollectionsService {
  async getCollection(
    includeDeleted = false,
  ): Promise<PaletteDataCollectionDocument<CollectionRecord>> {
    const document = await readPaletteDataFile<
      PaletteDataCollectionDocument<CollectionRecord>
    >('collections.v1.json');

    return toPublicCollection(document, includeDeleted);
  }

  async getDeleteCheck(id: string): Promise<CollectionDeleteCheckResult> {
    const [document, palettesDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>(
        'collections.v1.json',
      ),
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>(
        'palettes.v1.json',
      ),
    ]);
    const target = findCollectionOrThrow(document, id);

    return buildCollectionDeleteCheck(target, palettesDocument);
  }

  async updateItem(
    id: string,
    payload: UpdateCollectionDto,
  ): Promise<PaletteDataCollectionDocument<CollectionRecord>> {
    const [document, palettesDocument, dictionaries] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>(
        'collections.v1.json',
      ),
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>(
        'palettes.v1.json',
      ),
      readPaletteDataFile<DictionariesDocument>('dictionaries.v1.json'),
    ]);

    if (findCollectionOrThrow(document, id).status === 'deleted') {
      throw new ConflictException(
        `Collection ${id} is deleted and must be restored instead of updated.`,
      );
    }

    const nextItem = buildUpdatedCollectionRecord(
      id,
      payload,
      palettesDocument,
      dictionaries,
    );
    const nextDocument: PaletteDataCollectionDocument<CollectionRecord> = {
      ...document,
      items: document.items.map((item) => (item.id === id ? nextItem : item)),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('collections.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async deleteItem(
    id: string,
    payload: DeleteCollectionDto,
  ): Promise<PaletteDataCollectionDocument<CollectionRecord>> {
    const [document, palettesDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<CollectionRecord>>(
        'collections.v1.json',
      ),
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>(
        'palettes.v1.json',
      ),
    ]);
    const target = findCollectionOrThrow(document, id);

    if (target.status === 'deleted') {
      throw new ConflictException(`Collection ${id} is already deleted.`);
    }

    const deleteCheck = buildCollectionDeleteCheck(target, palettesDocument);

    if (!deleteCheck.canDelete) {
      throw new ConflictException({
        deleteCheck,
        message: 'Collection is still referenced by active palettes.',
      });
    }

    const nextDocument: PaletteDataCollectionDocument<CollectionRecord> = {
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

    await writePaletteDataFile('collections.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async restoreItem(
    id: string,
  ): Promise<PaletteDataCollectionDocument<CollectionRecord>> {
    const document = await readPaletteDataFile<
      PaletteDataCollectionDocument<CollectionRecord>
    >('collections.v1.json');
    const target = findCollectionOrThrow(document, id);

    if (target.status !== 'deleted') {
      throw new ConflictException(`Collection ${id} is not deleted.`);
    }

    const nextDocument: PaletteDataCollectionDocument<CollectionRecord> = {
      ...document,
      items: document.items.map((item) =>
        item.id === id
          ? {
              ...item,
              deleteReason: undefined,
              deletedAt: undefined,
              previousStatus: undefined,
              status: item.previousStatus || 'archived',
            }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('collections.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }
}
