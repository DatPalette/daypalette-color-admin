import type { LabEnvConfig } from '../config/env.js'
import { resolveApiKey } from '../config/env.js'
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
  compactObject,
  resolveImageInputValue,
  safeJsonParse,
  sleep,
} from '../core/utils.js'
import type { ResolvedImageLabProfile } from '../types/job.js'
import type { ProviderExecutionResult, ProviderRunOptions } from '../types/provider.js'
import type { ImageProvider } from './provider.js'

function extractTaskStatus(raw: unknown): string | undefined {
  return asString(asRecord(asRecord(raw)?.output)?.task_status)
}

function normalizeAliImages(raw: unknown) {
  const results = Array.isArray(asRecord(asRecord(raw)?.output)?.results)
    ? (asRecord(raw)?.output as { results: unknown[] }).results
    : []

  return results.map((item) => {
    const record = asRecord(item) ?? {}
    return {
      remoteUrl: asString(record.url),
    }
  })
}

async function fetchTaskResult(taskId: string, env: LabEnvConfig, workspaceId?: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${resolveApiKey('aliyun', env)}`,
  }

  if (workspaceId?.trim()) {
    headers['X-DashScope-WorkSpace'] = workspaceId
  }

  const response = await fetch(`${env.aliyun.baseUrl}/api/v1/tasks/${taskId}`, {
    method: 'GET',
    headers,
  })

  const rawText = await response.text()
  return safeJsonParse(rawText)
}

async function pollUntilFinished(
  taskId: string,
  env: LabEnvConfig,
  workspaceId: string | undefined,
  options: ProviderRunOptions,
): Promise<unknown> {
  const startedAt = Date.now()

  while (Date.now() - startedAt <= options.timeoutMs) {
    const raw = await fetchTaskResult(taskId, env, workspaceId)
    const status = extractTaskStatus(raw)

    if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') {
      return raw
    }

    await sleep(options.pollIntervalMs)
  }

  throw new Error(`Timed out while waiting for Aliyun task ${taskId}`)
}

export const aliyunProvider: ImageProvider = {
  name: 'aliyun',
  async run(
    profile: ResolvedImageLabProfile,
    env: LabEnvConfig,
    options: ProviderRunOptions,
  ): Promise<ProviderExecutionResult> {
    const apiKey = resolveApiKey('aliyun', env)
    const providerOptions = asRecord(profile.providerOptions) ?? {}
    const extraInput = (await resolveImageInputValue(
      asRecord(providerOptions.extraInput) ?? {},
      profile.profileDir,
    )) as Record<string, unknown>
    const extraParameters = asRecord(providerOptions.extraParameters) ?? {}
    const workspaceId = asString(providerOptions.workspaceId) ?? env.aliyun.workspaceId

    const warnings: string[] = []
    if (profile.referenceImagePaths.length > 0) {
      warnings.push(
        'Aliyun provider does not auto-map referenceImages. Use providerOptions.extraInput with the documented field name when you need reference-image generation.',
      )
    }

    const input = {
      ...extraInput,
      ...compactObject({
        prompt: profile.promptText,
        negative_prompt: profile.negativePromptText,
      }),
    }

    const parameters = {
      ...extraParameters,
      ...compactObject({
        style: asString(providerOptions.style),
        size: profile.size ?? env.defaults.imageSize,
        n: asNumber(providerOptions.n),
      }),
    }

    const requestBody = compactObject({
      model: profile.model,
      input,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable',
    }

    if (workspaceId?.trim()) {
      headers['X-DashScope-WorkSpace'] = workspaceId
    }

    const response = await fetch(`${env.aliyun.baseUrl}/api/v1/services/aigc/text2image/image-synthesis`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    const rawText = await response.text()
    const submitRaw = safeJsonParse(rawText)
    const submitRecord = asRecord(submitRaw) ?? {}
    const taskId = asString(asRecord(submitRecord.output)?.task_id)
    const requestId = asString(submitRecord.request_id)

    if (!response.ok || !taskId) {
      return {
        provider: 'aliyun',
        status: 'failed',
        requestBody,
        submitResponse: submitRaw,
        finalResponse: submitRaw,
        requestId,
        images: [],
        warnings,
        errorMessage:
          asString(submitRecord.message)
          ?? `Aliyun request failed with HTTP ${response.status}`,
      }
    }

    const waitForCompletion = asBoolean(providerOptions.waitForCompletion) ?? options.waitForCompletion
    const pollIntervalMs = asNumber(providerOptions.pollIntervalMs) ?? options.pollIntervalMs
    const timeoutMs = asNumber(providerOptions.timeoutMs) ?? options.timeoutMs

    if (!waitForCompletion) {
      return {
        provider: 'aliyun',
        status: 'submitted',
        requestBody,
        submitResponse: submitRaw,
        requestId,
        taskId,
        images: [],
        warnings,
      }
    }

    const finalRaw = await pollUntilFinished(taskId, env, workspaceId, {
      waitForCompletion: true,
      pollIntervalMs,
      timeoutMs,
    })
    const finalStatus = extractTaskStatus(finalRaw)
    const finalRecord = asRecord(finalRaw) ?? {}

    if (finalStatus !== 'SUCCEEDED') {
      return {
        provider: 'aliyun',
        status: 'failed',
        requestBody,
        submitResponse: submitRaw,
        finalResponse: finalRaw,
        requestId,
        taskId,
        images: [],
        usage: asRecord(finalRecord.usage),
        warnings,
        errorMessage:
          asString(finalRecord.message)
          ?? `Aliyun task ${taskId} finished with status ${finalStatus ?? 'UNKNOWN'}`,
      }
    }

    return {
      provider: 'aliyun',
      status: 'completed',
      requestBody,
      submitResponse: submitRaw,
      finalResponse: finalRaw,
      requestId,
      taskId,
      images: normalizeAliImages(finalRaw),
      usage: asRecord(finalRecord.usage),
      warnings,
    }
  },
  async fetch(taskId, env, options): Promise<ProviderExecutionResult> {
    const finalRaw = await pollUntilFinished(taskId, env, env.aliyun.workspaceId, options)
    const finalStatus = extractTaskStatus(finalRaw)
    const finalRecord = asRecord(finalRaw) ?? {}

    return {
      provider: 'aliyun',
      status: finalStatus === 'SUCCEEDED' ? 'completed' : 'failed',
      requestBody: { taskId },
      submitResponse: { taskId },
      finalResponse: finalRaw,
      requestId: asString(finalRecord.request_id),
      taskId,
      images: finalStatus === 'SUCCEEDED' ? normalizeAliImages(finalRaw) : [],
      usage: asRecord(finalRecord.usage),
      errorMessage:
        finalStatus === 'SUCCEEDED'
          ? undefined
          : asString(finalRecord.message) ?? `Aliyun task ${taskId} finished with status ${finalStatus ?? 'UNKNOWN'}`,
    }
  },
}