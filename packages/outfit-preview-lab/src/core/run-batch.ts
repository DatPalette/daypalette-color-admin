import path from 'node:path'

import type { LabEnvConfig } from '../config/env.js'
import type { BatchManifest } from '../types/job.js'
import type { RunRecord } from '../types/run-record.js'
import { runProfileFile, type RunJobOptions } from './run-job.js'
import {
  createRunId,
  ensureDir,
  readJsonFile,
  resolveFromBase,
  todayStamp,
  writeJsonFile,
} from './utils.js'

export interface BatchRunResult {
  batchDir: string
  records: RunRecord[]
  summaryPath: string
}

export async function runManifestFile(
  manifestPath: string,
  env: LabEnvConfig,
  options: RunJobOptions = {},
): Promise<BatchRunResult> {
  const absoluteManifestPath = resolveFromBase(process.cwd(), manifestPath)
  const manifest = await readJsonFile<BatchManifest>(absoluteManifestPath)
  const manifestDir = path.dirname(absoluteManifestPath)
  const batchId = manifest.id ?? path.basename(absoluteManifestPath, path.extname(absoluteManifestPath))
  const batchDir = path.join(env.defaults.outputDir, todayStamp(), createRunId(batchId))
  const jobsDir = path.join(batchDir, 'jobs')
  await ensureDir(jobsDir)
  await writeJsonFile(path.join(batchDir, 'manifest.json'), manifest)

  const records: RunRecord[] = []

  for (const job of manifest.jobs) {
    const profilePath = resolveFromBase(manifestDir, job.profile)
    const result = await runProfileFile(profilePath, env, { ...options, baseOutputDir: jobsDir }, job.overrides)
    records.push(result.record)

    if (result.record.status === 'failed' && !manifest.continueOnError) {
      break
    }
  }

  const summary = {
    id: batchId,
    manifestPath: absoluteManifestPath,
    total: records.length,
    completed: records.filter((record) => record.status === 'completed').length,
    submitted: records.filter((record) => record.status === 'submitted').length,
    failed: records.filter((record) => record.status === 'failed').length,
    runs: records.map((record) => ({
      runDir: record.runDir,
      profileId: record.profileId,
      provider: record.provider,
      status: record.status,
      taskId: record.taskId,
    })),
  }

  const summaryPath = path.join(batchDir, 'summary.json')
  await writeJsonFile(summaryPath, summary)
  return { batchDir, records, summaryPath }
}