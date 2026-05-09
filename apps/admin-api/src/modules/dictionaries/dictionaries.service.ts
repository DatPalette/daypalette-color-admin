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
  type DictionariesDocument,
  type DictionaryFieldMapping,
  type DictionaryItemDeleteCheckReference,
  type DictionaryItemDeleteCheckResult,
  type DictionaryItem,
  type DictionaryNode,
  type PaletteDataCollectionDocument,
} from '../../common/types/palette-data.types';
import type { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import type { DeleteDictionaryItemDto } from './dto/delete-dictionary-item.dto';
import type { UpdateDictionaryDto } from './dto/update-dictionary.dto';

type DictionaryConsumerEntity = 'baseColor' | 'collection' | 'palette';
type DictionaryReferenceRecord = Record<string, unknown> & {
  id: string;
  nameEn?: string;
  nameZh?: string;
  slug?: string;
  status?: string;
};

const paletteDataFileNameByEntity: Record<DictionaryConsumerEntity, string> = {
  baseColor: 'base-colors.v1.json',
  collection: 'collections.v1.json',
  palette: 'palettes.v1.json',
};

function toPublicDictionariesDocument(
  document: DictionariesDocument,
  includeDeleted = false,
): DictionariesDocument {
  const dictionaries: Record<string, DictionaryNode> = {};

  for (const [key, dictionary] of Object.entries(document.dictionaries)) {
    dictionaries[key] = {
      ...dictionary,
      items: includeDeleted
        ? dictionary.items
        : dictionary.items.filter((item) => !item.isDeleted),
    };
  }

  return {
    ...document,
    dictionaries,
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

function findDictionaryOrThrow(
  document: DictionariesDocument,
  key: string,
): DictionaryNode {
  const dictionary = document.dictionaries[key];

  if (!dictionary) {
    throw new NotFoundException(`Dictionary ${key} was not found.`);
  }

  return dictionary;
}

function findDictionaryItemOrThrow(
  dictionary: DictionaryNode,
  itemId: string,
): DictionaryItem {
  const item = dictionary.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    throw new NotFoundException(
      `Dictionary item ${itemId} was not found in ${dictionary.key}.`,
    );
  }

  return item;
}

function normalizeDictionaryItem(
  value: unknown,
  fieldName: string,
): DictionaryItem {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException(`${fieldName} must be an object.`);
  }

  const candidate = value as Record<string, unknown>;
  const isDeleted = Boolean(candidate.isDeleted);
  const isActive = Boolean(candidate.isActive);

  if (isDeleted && isActive) {
    throw new BadRequestException(
      `${fieldName} cannot be active after soft delete.`,
    );
  }

  return {
    aliases:
      candidate.aliases === undefined
        ? []
        : normalizeStringArray(candidate.aliases, `${fieldName}.aliases`),
    appliesTo:
      candidate.appliesTo === undefined
        ? undefined
        : normalizeStringArray(candidate.appliesTo, `${fieldName}.appliesTo`),
    deleteReason: normalizeOptionalString(candidate.deleteReason),
    deletedAt: normalizeOptionalString(candidate.deletedAt),
    descriptionEn: normalizeOptionalString(candidate.descriptionEn),
    descriptionZh: normalizeOptionalString(candidate.descriptionZh),
    id: normalizeRequiredString(candidate.id, `${fieldName}.id`),
    isActive,
    isDeleted,
    labelEn: normalizeRequiredString(candidate.labelEn, `${fieldName}.labelEn`),
    labelZh: normalizeRequiredString(candidate.labelZh, `${fieldName}.labelZh`),
    sortOrder:
      typeof candidate.sortOrder === 'number' &&
      Number.isFinite(candidate.sortOrder)
        ? candidate.sortOrder
        : (() => {
            throw new BadRequestException(
              `${fieldName}.sortOrder must be a finite number.`,
            );
          })(),
  };
}

function normalizeSelectionMode(
  value: unknown,
  fieldName: string,
): 'mixed' | 'multi' | 'single' {
  if (value !== 'mixed' && value !== 'multi' && value !== 'single') {
    throw new BadRequestException(
      `${fieldName} must be one of: single, multi, mixed.`,
    );
  }

  return value;
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

function normalizeDictionaryFieldMappings(
  value: unknown,
): DictionaryFieldMapping[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('fieldMappings must be a non-empty array.');
  }

  return value.map((fieldMapping, index) => {
    if (!fieldMapping || typeof fieldMapping !== 'object') {
      throw new BadRequestException(
        `fieldMappings[${index}] must be an object.`,
      );
    }

    const candidate = fieldMapping as Record<string, unknown>;

    return {
      entity: normalizeRequiredString(
        candidate.entity,
        `fieldMappings[${index}].entity`,
      ),
      field: normalizeRequiredString(
        candidate.field,
        `fieldMappings[${index}].field`,
      ),
      selectionMode: normalizeSelectionMode(
        candidate.selectionMode,
        `fieldMappings[${index}].selectionMode`,
      ),
    };
  });
}

function normalizeDictionaryItems(value: unknown): DictionaryItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('items must be a non-empty array.');
  }

  const itemIds = new Set<string>();

  return value.map((item, index) => {
    const normalizedItem = normalizeDictionaryItem(item, `items[${index}]`);
    const id = normalizedItem.id;

    if (itemIds.has(id)) {
      throw new BadRequestException(`Duplicate dictionary item id: ${id}.`);
    }

    itemIds.add(id);

    return normalizedItem;
  });
}

