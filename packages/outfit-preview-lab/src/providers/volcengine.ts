import type { LabEnvConfig } from '../config/env.js'
import { resolveApiKey } from '../config/env.js'
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
  compactObject,
  resolveImageInputString,
  safeJsonParse,
} from '../core/utils.js'
import type { ResolvedImageLabProfile } from '../types/job.js'
import type { ProviderExecutionResult, ProviderRunOptions } from '../types/provider.js'
import type { ImageProvider } from './provider.js'

function buildPrompt(profile: ResolvedImageLabProfile): string {
  if (!profile.negativePromptText) {
    return profile.promptText
  }

  return `${profile.promptText}\n\n请避免出现以下内容：${profile.negativePromptText}`
}

function normalizeVolcImages(images: unknown): Array<string> {
  if (!Array.isArray(images)) {
    return []
  }

  return images.filter((item): item is string => typeof item === 'string')
}

export const volcengineProvider: ImageProvider = {
  name: 'volcengine',
  async run(
    profile: ResolvedImageLabProfile,
    env: LabEnvConfig,
    _options: ProviderRunOptions,
  ): Promise<ProviderExecutionResult> {
    const apiKey = resolveApiKey('volcengine', env)
    const providerOptions = asRecord(profile.providerOptions) ?? {}
    const extraBody = asRecord(providerOptions.extraBody) ?? {}

    const referenceImages = await Promise.all(
      normalizeVolcImages(profile.referenceImagePaths).map((item) =>
        resolveImageInputString(item, profile.profileDir),
      ),
    )

    const imageField = referenceImages.length === 0
      ? undefined
      : referenceImages.length === 1
        ? referenceImages[0]
        : referenceImages

    const optimizePromptMode = asString(asRecord(providerOptions.optimizePromptOptions)?.mode)
      ?? asString(providerOptions.optimizePromptMode)

    const requestBody = {
      ...extraBody,
      ...compactObject({
        model: profile.model,
        prompt: buildPrompt(profile),
        image: imageField,
        size: profile.size ?? env.defaults.imageSize,
        seed: asNumber(providerOptions.seed),
        sequential_image_generation:
          asString(providerOptions.sequentialImageGeneration)
          ?? (referenceImages.length > 0 ? 'disabled' : undefined),
        sequential_image_generation_options: asRecord(providerOptions.sequentialImageGenerationOptions),
        tools: Array.isArray(providerOptions.tools) ? providerOptions.tools : undefined,
        stream: asBoolean(providerOptions.stream) ?? false,
        guidance_scale: asNumber(providerOptions.guidanceScale),
        output_format: profile.outputFormat ?? asString(providerOptions.outputFormat),
        response_format: asString(providerOptions.responseFormat) ?? 'url',
        watermark: asBoolean(providerOptions.watermark) ?? env.defaults.watermark,
        optimize_prompt_options: optimizePromptMode ? { mode: optimizePromptMode } : undefined,
      }),
    }

    const response = await fetch(`${env.volcengine.baseUrl}/api/v3/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    const rawText = await response.text()
    const raw = safeJsonParse(rawText)
    const rawRecord = asRecord(raw) ?? {}
    const errorRecord = asRecord(rawRecord.error)

    if (!response.ok || errorRecord) {
      return {
        provider: 'volcengine',
        status: 'failed',
        requestBody,
        submitResponse: raw,
        finalResponse: raw,
        images: [],
        usage: asRecord(rawRecord.usage),
        errorMessage:
          asString(errorRecord?.message)
          ?? asString(rawRecord.message)
          ?? `Volcengine request failed with HTTP ${response.status}`,
      }
    }

    const imageRecords = Array.isArray(rawRecord.data) ? rawRecord.data : []
    const images = imageRecords.map((item) => {
      const imageRecord = asRecord(item) ?? {}
      return {
        remoteUrl: asString(imageRecord.url),
        b64Json: asString(imageRecord.b64_json),
        size: asString(imageRecord.size),
        format: profile.outputFormat,
      }
    })

    return {
      provider: 'volcengine',
      status: 'completed',
      requestBody,
      submitResponse: raw,
      finalResponse: raw,
      images,
      usage: asRecord(rawRecord.usage),
    }
  },
  async fetch(taskId): Promise<ProviderExecutionResult> {
    return {
      provider: 'volcengine',
      status: 'failed',
      requestBody: { taskId },
      submitResponse: { taskId },
      finalResponse: { taskId },
      taskId,
      images: [],
      errorMessage: 'Volcengine image generation in this tool is request-response based and does not support task fetch.',
    }
  },
}