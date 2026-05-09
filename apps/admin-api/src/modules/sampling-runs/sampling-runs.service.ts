import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  SamplingRunCollectionDocument,
  SamplingRunEvent,
  SamplingRunEventCollectionDocument,
  SamplingRunOperationType,
  SamplingRunSummary,
} from '@daypalette-color-admin/contracts';
import type { MessageEvent } from '@nestjs/common';
import { concat, from, map, Observable, Subject } from 'rxjs';
import { SamplingBatchesService } from '../sampling-batches/sampling-batches.service';
import type { CreateSamplingRunDto } from './dto/create-sampling-run.dto';

interface SamplingRunRecord {
  events: SamplingRunEvent[];
  run: SamplingRunSummary;
  stream: Subject<SamplingRunEvent>;
  updatedAt: string;
  version: number;
}

const supportedOperationTypes: SamplingRunOperationType[] = [
  'generate-candidates',
];

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function buildGenerationScopeLabel(payload: CreateSamplingRunDto): string {
  const targetCount = payload.generateCandidates?.targetCount;
  const shouldResetExisting = payload.generateCandidates?.resetExisting;

  if (shouldResetExisting && targetCount) {
    return `rebuild to ${targetCount} records`;
  }

  if (shouldResetExisting) {
    return 'full rebuild';
  }

  if (targetCount) {
    return `expand to ${targetCount} records`;
  }

  return 'refresh existing records';
}

@Injectable()
export class SamplingRunsService {
  private collectionVersion = 0;

  private readonly runs = new Map<string, SamplingRunRecord>();

  constructor(
    private readonly samplingBatchesService: SamplingBatchesService,
  ) {}

