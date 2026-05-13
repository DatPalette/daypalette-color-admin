import path from 'node:path'

import type { LabEnvConfig } from '../config/env.js'
import type { ImageLabProfile } from '../types/job.js'
import type { RunRecord } from '../types/run-record.js'
import { saveGeneratedImages } from './download-result.js'
import { loadProfile } from './load-profile.js'
import { writeErroredRun, writeRunArtifacts } from './save-run-record.js'
import { createRunId, ensureDir, resolveFromBase, todayStamp, toErrorMessage } from './utils.js'
import { aliyunProvider } from '../providers/aliyun.js'
import { volcengineProvider } from '../providers/volcengine.js'

export interface RunJobOptions {
  waitForCompletion?: boolean
  timeoutMs?: number
  pollIntervalMs?: number
  baseOutputDir?: string
}

export interface RunJobResult {
  runDir: string
  record: RunRecord
}

export async function runProfileFile(
  profilePath: string,
  env: LabEnvConfig,
  options: RunJobOptions = {},
  overrides?: Partial<ImageLabProfile>,
): Promise<RunJobResult> {
  const profile = await loadProfile(profilePath, env, overrides)
  const baseOutputDir = options.baseOutputDir
    ? resolveFromBase(process.cwd(), options.baseOutputDir)
    : path.join(env.defaults.outputDir, todayStamp())
  const runDir = path.join(baseOutputDir, createRunId(profile.id))
  await ensureDir(runDir)

  const provider = profile.provider === 'volcengine' ? volcengineProvider : aliyunProvider

  try {
    const result = await provider.run(profile, env, {
      waitForCompletion: options.waitForCompletion ?? true,
      timeoutMs: options.timeoutMs ?? 300000,
      pollIntervalMs: options.pollIntervalMs ?? 3000,
    })
    const savedImages = await saveGeneratedImages(runDir, result.images, profile.outputFormat)
    const record = await writeRunArtifacts(runDir, profile, result, savedImages)
    return { runDir, record }
  } catch (error) {
    const record = await writeErroredRun(runDir, profile, toErrorMessage(error))
    return { runDir, record }
  }
}