function buildUpdatedDictionaryNode(
  key: string,
  payload: UpdateDictionaryDto,
): DictionaryNode {
  return {
    descriptionEn: normalizeOptionalString(payload.descriptionEn),
    descriptionZh: normalizeOptionalString(payload.descriptionZh),
    entityScopes: normalizeStringArray(payload.entityScopes, 'entityScopes'),
    fieldMappings: normalizeDictionaryFieldMappings(payload.fieldMappings),
    items: normalizeDictionaryItems(payload.items),
    key,
    labelEn: normalizeRequiredString(payload.labelEn, 'labelEn'),
    labelZh: normalizeRequiredString(payload.labelZh, 'labelZh'),
    selectionMode: normalizeSelectionMode(
      payload.selectionMode,
      'selectionMode',
    ),
  };
}

function matchesDictionaryValue(
  value: unknown,
  itemId: string,
  selectionMode: 'mixed' | 'multi' | 'single',
): boolean {
  if (selectionMode === 'multi') {
    return Array.isArray(value) && value.includes(itemId);
  }

  if (selectionMode === 'single') {
    return value === itemId;
  }

  return (Array.isArray(value) && value.includes(itemId)) || value === itemId;
}

function toReferenceDisplayLabel(
  entity: DictionaryConsumerEntity,
  record: DictionaryReferenceRecord,
): string {
  if (entity === 'palette' && typeof record.slug === 'string' && record.slug) {
    return record.slug;
  }

  if (typeof record.nameZh === 'string' && record.nameZh) {
    return record.nameZh;
  }

  if (typeof record.nameEn === 'string' && record.nameEn) {
    return record.nameEn;
  }

  return record.id;
}

async function loadReferenceDocuments(
  fieldMappings: DictionaryFieldMapping[],
): Promise<
  Record<
    DictionaryConsumerEntity,
    PaletteDataCollectionDocument<DictionaryReferenceRecord>
  >
> {
  const entities = Array.from(
    new Set(
      fieldMappings.map(
        (fieldMapping) => fieldMapping.entity as DictionaryConsumerEntity,
      ),
    ),
  );
  const entries = await Promise.all(
    entities.map(
      async (entity) =>
        [
          entity,
          await readPaletteDataFile<
            PaletteDataCollectionDocument<DictionaryReferenceRecord>
          >(paletteDataFileNameByEntity[entity]),
        ] as const,
    ),
  );

  return Object.fromEntries(entries) as Record<
    DictionaryConsumerEntity,
    PaletteDataCollectionDocument<DictionaryReferenceRecord>
  >;
}

function buildDictionaryItemDeleteCheck(
  dictionaryKey: string,
  item: DictionaryItem,
  fieldMappings: DictionaryFieldMapping[],
  referenceDocuments: Record<
    DictionaryConsumerEntity,
    PaletteDataCollectionDocument<DictionaryReferenceRecord>
  >,
): DictionaryItemDeleteCheckResult {
  const blockingReferences: DictionaryItemDeleteCheckReference[] = [];

  for (const fieldMapping of fieldMappings) {
    const entity = fieldMapping.entity as DictionaryConsumerEntity;
    const document = referenceDocuments[entity];

    if (!document) {
      continue;
    }

    for (const record of document.items) {
      if (record.status === 'deleted') {
        continue;
      }

      if (
        matchesDictionaryValue(
          record[fieldMapping.field],
          item.id,
          fieldMapping.selectionMode,
        )
      ) {
        blockingReferences.push({
          displayLabel: toReferenceDisplayLabel(entity, record),
          id: record.id,
          referenceField: fieldMapping.field,
          resource: entity,
        });
      }
    }
  }

  return {
    blockingReferences,
    canDelete: blockingReferences.length === 0,
    dictionaryKey,
    itemId: item.id,
    itemLabelEn: item.labelEn,
    itemLabelZh: item.labelZh,
  };
}

@Injectable()
export class DictionariesService {
  async getCollection(includeDeleted = false): Promise<DictionariesDocument> {
    const document = await readPaletteDataFile<DictionariesDocument>(
      'dictionaries.v1.json',
    );

    return toPublicDictionariesDocument(document, includeDeleted);
  }

