import fs from 'node:fs/promises'
import path from 'node:path'

import type { LabEnvConfig } from '../config/env.js'
import type { ImageLabProfile, ResolvedImageLabProfile, TextTemplateSpec } from '../types/job.js'
import {
  deepMerge,
  isDataImageUrl,
  isHttpUrl,
  pathExists,
  readJsonFile,
  resolveFromBase,
} from './utils.js'

async function resolveTextTemplate(
  spec: TextTemplateSpec | undefined,
  baseDir: string,
  label: string,
): Promise<string | undefined> {
  if (!spec) {
    return undefined
  }

  const parts: string[] = []

  if (Array.isArray(spec.files)) {
    for (const relativePath of spec.files) {
      const filePath = resolveFromBase(baseDir, relativePath)

      if (!(await pathExists(filePath))) {
        throw new Error(`Missing ${label} file: ${filePath}`)
      }

      const content = await fs.readFile(filePath, 'utf8')
      parts.push(content.trim())
    }
  }

  if (Array.isArray(spec.inline)) {
    for (const inlineText of spec.inline) {
      if (inlineText.trim()) {
        parts.push(inlineText.trim())
      }
    }
  }

  if (parts.length === 0) {
    throw new Error(`The ${label} template is empty.`)
  }

  return parts.join(spec.joinWith ?? '\n\n')
}

function resolveModel(profile: ImageLabProfile, env: LabEnvConfig): string {
  if (profile.model?.trim()) {
    return profile.model.trim()
  }

  if (profile.modelEnv?.trim()) {
    const fromEnv = process.env[profile.modelEnv]
    if (fromEnv?.trim()) {
      return fromEnv.trim()
    }
  }

  const defaultModel = profile.provider === 'volcengine' ? env.volcengine.model : env.aliyun.model

  if (defaultModel?.trim()) {
    return defaultModel.trim()
  }

  throw new Error(
    `Missing model for profile "${profile.id}". Fill the provider model env var or set model/modelEnv in the profile.`,
  )
}

async function resolveReferenceImages(referenceImages: string[] | undefined, baseDir: string): Promise<string[]> {
  if (!referenceImages || referenceImages.length === 0) {
    return []
  }

  const resolved: string[] = []

  for (const entry of referenceImages) {
    if (isHttpUrl(entry) || isDataImageUrl(entry)) {
      resolved.push(entry)
      continue
    }

    const filePath = resolveFromBase(baseDir, entry)

    if (!(await pathExists(filePath))) {
      throw new Error(`Missing reference image: ${filePath}`)
    }

    resolved.push(filePath)
  }

  return resolved
}

export async function loadProfile(
  profilePath: string,
  env: LabEnvConfig,
  overrides?: Partial<ImageLabProfile>,
): Promise<ResolvedImageLabProfile> {
  const absoluteProfilePath = resolveFromBase(process.cwd(), profilePath)
  const baseProfile = await readJsonFile<ImageLabProfile>(absoluteProfilePath)
  const profile = overrides ? deepMerge(baseProfile, overrides) : baseProfile
  const profileDir = path.dirname(absoluteProfilePath)

  if (!profile.id?.trim()) {
    throw new Error(`Profile id is required: ${absoluteProfilePath}`)
  }

  if (profile.provider !== 'volcengine' && profile.provider !== 'aliyun') {
    throw new Error(`Unsupported provider in profile "${profile.id}".`)
  }

  const promptText = await resolveTextTemplate(profile.prompt, profileDir, 'prompt')

  if (!promptText) {
    throw new Error(`Prompt text is required for profile "${profile.id}".`)
  }

  const negativePromptText = await resolveTextTemplate(profile.negativePrompt, profileDir, 'negative prompt')
  const referenceImagePaths = await resolveReferenceImages(profile.referenceImages, profileDir)

  return {
    id: profile.id,
    provider: profile.provider,
    model: resolveModel(profile, env),
    modelEnv: profile.modelEnv,
    profilePath: absoluteProfilePath,
    profileDir,
    promptText,
    negativePromptText,
    referenceImagePaths,
    size: profile.size ?? env.defaults.imageSize,
    outputFormat: profile.outputFormat,
    tags: profile.tags ?? [],
    metadata: profile.metadata ?? {},
    providerOptions: profile.providerOptions ?? {},
    rawProfile: profile,
  }
}