  getCollection(batchId?: string): SamplingRunCollectionDocument {
    const normalizedBatchId = batchId?.trim();
    const records = Array.from(this.runs.values())
      .filter(
        (record) =>
          !normalizedBatchId || record.run.batchId === normalizedBatchId,
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return {
      items: records.map((record) => ({ ...record.run })),
      updatedAt: records[0]?.updatedAt ?? '',
      version: this.collectionVersion,
    };
  }

  getItem(id: string): SamplingRunSummary {
    return { ...this.getRunRecord(id).run };
  }

  getEvents(id: string): SamplingRunEventCollectionDocument {
    const record = this.getRunRecord(id);

    return {
      items: record.events.map((event) => ({ ...event })),
      runId: record.run.runId,
      updatedAt: record.updatedAt,
      version: record.version,
    };
  }

  stream(id: string): Observable<MessageEvent> {
    const record = this.getRunRecord(id);

    return concat(
      from(record.events).pipe(map((event) => this.toMessageEvent(event))),
      record.stream.pipe(map((event) => this.toMessageEvent(event))),
    );
  }

  async createRun(payload: CreateSamplingRunDto): Promise<SamplingRunSummary> {
    const batchId = payload.batchId?.trim();

    if (!hasText(batchId)) {
      throw new BadRequestException('batchId is required.');
    }

    const operationType = payload.operationType ?? 'generate-candidates';

    if (!supportedOperationTypes.includes(operationType)) {
      throw new BadRequestException(
        `operationType must be one of ${supportedOperationTypes.join(', ')}.`,
      );
    }

    await this.samplingBatchesService.getItem(batchId);

    const createdAt = new Date().toISOString();
    const record: SamplingRunRecord = {
      events: [],
      run: {
        batchId,
        currentStage: 'queued',
        errorCount: 0,
        operationType,
        progressPercent: 0,
        runId: randomUUID(),
        startedAt: createdAt,
        status: 'queued',
        warningCount: 0,
      },
      stream: new Subject<SamplingRunEvent>(),
      updatedAt: createdAt,
      version: 0,
    };

    this.runs.set(record.run.runId, record);
    this.bumpCollectionVersion();
    this.emitEvent(record, {
      level: 'info',
      message: `Created ${operationType} run for batch ${batchId} with ${buildGenerationScopeLabel(payload)}.`,
      metadata: {
        operationType,
        resetExisting: payload.generateCandidates?.resetExisting ?? false,
        targetCount: payload.generateCandidates?.targetCount,
      },
      progressPercent: 0,
      stage: 'queued',
      type: 'run-created',
    });

    void Promise.resolve().then(async () => {
      await this.executeRun(record.run.runId, payload);
    });

    return { ...record.run };
  }

  private async executeRun(
    runId: string,
    payload: CreateSamplingRunDto,
  ): Promise<void> {
    const record = this.getRunRecord(runId);
    const requestedMode =
      payload.generateCandidates?.mode ??
      this.samplingBatchesService.getCapabilities().defaultMode;
    const capabilities = this.samplingBatchesService.getCapabilities();

    try {
      this.updateRun(record, {
        currentStage: 'preparing-batch',
        progressPercent: 10,
        status: 'running',
      });
      this.emitEvent(record, {
        level: 'info',
        message: payload.generateCandidates?.resetExisting
          ? `Preparing batch ${record.run.batchId} for a full rebuild before candidate generation.`
          : `Preparing batch ${record.run.batchId} for candidate generation.`,
        metadata: {
          batchId: record.run.batchId,
          resetExisting: payload.generateCandidates?.resetExisting ?? false,
          targetCount: payload.generateCandidates?.targetCount,
        },
        progressPercent: 10,
        stage: 'preparing-batch',
        type: 'stage-started',
      });

      this.updateRun(record, {
        currentStage: 'rules-generation',
        progressPercent: 35,
      });
      this.emitEvent(record, {
        level: 'info',
        message: payload.generateCandidates?.targetCount
          ? `Running ${requestedMode} candidate generation with target ${payload.generateCandidates.targetCount} records.`
          : `Running ${requestedMode} candidate generation.`,
        metadata: {
          mode: requestedMode,
          modelEnabled: capabilities.modelEnabled,
          rulesEnabled: capabilities.rulesEnabled,
          resetExisting: payload.generateCandidates?.resetExisting ?? false,
          targetCount: payload.generateCandidates?.targetCount,
        },
        progressPercent: 35,
        stage: 'rules-generation',
        type: 'stage-started',
      });

      if (requestedMode !== 'rules-only' && !capabilities.modelEnabled) {
        this.emitEvent(record, {
          level: 'warning',
          message:
            'Model analysis is not configured. The run will fall back to rules-only when possible.',
          metadata: {
            requestedMode,
          },
          progressPercent: 40,
          stage: 'rules-generation',
          type: 'warning',
        });
      }

      if (requestedMode !== 'rules-only' && capabilities.modelEnabled) {
        this.updateRun(record, {
          currentStage: 'model-analysis',
          progressPercent: 55,
        });
        this.emitEvent(record, {
          level: 'info',
          message: 'Starting model-assisted color analysis.',
          metadata: {
            mode: requestedMode,
          },
          progressPercent: 55,
          stage: 'model-analysis',
          type: 'model-analysis-started',
        });
      }

      const nextBatch = await this.samplingBatchesService.generateCandidates(
        record.run.batchId,
        payload.generateCandidates ?? {},
      );

      if (requestedMode !== 'rules-only' && capabilities.modelEnabled) {
        this.emitEvent(record, {
          level: 'info',
          message: 'Model-assisted color analysis finished.',
          metadata: {
            itemCount: nextBatch.items.length,
          },
          progressPercent: 80,
          stage: 'model-analysis',
          type: 'model-analysis-finished',
        });
      }

      this.updateRun(record, {
        currentStage: 'persisted',
        finishedAt: new Date().toISOString(),
        progressPercent: 100,
        status: 'succeeded',
        summary: payload.generateCandidates?.resetExisting
          ? `Rebuilt batch ${nextBatch.batch.id} and generated ${nextBatch.items.length} candidates.`
          : `Generated candidates for ${nextBatch.items.length} records in batch ${nextBatch.batch.id}.`,
      });
      this.emitEvent(record, {
        level: 'info',
        message: `Run completed successfully for batch ${nextBatch.batch.id}.`,
        metadata: {
          itemCount: nextBatch.items.length,
          updatedAt: nextBatch.updatedAt,
          version: nextBatch.version,
        },
        progressPercent: 100,
        stage: 'persisted',
        type: 'run-finished',
      });
      record.stream.complete();
    } catch (error) {
      const errorMessage = toErrorMessage(error);

      this.updateRun(record, {
        currentStage: 'failed',
        finishedAt: new Date().toISOString(),
        progressPercent: record.run.progressPercent,
        status: 'failed',
        summary: errorMessage,
      });
      this.emitEvent(record, {
        level: 'error',
        message: errorMessage,
        metadata: {
          batchId: record.run.batchId,
          operationType: record.run.operationType,
        },
        progressPercent: record.run.progressPercent,
        stage: 'failed',
        type: 'error',
      });
      this.emitEvent(record, {
        level: 'error',
        message: `Run failed for batch ${record.run.batchId}.`,
        metadata: {
          batchId: record.run.batchId,
        },
        progressPercent: record.run.progressPercent,
        stage: 'failed',
        type: 'run-finished',
      });
      record.stream.complete();
    }
  }

  private emitEvent(
    record: SamplingRunRecord,
    event: Omit<SamplingRunEvent, 'createdAt' | 'eventId' | 'runId'>,
  ): void {
    const createdAt = new Date().toISOString();
    const nextEvent: SamplingRunEvent = {
      ...event,
      createdAt,
      eventId: randomUUID(),
      runId: record.run.runId,
    };

    record.events.push(nextEvent);
    record.updatedAt = createdAt;
    record.version += 1;
    record.run.warningCount += nextEvent.level === 'warning' ? 1 : 0;
    record.run.errorCount += nextEvent.level === 'error' ? 1 : 0;
    this.bumpCollectionVersion();
    record.stream.next(nextEvent);
  }

  private getRunRecord(id: string): SamplingRunRecord {
    const record = this.runs.get(id);

    if (!record) {
      throw new NotFoundException(`Sampling run ${id} was not found.`);
    }

    return record;
  }

  private toMessageEvent(event: SamplingRunEvent): MessageEvent {
    return {
      data: event,
      id: event.eventId,
      type: event.type,
    };
  }

  private updateRun(
    record: SamplingRunRecord,
    patch: Partial<SamplingRunSummary>,
  ): void {
    record.run = {
      ...record.run,
      ...patch,
    };
    record.updatedAt = new Date().toISOString();
    this.bumpCollectionVersion();
  }

  private bumpCollectionVersion(): void {
    this.collectionVersion += 1;
  }
}