  async updateDictionary(
    key: string,
    payload: UpdateDictionaryDto,
  ): Promise<DictionariesDocument> {
    const document = await readPaletteDataFile<DictionariesDocument>(
      'dictionaries.v1.json',
    );

    findDictionaryOrThrow(document, key);

    const nextDocument: DictionariesDocument = {
      ...document,
      dictionaries: {
        ...document.dictionaries,
        [key]: buildUpdatedDictionaryNode(key, payload),
      },
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('dictionaries.v1.json', nextDocument);

    return toPublicDictionariesDocument(nextDocument);
  }

  async createItem(
    key: string,
    payload: CreateDictionaryItemDto,
  ): Promise<DictionariesDocument> {
    const document = await readPaletteDataFile<DictionariesDocument>(
      'dictionaries.v1.json',
    );
    const dictionary = findDictionaryOrThrow(document, key);
    const nextItem = normalizeDictionaryItem(
      {
        ...payload,
        deleteReason: '',
        deletedAt: '',
        isDeleted: false,
      },
      'item',
    );

    if (dictionary.items.some((item) => item.id === nextItem.id)) {
      throw new ConflictException(
        `Dictionary item ${nextItem.id} already exists in ${key}.`,
      );
    }

    const nextDocument: DictionariesDocument = {
      ...document,
      dictionaries: {
        ...document.dictionaries,
        [key]: {
          ...dictionary,
          items: [...dictionary.items, nextItem].sort(
            (left, right) => left.sortOrder - right.sortOrder,
          ),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('dictionaries.v1.json', nextDocument);

    return toPublicDictionariesDocument(nextDocument);
  }

  async getItemDeleteCheck(
    key: string,
    itemId: string,
  ): Promise<DictionaryItemDeleteCheckResult> {
    const document = await readPaletteDataFile<DictionariesDocument>(
      'dictionaries.v1.json',
    );
    const dictionary = findDictionaryOrThrow(document, key);
    const item = findDictionaryItemOrThrow(dictionary, itemId);
    const referenceDocuments = await loadReferenceDocuments(
      dictionary.fieldMappings,
    );

    return buildDictionaryItemDeleteCheck(
      key,
      item,
      dictionary.fieldMappings,
      referenceDocuments,
    );
  }

  async deleteItem(
    key: string,
    itemId: string,
    payload: DeleteDictionaryItemDto,
  ): Promise<DictionariesDocument> {
    const document = await readPaletteDataFile<DictionariesDocument>(
      'dictionaries.v1.json',
    );
    const dictionary = findDictionaryOrThrow(document, key);
    const item = findDictionaryItemOrThrow(dictionary, itemId);

    if (item.isDeleted) {
      throw new ConflictException(
        `Dictionary item ${itemId} is already deleted.`,
      );
    }

    const referenceDocuments = await loadReferenceDocuments(
      dictionary.fieldMappings,
    );
    const deleteCheck = buildDictionaryItemDeleteCheck(
      key,
      item,
      dictionary.fieldMappings,
      referenceDocuments,
    );

    if (!deleteCheck.canDelete) {
      throw new ConflictException({
        deleteCheck,
        message: 'Dictionary item is still referenced by active records.',
      });
    }

    const nextDocument: DictionariesDocument = {
      ...document,
      dictionaries: {
        ...document.dictionaries,
        [key]: {
          ...dictionary,
          items: dictionary.items.map((candidate) =>
            candidate.id === itemId
              ? {
                  ...candidate,
                  deleteReason: normalizeOptionalString(payload.deleteReason),
                  deletedAt: new Date().toISOString(),
                  isActive: false,
                  isDeleted: true,
                }
              : candidate,
          ),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('dictionaries.v1.json', nextDocument);

    return toPublicDictionariesDocument(nextDocument);
  }

  async restoreItem(
    key: string,
    itemId: string,
  ): Promise<DictionariesDocument> {
    const document = await readPaletteDataFile<DictionariesDocument>(
      'dictionaries.v1.json',
    );
    const dictionary = findDictionaryOrThrow(document, key);
    const item = findDictionaryItemOrThrow(dictionary, itemId);

    if (!item.isDeleted) {
      throw new ConflictException(`Dictionary item ${itemId} is not deleted.`);
    }

    const nextDocument: DictionariesDocument = {
      ...document,
      dictionaries: {
        ...document.dictionaries,
        [key]: {
          ...dictionary,
          items: dictionary.items.map((candidate) =>
            candidate.id === itemId
              ? {
                  ...candidate,
                  deleteReason: undefined,
                  deletedAt: undefined,
                  isActive: true,
                  isDeleted: false,
                }
              : candidate,
          ),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await writePaletteDataFile('dictionaries.v1.json', nextDocument);

    return toPublicDictionariesDocument(nextDocument);
  }
}
