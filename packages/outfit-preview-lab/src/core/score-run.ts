import path from 'node:path'

import type { RunRecord, RunScore } from '../types/run-record.js'
import { computeWeightedOverall, resolveFromBase, writeJsonFile } from './utils.js'
import { updateRunRecord } from './save-run-record.js'

export interface ScoreRunInput {
  pose: number
  vectorFlatness: number
  faceAndAesthetic: number
  structure: number
  svgCleanup: number
  notes?: string
}

export async function scoreRun(runDir: string, input: ScoreRunInput): Promise<RunRecord> {
  const absoluteRunDir = resolveFromBase(process.cwd(), runDir)
  const score: RunScore = {
    ...input,
    overall: computeWeightedOverall(input),
  }

  await writeJsonFile(path.join(absoluteRunDir, 'score.json'), score)

  return updateRunRecord(absoluteRunDir, (record) => ({
    ...record,
    score,
  }))
}