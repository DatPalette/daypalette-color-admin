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
import {
  type BaseColorDeleteCheckReference,
  type BaseColorDeleteCheckResult,
  type BaseColorRecord,
  type DictionariesDocument,
  type PaletteRecord,
  type PaletteDataCollectionDocument,
} from '../../common/types/palette-data.types';
import type { CreateBaseColorDto } from './dto/create-base-color.dto';
import type { DeleteBaseColorDto } from './dto/delete-base-color.dto';
import type { UpdateBaseColorDto } from './dto/update-base-color.dto';

type BaseColorDictionaryKey =
  | 'colorFamily'
  | 'lightnessLevel'
  | 'occasion'
  | 'saturationLevel'
  | 'seasonTag'
  | 'status'
  | 'styleTag'
  | 'tone';

type BaseColorPaletteReferenceField = 'accentColorId' | 'primaryColorId' | 'secondaryColorId';

function toPublicCollection(
  document: PaletteDataCollectionDocument<BaseColorRecord>,
  includeDeleted = false,
): PaletteDataCollectionDocument<BaseColorRecord> {
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

function normalizeHex(value: unknown): string {
  const normalizedValue = normalizeRequiredString(value, 'hex').toUpperCase();

  if (!/^#[0-9A-F]{6}$/.test(normalizedValue)) {
    throw new BadRequestException('hex must match the #RRGGBB format.');
  }

  return normalizedValue;
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

function normalizeOptionalString(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Optional text fields must be strings.');
  }

  return value.trim();
}

function getAllowedDictionaryIds(
  dictionaries: DictionariesDocument,
  dictionaryKey: BaseColorDictionaryKey,
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
  dictionaryKey: BaseColorDictionaryKey,
): void {
  if (!getAllowedDictionaryIds(dictionaries, dictionaryKey).has(value)) {
    throw new BadRequestException(`${fieldName} contains unsupported value: ${value}.`);
  }
}

function assertDictionaryValues(
  values: string[],
  fieldName: string,
  dictionaries: DictionariesDocument,
  dictionaryKey: BaseColorDictionaryKey,
): void {
  const allowedIds = getAllowedDictionaryIds(dictionaries, dictionaryKey);

  for (const value of values) {
    if (!allowedIds.has(value)) {
      throw new BadRequestException(`${fieldName} contains unsupported value: ${value}.`);
    }
  }
}

function buildUpdatedBaseColorRecord(
  id: string,
  payload: CreateBaseColorDto | UpdateBaseColorDto,
  dictionaries: DictionariesDocument,
): BaseColorRecord {
  const nextRecord: BaseColorRecord = {
    colorFamily: normalizeRequiredString(payload.colorFamily, 'colorFamily'),
    hex: normalizeHex(payload.hex),
    id,
    isNeutralCore: Boolean(payload.isNeutralCore),
    lightnessLevel: normalizeRequiredString(payload.lightnessLevel, 'lightnessLevel'),
    nameEn: normalizeRequiredString(payload.nameEn, 'nameEn'),
    nameZh: normalizeRequiredString(payload.nameZh, 'nameZh'),
    occasionTags: normalizeStringArray(payload.occasionTags, 'occasionTags'),
    saturationLevel: normalizeRequiredString(payload.saturationLevel, 'saturationLevel'),
    seasonTags: normalizeStringArray(payload.seasonTags, 'seasonTags'),
    status: normalizeRequiredString(payload.status, 'status'),
    styleTags: normalizeStringArray(payload.styleTags, 'styleTags'),
    tone: normalizeRequiredString(payload.tone, 'tone'),
  };

  assertDictionaryValue(nextRecord.tone, 'tone', dictionaries, 'tone');
  assertDictionaryValue(
    nextRecord.lightnessLevel,
    'lightnessLevel',
    dictionaries,
    'lightnessLevel',
  );
  assertDictionaryValue(
    nextRecord.saturationLevel,
    'saturationLevel',
    dictionaries,
    'saturationLevel',
  );
  assertDictionaryValue(nextRecord.colorFamily, 'colorFamily', dictionaries, 'colorFamily');
  assertDictionaryValue(nextRecord.status, 'status', dictionaries, 'status');
  assertDictionaryValues(nextRecord.styleTags, 'styleTags', dictionaries, 'styleTag');
  assertDictionaryValues(nextRecord.occasionTags, 'occasionTags', dictionaries, 'occasion');
  assertDictionaryValues(nextRecord.seasonTags, 'seasonTags', dictionaries, 'seasonTag');

  if (nextRecord.status === 'deleted') {
    throw new BadRequestException('status cannot be deleted when creating or updating a base color.');
  }

  return nextRecord;
}

function findBaseColorRecordOrThrow(
  document: PaletteDataCollectionDocument<BaseColorRecord>,
  id: string,
): BaseColorRecord {
  const item = document.items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new NotFoundException(`Base color ${id} was not found.`);
  }

  return item;
}

