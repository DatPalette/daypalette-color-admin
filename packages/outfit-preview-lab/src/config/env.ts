import fs from 'node:fs/promises'
import path from 'node:path'

import type { ProviderName } from '../types/job.js'
import { asBoolean, defaultRunsRoot, packageRoot, pathExists, resolveFromBase } from '../core/utils.js'

export interface ProviderEnvConfig {
  apiKey?: string
  model?: string
  baseUrl: string
  workspaceId?: string
}

export interface LabEnvConfig {
  packageRoot: string
  defaults: {
    imageSize?: string
    outputDir: string
    watermark: boolean
  }
  volcengine: ProviderEnvConfig
  aliyun: ProviderEnvConfig
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {}

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/gu, '')
    result[key] = value
  }

  return result
}

async function applyEnvFile(filePath: string): Promise<void> {
  if (!(await pathExists(filePath))) {
    return
  }

  const content = await fs.readFile(filePath, 'utf8')
  const parsed = parseEnvFile(content)

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export async function loadEnvConfig(): Promise<LabEnvConfig> {
  await applyEnvFile(path.join(packageRoot, '.env.local'))
  await applyEnvFile(path.join(packageRoot, '.env'))

  const defaultOutputDir = process.env.DEFAULT_OUTPUT_DIR
    ? resolveFromBase(packageRoot, process.env.DEFAULT_OUTPUT_DIR)
    : defaultRunsRoot

  return {
    packageRoot,
    defaults: {
      imageSize: process.env.DEFAULT_IMAGE_SIZE,
      outputDir: defaultOutputDir,
      watermark: asBoolean(process.env.DEFAULT_WATERMARK === 'true') ?? false,
    },
    volcengine: {
      apiKey: process.env.VOLC_API_KEY,
      model: process.env.VOLC_MODEL,
      baseUrl: process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com',
    },
    aliyun: {
      apiKey: process.env.ALI_API_KEY,
      model: process.env.ALI_MODEL,
      baseUrl: process.env.ALI_BASE_URL || 'https://dashscope.aliyuncs.com',
      workspaceId: process.env.ALI_WORKSPACE_ID,
    },
  }
}

export function resolveApiKey(provider: ProviderName, env: LabEnvConfig): string {
  const apiKey = provider === 'volcengine' ? env.volcengine.apiKey : env.aliyun.apiKey

  if (!apiKey) {
    throw new Error(`Missing API key for provider "${provider}". Please fill the package .env.local file.`)
  }

  return apiKey
}