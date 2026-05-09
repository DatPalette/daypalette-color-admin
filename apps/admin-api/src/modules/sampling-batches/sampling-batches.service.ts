import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  SamplingBatchCollectionDocument,
  SamplingCandidateGenerationCapabilities,
  SamplingBatchDocument,
  SamplingBatchStatus,
  SamplingBatchSummary,
  SamplingRecord,
} from '@daypalette-color-admin/contracts';
import {
  deleteSamplingBatchFile,
  listSamplingBatchFiles,
  readSamplingBatchFile,
  writeSamplingBatchFile,
} from '../../common/files/sampling-batch-reader';
import type { GenerateSamplingCandidatesDto } from './dto/generate-sampling-candidates.dto';
import { SamplingCandidateGenerationService } from './sampling-candidate-generation.service';
import type { UpsertSamplingBatchDto } from './dto/upsert-sampling-batch.dto';

const allowedSamplingBatchStatuses: SamplingBatchStatus[] = [
  'draft',
  'collecting',
  'clustering',
  'readyForTransfer',
  'archived',
];

const allowedDigestionStatuses = [
  'sampled',
  'clustered',
  'shortlisted',
  'published',
  'rejected',
] as const;

const allowedChannelTypes = [
  'brand-site',
  'brand-flagship-store',
  'multi-brand-platform',
  'marketplace-brand-store',
] as const;

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isSamplingBatchStatus(value: string): value is SamplingBatchStatus {
  return allowedSamplingBatchStatuses.includes(value as SamplingBatchStatus);
}

function normalizeStringArray(values: string[] | undefined): string[] {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

function isCompletedSamplingRecord(record: SamplingRecord): boolean {
  return (
    hasText(record.platform) &&
    hasText(record.channelType) &&
    hasText(record.brandName) &&
    hasText(record.sourceUrl) &&
    hasText(record.observedAt) &&
    hasText(record.itemCategory) &&
    record.colorSummary.filter((item) => item.trim()).length > 0
  );
}

function buildSamplingBatchSummary(
  items: SamplingRecord[],
): SamplingBatchSummary {
  return {
    completedCount: items.filter((item) => isCompletedSamplingRecord(item))
      .length,
    recordCount: items.length,
    remainingVisibleUniqueCapacity: 0,
    uniqueBrandCount: new Set(
      items.map((item) => item.brandName.trim()).filter(Boolean),
    ).size,
    uniquePlatformCount: new Set(
      items.map((item) => item.platform.trim()).filter(Boolean),
    ).size,
    visibleUniqueCapacity: items.length,
    visibleUniqueCount: items.length,
  };
}

function buildCollection(
  items: SamplingBatchDocument[],
): SamplingBatchCollectionDocument {
  const sortedItems = [...items].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );

  return {
    items: sortedItems,
    updatedAt: sortedItems[0]?.updatedAt ?? '',
    version: sortedItems.reduce(
      (maxVersion, item) => Math.max(maxVersion, item.version),
      0,
    ),
  };
}