function collectPaletteReferenceMatches(
  palette: PaletteRecord,
  targetId: string,
): BaseColorDeleteCheckReference[] {
  const referenceFields: BaseColorPaletteReferenceField[] = [
    'primaryColorId',
    'secondaryColorId',
    'accentColorId',
  ];

  return referenceFields
    .filter((field) => palette[field] === targetId)
    .map((referenceField) => ({
      id: palette.id,
      referenceField,
      resource: 'palette' as const,
      slug: palette.slug,
    }));
}

function buildBaseColorDeleteCheck(
  target: BaseColorRecord,
  palettesDocument: PaletteDataCollectionDocument<PaletteRecord>,
): BaseColorDeleteCheckResult {
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
export class BaseColorsService {
  async getCollection(
    includeDeleted = false,
  ): Promise<PaletteDataCollectionDocument<BaseColorRecord>> {
    const document = await readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>(
      'base-colors.v1.json',
    );

    return toPublicCollection(document, includeDeleted);
  }

  async createItem(
    payload: CreateBaseColorDto,
  ): Promise<PaletteDataCollectionDocument<BaseColorRecord>> {
    const [document, dictionaries] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>('base-colors.v1.json'),
      readPaletteDataFile<DictionariesDocument>('dictionaries.v1.json'),
    ]);

    if (document.items.some((item) => item.id === payload.id)) {
      throw new ConflictException(`Base color ${payload.id} already exists.`);
    }

    const nextItem = buildUpdatedBaseColorRecord(payload.id, payload, dictionaries);
    const nextDocument: PaletteDataCollectionDocument<BaseColorRecord> = {
      ...document,
      items: [...document.items, nextItem],
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('base-colors.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async getDeleteCheck(id: string): Promise<BaseColorDeleteCheckResult> {
    const [document, palettesDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>('base-colors.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>('palettes.v1.json'),
    ]);

    const target = findBaseColorRecordOrThrow(document, id);

    return buildBaseColorDeleteCheck(target, palettesDocument);
  }

  async updateItem(
    id: string,
    payload: UpdateBaseColorDto,
  ): Promise<PaletteDataCollectionDocument<BaseColorRecord>> {
    const [document, dictionaries] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>('base-colors.v1.json'),
      readPaletteDataFile<DictionariesDocument>('dictionaries.v1.json'),
    ]);

    findBaseColorRecordOrThrow(document, id);

    const nextItem = buildUpdatedBaseColorRecord(id, payload, dictionaries);
    const nextDocument: PaletteDataCollectionDocument<BaseColorRecord> = {
      ...document,
      items: document.items.map((item) => (item.id === id ? nextItem : item)),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('base-colors.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async deleteItem(
    id: string,
    payload: DeleteBaseColorDto,
  ): Promise<PaletteDataCollectionDocument<BaseColorRecord>> {
    const [document, palettesDocument] = await Promise.all([
      readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>('base-colors.v1.json'),
      readPaletteDataFile<PaletteDataCollectionDocument<PaletteRecord>>('palettes.v1.json'),
    ]);

    const target = findBaseColorRecordOrThrow(document, id);

    if (target.status === 'deleted') {
      throw new ConflictException(`Base color ${id} is already deleted.`);
    }

    const deleteCheck = buildBaseColorDeleteCheck(target, palettesDocument);

    if (!deleteCheck.canDelete) {
      throw new ConflictException({
        deleteCheck,
        message: 'Base color is still referenced by active palettes.',
      });
    }

    const nextDocument: PaletteDataCollectionDocument<BaseColorRecord> = {
      ...document,
      items: document.items.map((item) =>
        item.id === id
          ? {
              ...item,
              deleteReason: normalizeOptionalString(payload.deleteReason),
              deletedAt: new Date().toISOString(),
              previousStatus: item.status,
              status: 'deleted',
            }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('base-colors.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }

  async restoreItem(id: string): Promise<PaletteDataCollectionDocument<BaseColorRecord>> {
    const document = await readPaletteDataFile<PaletteDataCollectionDocument<BaseColorRecord>>(
      'base-colors.v1.json',
    );
    const target = findBaseColorRecordOrThrow(document, id);

    if (target.status !== 'deleted') {
      throw new ConflictException(`Base color ${id} is not deleted.`);
    }

    const nextDocument: PaletteDataCollectionDocument<BaseColorRecord> = {
      ...document,
      items: document.items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          deleteReason: undefined,
          deletedAt: undefined,
          previousStatus: undefined,
          status: item.previousStatus || 'approved',
        };
      }),
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('base-colors.v1.json', nextDocument);

    return toPublicCollection(nextDocument);
  }
}