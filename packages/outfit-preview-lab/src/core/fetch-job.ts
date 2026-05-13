import path from 'node:path'

import type { LabEnvConfig } from '../config/env.js'
import type { ProviderName, ResolvedImageLabProfile } from '../types/job.js'
import type { RunRecord } from '../types/run-record.js'
import { saveGeneratedImages } from './download-result.js'
import { loadRunRecord, updateRunRecord, writeRunArtifacts } from './save-run-record.js'
import {
  createRunId,
  ensureDir,
  pathExists,
  resolveFromBase,
  todayStamp,
  writeJsonFile,
} from './utils.js'
import { aliyunProvider } from '../providers/aliyun.js'

export interface FetchJobOptions {
  runDir?: string
  timeoutMs?: number
  pollIntervalMs?: number
}

export interface FetchJobResult {
  runDir: string
  record: RunRecord
}

function createSyntheticProfile(provider: ProviderName, env: LabEnvConfig, taskId: string): ResolvedImageLabProfile {
  const model = provider === 'aliyun' ? env.aliyun.model : env.volcengine.model

  return {
    id: `fetch-${provider}-${taskId.slice(0, 8)}`,
    provider,
    model: model ?? 'unknown-model',
    profilePath: '<fetch>',
    profileDir: process.cwd(),
    promptText: '',
    negativePromptText: undefined,
    referenceImagePaths: [],
    size: undefined,
    outputFormat: undefined,
    tags: ['fetch'],
    metadata: { taskId },
    providerOptions: {},
    rawProfile: {
      id: `fetch-${provider}-${taskId.slice(0, 8)}`,
      provider,
      prompt: { inline: [''] },
    },
  }
}

export async function fetchTaskResult(
  provider: ProviderName,
  taskId: string,
  env: LabEnvConfig,
  options: FetchJobOptions = {},
): Promise<FetchJobResult> {
  if (provider !== 'aliyun') {
    throw new Error('Only aliyun task fetch is supported in this tool.')
  }

  const runDir = options.runDir
    ? resolveFromBase(process.cwd(), options.runDir)
    : path.join(env.defaults.outputDir, todayStamp(), createRunId(`fetch-${provider}-${taskId.slice(0, 8)}`))
  await ensureDir(runDir)

  const result = await aliyunProvider.fetch!(taskId, env, {
    waitForCompletion: true,
    timeoutMs: options.timeoutMs ?? 300000,
    pollIntervalMs: options.pollIntervalMs ?? 3000,
  })
  const savedImages = await saveGeneratedImages(runDir, result.images)
  const syntheticProfile = createSyntheticProfile(provider, env, taskId)
  const runRecordPath = path.join(runDir, 'run-record.json')

  if (await pathExists(runRecordPath)) {
    await writeJsonFile(path.join(runDir, 'response.json'), result.finalResponse ?? result.submitResponse)

    const record = await updateRunRecord(runDir, (current) => ({
      ...current,
      status: result.status,
      taskId: result.taskId ?? current.taskId,
      requestId: result.requestId ?? current.requestId,
      images: savedImages.length > 0 ? savedImages : current.images,
      usage: result.usage ?? current.usage,
      warnings: result.warnings ?? current.warnings,
      errorMessage: result.errorMessage,
    }))

    return { runDir, record }
  }

  const record = await writeRunArtifacts(runDir, syntheticProfile, result, savedImages)
  await loadRunRecord(runDir)
  return { runDir, record }
}