function assertSamplingBatchDocumentIsValid(
  id: string,
  document: SamplingBatchDocument,
): void {
  if (!isSamplingBatchStatus(document.batch.status)) {
    throw new BadRequestException(
      `batch.status must be one of ${allowedSamplingBatchStatuses.join(', ')}.`,
    );
  }

  if (document.batch.sourceWhitelistIds.length === 0) {
    throw new BadRequestException(
      'batch.sourceWhitelistIds must contain at least one channel type.',
    );
  }

  const invalidWhitelistIds = document.batch.sourceWhitelistIds.filter(
    (item) =>
      !allowedChannelTypes.includes(
        item as (typeof allowedChannelTypes)[number],
      ),
  );

  if (invalidWhitelistIds.length > 0) {
    throw new BadRequestException(
      `batch.sourceWhitelistIds contains unsupported values: ${invalidWhitelistIds.join(', ')}.`,
    );
  }

  const uniqueThemeKeys = new Set(document.batch.themeKeys);

  if (uniqueThemeKeys.size !== document.batch.themeKeys.length) {
    throw new BadRequestException(
      'batch.themeKeys must not contain duplicates.',
    );
  }

  const samplingIds = new Set<string>();

  document.items.forEach((item, index) => {
    if (!hasText(item.samplingId)) {
      throw new BadRequestException(`items[${index}].samplingId is required.`);
    }

    if (samplingIds.has(item.samplingId)) {
      throw new BadRequestException(
        `items[${index}].samplingId must be unique within the batch.`,
      );
    }

    samplingIds.add(item.samplingId);

    if (
      !hasText(item.themeKey) ||
      !document.batch.themeKeys.includes(item.themeKey)
    ) {
      throw new BadRequestException(
        `items[${index}].themeKey must exist in batch.themeKeys.`,
      );
    }

    if (!hasText(item.themeLabelZh)) {
      throw new BadRequestException(
        `items[${index}].themeLabelZh is required.`,
      );
    }

    if (!hasText(item.itemCategory)) {
      throw new BadRequestException(
        `items[${index}].itemCategory is required.`,
      );
    }

    if (item.productionBatchId !== id) {
      throw new BadRequestException(
        `items[${index}].productionBatchId must match the route id.`,
      );
    }

    if (item.occasionId !== document.batch.occasionId) {
      throw new BadRequestException(
        `items[${index}].occasionId must match batch.occasionId.`,
      );
    }

    if (!allowedDigestionStatuses.includes(item.digestionStatus)) {
      throw new BadRequestException(
        `items[${index}].digestionStatus must be one of ${allowedDigestionStatuses.join(', ')}.`,
      );
    }

    if (
      hasText(item.channelType) &&
      !document.batch.sourceWhitelistIds.includes(item.channelType)
    ) {
      throw new BadRequestException(
        `items[${index}].channelType must exist in batch.sourceWhitelistIds.`,
      );
    }

    if (
      item.candidatePaletteIds.length !== new Set(item.candidatePaletteIds).size
    ) {
      throw new BadRequestException(
        `items[${index}].candidatePaletteIds must not contain duplicates.`,
      );
    }

    if (item.finalPaletteIds.length !== new Set(item.finalPaletteIds).size) {
      throw new BadRequestException(
        `items[${index}].finalPaletteIds must not contain duplicates.`,
      );
    }

    if (
      item.digestionStatus === 'shortlisted' &&
      item.candidatePaletteIds.length === 0
    ) {
      throw new BadRequestException(
        `items[${index}].candidatePaletteIds is required when digestionStatus is shortlisted.`,
      );
    }

    if (
      item.digestionStatus === 'published' &&
      item.finalPaletteIds.length === 0
    ) {
      throw new BadRequestException(
        `items[${index}].finalPaletteIds is required when digestionStatus is published.`,
      );
    }

    if (item.colorSummary.some((entry) => !entry.trim())) {
      throw new BadRequestException(
        `items[${index}].colorSummary must not contain empty values.`,
      );
    }
  });

  if (document.batch.status !== 'draft' && document.items.length === 0) {
    throw new BadRequestException(
      'Non-draft batches must contain at least one sampling record.',
    );
  }

  if (document.batch.status === 'readyForTransfer') {
    const incompleteRecord = document.items.find(
      (item) => !isCompletedSamplingRecord(item),
    );

    if (incompleteRecord) {
      throw new BadRequestException(
        `All items must be complete before moving to readyForTransfer. Failed item: ${incompleteRecord.samplingId}.`,
      );
    }
  }
}

function normalizeBatchDocument(
  id: string,
  payload: UpsertSamplingBatchDto,
  existingDocument?: SamplingBatchDocument,
): SamplingBatchDocument {
  if (!hasText(payload.batch?.titleZh)) {
    throw new BadRequestException('batch.titleZh is required.');
  }

  if (!hasText(payload.batch?.occasionId)) {
    throw new BadRequestException('batch.occasionId is required.');
  }

  if (
    !Array.isArray(payload.batch?.themeKeys) ||
    payload.batch.themeKeys.length === 0
  ) {
    throw new BadRequestException(
      'batch.themeKeys must contain at least one theme key.',
    );
  }

  const nextItems = (payload.items ?? []).map((item) => ({
    ...item,
    accentColorSummary: item.accentColorSummary?.trim() ?? '',
    brandName: item.brandName?.trim() ?? '',
    candidatePaletteIds: normalizeStringArray(item.candidatePaletteIds),
    channelType: item.channelType?.trim() ?? '',
    colorSummary: normalizeStringArray(item.colorSummary),
    finalPaletteIds: normalizeStringArray(item.finalPaletteIds),
    itemCategory: item.itemCategory?.trim() ?? '',
    marketSignals: item.marketSignals?.trim() ?? '',
    notes: item.notes?.trim() ?? '',
    observedAt: item.observedAt?.trim() ?? '',
    occasionId: item.occasionId || payload.batch.occasionId,
    platform: item.platform?.trim() ?? '',
    primaryColorSummary: item.primaryColorSummary?.trim() ?? '',
    productionBatchId: id,
    samplingId: item.samplingId?.trim() ?? '',
    seasonHint: item.seasonHint?.trim() ?? '',
    secondaryColorSummary: item.secondaryColorSummary?.trim() ?? '',
    sourceId: item.sourceId?.trim() ?? '',
    sourceUrl: item.sourceUrl?.trim() ?? '',
    styleSignals: normalizeStringArray(item.styleSignals),
    themeKey: item.themeKey?.trim() ?? '',
    themeLabelZh: item.themeLabelZh?.trim() ?? '',
  }));

  const nextDocument: SamplingBatchDocument = {
    batch: {
      ...payload.batch,
      id,
      notes: payload.batch.notes?.trim() ?? '',
      occasionId: payload.batch.occasionId.trim(),
      sourceWhitelistIds: normalizeStringArray(
        payload.batch.sourceWhitelistIds,
      ),
      status: payload.batch.status,
      themeKeys: normalizeStringArray(payload.batch.themeKeys),
      titleZh: payload.batch.titleZh.trim(),
    },
    items: nextItems,
    summary: buildSamplingBatchSummary(nextItems),
    updatedAt: new Date().toISOString(),
    version: (existingDocument?.version ?? payload.version ?? 0) + 1,
  };

  assertSamplingBatchDocumentIsValid(id, nextDocument);

  return nextDocument;
}

