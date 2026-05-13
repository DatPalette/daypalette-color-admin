#!/usr/bin/env node

import type { ProviderName } from './types/job.js'
import { loadEnvConfig } from './config/env.js'
import { fetchTaskResult } from './core/fetch-job.js'
import { runManifestFile } from './core/run-batch.js'
import { runProfileFile } from './core/run-job.js'
import { scoreRun } from './core/score-run.js'
import { asString } from './core/utils.js'

type OptionValue = boolean | string | string[]

interface ParsedArgs {
  command?: string
  options: Record<string, OptionValue>
}

function printUsage(): void {
  console.log(`
Usage:
  outfit-preview-lab run --profile <path> [--no-poll] [--timeout-ms <ms>] [--interval-ms <ms>]
  outfit-preview-lab batch --manifest <path> [--timeout-ms <ms>] [--interval-ms <ms>]
  outfit-preview-lab fetch --provider aliyun --task-id <task-id> [--run-dir <path>]
  outfit-preview-lab score --run <path> --pose <0-10> --vector-flatness <0-10> --face <0-10> --structure <0-10> --cleanup <0-10> [--notes <text>]
`)
}

function parseArgs(argv: string[]): ParsedArgs {
  const normalizedArgv = argv.filter((arg) => arg !== '--')

  if (normalizedArgv.length === 0) {
    return { options: {} }
  }

  const [command, ...rest] = normalizedArgv
  const options: Record<string, OptionValue> = {}

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index]

    if (!current?.startsWith('--')) {
      continue
    }

    const key = current.slice(2)
    const next = rest[index + 1]

    if (!next || next.startsWith('--')) {
      options[key] = true
      continue
    }

    const existing = options[key]

    if (Array.isArray(existing)) {
      existing.push(next)
      options[key] = existing
    } else if (typeof existing === 'string') {
      options[key] = [existing, next]
    } else {
      options[key] = next
    }

    index += 1
  }

  return { command, options }
}

function getStringOption(options: Record<string, OptionValue>, key: string): string | undefined {
  const value = options[key]
  return typeof value === 'string' ? value : undefined
}

function getBooleanOption(options: Record<string, OptionValue>, key: string): boolean {
  return options[key] === true
}

function getNumberOption(options: Record<string, OptionValue>, key: string): number | undefined {
  const value = getStringOption(options, key)

  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2))

  if (!parsed.command || parsed.command === 'help' || parsed.command === '--help') {
    printUsage()
    return
  }

  const env = await loadEnvConfig()

  switch (parsed.command) {
    case 'run': {
      const profile = getStringOption(parsed.options, 'profile')
      if (!profile) {
        throw new Error('Missing --profile')
      }

      const result = await runProfileFile(profile, env, {
        waitForCompletion: !getBooleanOption(parsed.options, 'no-poll'),
        timeoutMs: getNumberOption(parsed.options, 'timeout-ms'),
        pollIntervalMs: getNumberOption(parsed.options, 'interval-ms'),
      })

      console.log(`Run directory: ${result.runDir}`)
      console.log(`Status: ${result.record.status}`)
      if (result.record.taskId) {
        console.log(`Task ID: ${result.record.taskId}`)
      }
      if (result.record.errorMessage) {
        console.log(`Error: ${result.record.errorMessage}`)
      }
      if (result.record.status === 'failed') {
        process.exitCode = 1
      }
      return
    }

    case 'batch': {
      const manifest = getStringOption(parsed.options, 'manifest')
      if (!manifest) {
        throw new Error('Missing --manifest')
      }

      const result = await runManifestFile(manifest, env, {
        timeoutMs: getNumberOption(parsed.options, 'timeout-ms'),
        pollIntervalMs: getNumberOption(parsed.options, 'interval-ms'),
      })

      const failed = result.records.filter((record) => record.status === 'failed').length
      console.log(`Batch directory: ${result.batchDir}`)
      console.log(`Summary: ${result.summaryPath}`)
      console.log(`Completed: ${result.records.length - failed}, Failed: ${failed}`)
      if (failed > 0) {
        process.exitCode = 1
      }
      return
    }

    case 'fetch': {
      const provider = asString(getStringOption(parsed.options, 'provider')) as ProviderName | undefined
      const taskId = getStringOption(parsed.options, 'task-id')

      if (!provider) {
        throw new Error('Missing --provider')
      }

      if (!taskId) {
        throw new Error('Missing --task-id')
      }

      const result = await fetchTaskResult(provider, taskId, env, {
        runDir: getStringOption(parsed.options, 'run-dir'),
        timeoutMs: getNumberOption(parsed.options, 'timeout-ms'),
        pollIntervalMs: getNumberOption(parsed.options, 'interval-ms'),
      })

      console.log(`Run directory: ${result.runDir}`)
      console.log(`Status: ${result.record.status}`)
      if (result.record.errorMessage) {
        console.log(`Error: ${result.record.errorMessage}`)
        process.exitCode = 1
      }
      return
    }

    case 'score': {
      const runDir = getStringOption(parsed.options, 'run')
      if (!runDir) {
        throw new Error('Missing --run')
      }

      const pose = getNumberOption(parsed.options, 'pose')
      const vectorFlatness = getNumberOption(parsed.options, 'vector-flatness')
      const faceAndAesthetic = getNumberOption(parsed.options, 'face')
      const structure = getNumberOption(parsed.options, 'structure')
      const svgCleanup = getNumberOption(parsed.options, 'cleanup')

      if (
        pose === undefined
        || vectorFlatness === undefined
        || faceAndAesthetic === undefined
        || structure === undefined
        || svgCleanup === undefined
      ) {
        throw new Error('Missing one or more scoring fields.')
      }

      const record = await scoreRun(runDir, {
        pose,
        vectorFlatness,
        faceAndAesthetic,
        structure,
        svgCleanup,
        notes: getStringOption(parsed.options, 'notes'),
      })

      console.log(`Scored run: ${record.runDir}`)
      console.log(`Overall score: ${record.score?.overall ?? 'N/A'}`)
      return
    }

    default:
      printUsage()
      throw new Error(`Unknown command: ${parsed.command}`)
  }
}

main().catch((error) => {
  console.error(asString((error as Error).message) ?? String(error))
  process.exitCode = 1
})