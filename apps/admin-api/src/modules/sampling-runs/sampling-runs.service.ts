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
import { LlmBatchGenerationService } from '../sampling-batches/llm-batch-generation.service';
import type { CreateSamplingRunDto } from './dto/create-sampling-run.dto';

interface SamplingRunRecord {
  events: SamplingRunEvent[];
  run: SamplingRunSummary;
  stream: Subject<SamplingRunEvent>;
  updatedAt: string;
  version: number;
}

const supportedOperationTypes: SamplingRunOperationType[] = [
  'llm-batch-generate',
];

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function buildGenerationScopeLabel(payload: CreateSamplingRunDto): string {
  const targetCount = payload.llmBatchGenerate?.targetCount;

  if (targetCount) {
    return `generate ${targetCount} records`;
  }

  return 'LLM batch generation';
}

@Injectable()
export class SamplingRunsService {
  private collectionVersion = 0;

  private readonly runs = new Map<string, SamplingRunRecord>();

  constructor(
    private readonly samplingBatchesService: SamplingBatchesService,
    private readonly llmBatchGenerationService: LlmBatchGenerationService,
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
    const operationType = payload.operationType ?? 'generate-candidates';

    if (!supportedOperationTypes.includes(operationType)) {
      throw new BadRequestException(
        `operationType must be one of ${supportedOperationTypes.join(', ')}.`,
      );
    }

    let batchId = payload.batchId?.trim()

    if (operationType === 'llm-batch-generate') {
      // For LLM batch generation, batchId is optional (batch is created during generation)
      if (!hasText(batchId)) {
        batchId = `llm-pending-${Date.now().toString(36)}`
      }
    } else {
      if (!hasText(batchId)) {
        throw new BadRequestException('batchId is required.')
      }
      await this.samplingBatchesService.getItem(batchId)
    }

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
        targetCount: payload.llmBatchGenerate?.targetCount,
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

    if (record.run.operationType === 'llm-batch-generate') {
      await this.executeLlmBatchGenerate(record, payload);
    }
  }

  private async executeLlmBatchGenerate(
    record: SamplingRunRecord,
    payload: CreateSamplingRunDto,
  ): Promise<void> {
    const params = payload.llmBatchGenerate;

    if (!params) {
      throw new BadRequestException(
        'llmBatchGenerate params are required for llm-batch-generate operation.',
      );
    }

    try {
      this.updateRun(record, {
        currentStage: 'llm-generation',
        progressPercent: 5,
        status: 'running',
      });
      this.emitEvent(record, {
        level: 'info',
        message: `Starting LLM batch generation: ${params.targetCount} records for ${params.occasionId}.`,
        metadata: { occasionId: params.occasionId, targetCount: params.targetCount },
        progressPercent: 5,
        stage: 'llm-generation',
        type: 'llm-generation-started',
      });

      const result = await this.llmBatchGenerationService.generateLlmBatch(
        params,
        (generated, total) => {
          const progress = Math.round(10 + (generated / total) * 80);
          this.emitEvent(record, {
            level: 'info',
            message: `Generated ${generated}/${total} records.`,
            metadata: { generated, total },
            progressPercent: progress,
            stage: 'llm-generation',
            type: 'llm-record-generated',
          });
        },
      );

      // Update the run's batchId to the real batch ID
      record.run.batchId = result.batchDocument.batch.id;

      this.emitEvent(record, {
        level: 'info',
        message: 'LLM generation finished. Persisting batch.',
        metadata: { itemCount: result.records.length, batchId: result.batchDocument.batch.id },
        progressPercent: 95,
        stage: 'llm-generation',
        type: 'llm-generation-finished',
      });

      this.updateRun(record, {
        currentStage: 'persisted',
        finishedAt: new Date().toISOString(),
        progressPercent: 100,
        status: 'succeeded',
        summary: `LLM generated ${result.records.length} records for batch ${result.batchDocument.batch.id}.`,
      });
      this.emitEvent(record, {
        level: 'info',
        message: `Run completed. Batch ${result.batchDocument.batch.id} with ${result.records.length} records.`,
        metadata: {
          itemCount: result.records.length,
          batchId: result.batchDocument.batch.id,
          updatedAt: result.batchDocument.updatedAt,
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
        metadata: { operationType: record.run.operationType },
        progressPercent: record.run.progressPercent,
        stage: 'failed',
        type: 'error',
      });
      this.emitEvent(record, {
        level: 'error',
        message: `LLM batch generation run failed.`,
        metadata: { batchId: record.run.batchId },
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