@Injectable()
export class SamplingBatchesService {
  constructor(
    private readonly samplingCandidateGenerationService: SamplingCandidateGenerationService,
  ) {}

  private attachDerivedSummary(
    document: SamplingBatchDocument,
  ): SamplingBatchDocument {
    return {
      ...document,
      summary: {
        ...buildSamplingBatchSummary(document.items),
        ...this.samplingCandidateGenerationService.buildBatchGenerationSummary(
          document,
        ),
      },
    };
  }

  getCapabilities(): SamplingCandidateGenerationCapabilities {
    return this.samplingCandidateGenerationService.getCapabilities();
  }

  async getCollection(): Promise<SamplingBatchCollectionDocument> {
    const fileNames = await listSamplingBatchFiles();
    const documents = await Promise.all(
      fileNames.map((fileName) =>
        readSamplingBatchFile<SamplingBatchDocument>(
          fileName.replace(/\.v1\.json$/, ''),
        ),
      ),
    );

    return buildCollection(
      documents.map((document) => this.attachDerivedSummary(document)),
    );
  }

  async getItem(id: string): Promise<SamplingBatchDocument> {
    try {
      return this.attachDerivedSummary(
        await readSamplingBatchFile<SamplingBatchDocument>(id),
      );
    } catch {
      throw new NotFoundException(`Sampling batch ${id} was not found.`);
    }
  }

  async generateCandidates(
    id: string,
    payload: GenerateSamplingCandidatesDto,
  ): Promise<SamplingBatchDocument> {
    const currentDocument = await this.getItem(id);

    if (currentDocument.batch.status === 'archived') {
      throw new BadRequestException(
        'Archived batches cannot generate new candidates.',
      );
    }

    const nextItems =
      await this.samplingCandidateGenerationService.generateBatchCandidates(
        currentDocument,
        payload,
      );

    return this.upsertItem(id, {
      ...currentDocument,
      batch: {
        ...currentDocument.batch,
        status:
          currentDocument.batch.status === 'draft'
            ? 'collecting'
            : currentDocument.batch.status,
      },
      items: nextItems,
      version: currentDocument.version,
    });
  }

  async upsertItem(
    id: string,
    payload: UpsertSamplingBatchDto,
  ): Promise<SamplingBatchDocument> {
    let existingDocument: SamplingBatchDocument | undefined;

    try {
      existingDocument = await this.getItem(id);
    } catch {
      existingDocument = undefined;
    }

    const nextDocument = this.attachDerivedSummary(
      normalizeBatchDocument(id, payload, existingDocument),
    );

    await writeSamplingBatchFile(id, nextDocument);

    return nextDocument;
  }

  async updateStatus(
    id: string,
    status: SamplingBatchStatus,
  ): Promise<SamplingBatchDocument> {
    if (!isSamplingBatchStatus(status)) {
      throw new BadRequestException(
        `status must be one of ${allowedSamplingBatchStatuses.join(', ')}.`,
      );
    }

    const currentDocument = await this.getItem(id);
    const nextDocument: SamplingBatchDocument = {
      ...currentDocument,
      batch: {
        ...currentDocument.batch,
        status,
      },
      summary: buildSamplingBatchSummary(currentDocument.items),
      updatedAt: new Date().toISOString(),
      version: currentDocument.version + 1,
    };

    const nextDocumentWithSummary = this.attachDerivedSummary(nextDocument);

    assertSamplingBatchDocumentIsValid(id, nextDocumentWithSummary);
    await writeSamplingBatchFile(id, nextDocumentWithSummary);

    return nextDocumentWithSummary;
  }

  async deleteItem(id: string): Promise<SamplingBatchCollectionDocument> {
    await this.getItem(id);
    await deleteSamplingBatchFile(id);

    return this.getCollection();
  }
}
