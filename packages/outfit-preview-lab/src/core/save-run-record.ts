import path from 'node:path'

import type { ResolvedImageLabProfile } from '../types/job.js'
import type { ProviderExecutionResult } from '../types/provider.js'
import type { RunRecord, SavedImage } from '../types/run-record.js'
import { readJsonFile, sanitizeForPersistence, writeJsonFile, writeTextFile } from './utils.js'

export async function writeRunArtifacts(
  runDir: string,
  profile: ResolvedImageLabProfile,
  result: ProviderExecutionResult,
  savedImages: SavedImage[],
): Promise<RunRecord> {
  await writeJsonFile(path.join(runDir, 'resolved-profile.json'), sanitizeForPersistence(profile.rawProfile))
  await writeTextFile(path.join(runDir, 'resolved-prompt.txt'), `${profile.promptText}\n`)

  if (profile.negativePromptText) {
    await writeTextFile(path.join(runDir, 'resolved-negative-prompt.txt'), `${profile.negativePromptText}\n`)
  }

  await writeJsonFile(path.join(runDir, 'request.json'), sanitizeForPersistence(result.requestBody))
  await writeJsonFile(path.join(runDir, 'submit-response.json'), sanitizeForPersistence(result.submitResponse))

  if (result.finalResponse !== undefined) {
    await writeJsonFile(path.join(runDir, 'response.json'), sanitizeForPersistence(result.finalResponse))
  }

  const record: RunRecord = {
    id: path.basename(runDir),
    createdAt: new Date().toISOString(),
    profileId: profile.id,
    profileSource: profile.profilePath,
    provider: profile.provider,
    model: profile.model,
    status: result.status,
    runDir,
    requestId: result.requestId,
    taskId: result.taskId,
    tags: profile.tags ?? [],
    metadata: profile.metadata ?? {},
    referenceImages: profile.referenceImagePaths,
    images: savedImages,
    usage: result.usage,
    warnings: result.warnings,
    errorMessage: result.errorMessage,
  }

  await writeJsonFile(path.join(runDir, 'run-record.json'), record)
  return record
}

export async function writeErroredRun(
  runDir: string,
  profile: ResolvedImageLabProfile,
  errorMessage: string,
): Promise<RunRecord> {
  await writeJsonFile(path.join(runDir, 'resolved-profile.json'), sanitizeForPersistence(profile.rawProfile))
  await writeTextFile(path.join(runDir, 'resolved-prompt.txt'), `${profile.promptText}\n`)

  if (profile.negativePromptText) {
    await writeTextFile(path.join(runDir, 'resolved-negative-prompt.txt'), `${profile.negativePromptText}\n`)
  }

  await writeJsonFile(path.join(runDir, 'error.json'), { message: errorMessage })

  const record: RunRecord = {
    id: path.basename(runDir),
    createdAt: new Date().toISOString(),
    profileId: profile.id,
    profileSource: profile.profilePath,
    provider: profile.provider,
    model: profile.model,
    status: 'failed',
    runDir,
    tags: profile.tags ?? [],
    metadata: profile.metadata ?? {},
    referenceImages: profile.referenceImagePaths,
    images: [],
    errorMessage,
  }

  await writeJsonFile(path.join(runDir, 'run-record.json'), record)
  return record
}

export async function loadRunRecord(runDir: string): Promise<RunRecord> {
  return readJsonFile<RunRecord>(path.join(runDir, 'run-record.json'))
}

export async function updateRunRecord(
  runDir: string,
  updater: (record: RunRecord) => RunRecord,
): Promise<RunRecord> {
  const current = await loadRunRecord(runDir)
  const next = updater(current)
  await writeJsonFile(path.join(runDir, 'run-record.json'), next)
  return next
}