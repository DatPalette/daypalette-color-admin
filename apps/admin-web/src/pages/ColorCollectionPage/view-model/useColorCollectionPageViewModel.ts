import { useCallback, useRef, useState } from 'react'
import type { LlmBatchGenerateParams, SamplingRunEvent } from '@daypalette-color-admin/contracts'
import {
  createSamplingRun,
  getSamplingRun,
  subscribeToSamplingRunStream,
} from '@/services/sampling-runs/sampling-runs.service'
import {
  extractColorsFromUrls,
  extractColorsFromFiles,
} from '@/services/color-collection/color-collection.service'
import type { SamplingRunDto } from '@/models/sampling-runs'

export type ColorCollectionTab = 'llm' | 'image'

export interface ColorCollectionPageState {
  activeTab: ColorCollectionTab
  isGenerating: boolean
  errorMessage: string
  successMessage: string
  samplingRun: SamplingRunDto | null
  samplingRunEvents: SamplingRunEvent[]
  generatedBatchId: string | null
}

export interface ImageExtractionUrlParams {
  imageUrls: string[]
  occasionId: string
  themeKey: string
  themeLabelZh: string
}

export interface ImageExtractionFileParams {
  files: File[]
  occasionId: string
  themeKey: string
  themeLabelZh: string
}

export interface ColorCollectionPageActions {
  setActiveTab: (tab: ColorCollectionTab) => void
  startLlmGeneration: (params: LlmBatchGenerateParams) => Promise<void>
  startImageExtractionFromUrls: (params: ImageExtractionUrlParams) => Promise<void>
  startImageExtractionFromFiles: (params: ImageExtractionFileParams) => Promise<void>
  clearMessages: () => void
  reset: () => void
}

export function useColorCollectionPageViewModel(): ColorCollectionPageState & ColorCollectionPageActions {
  const [activeTab, setActiveTab] = useState<ColorCollectionTab>('llm')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [samplingRun, setSamplingRun] = useState<SamplingRunDto | null>(null)
  const [samplingRunEvents, setSamplingRunEvents] = useState<SamplingRunEvent[]>([])
  const [generatedBatchId, setGeneratedBatchId] = useState<string | null>(null)

  const streamRef = useRef<EventSource | null>(null)
  const eventIdsRef = useRef(new Set<string>())

  const clearMessages = useCallback(() => {
    setErrorMessage('')
    setSuccessMessage('')
  }, [])

  const reset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close()
      streamRef.current = null
    }
    eventIdsRef.current.clear()
    setIsGenerating(false)
    setErrorMessage('')
    setSuccessMessage('')
    setSamplingRun(null)
    setSamplingRunEvents([])
    setGeneratedBatchId(null)
  }, [])

  const startLlmGeneration = useCallback(async (params: LlmBatchGenerateParams) => {
    if (isGenerating) return

    reset()
    setIsGenerating(true)
    setErrorMessage('')

    try {
      const run = await createSamplingRun({
        batchId: '',
        operationType: 'llm-batch-generate',
        llmBatchGenerate: params,
      })

      setSamplingRun(run)

      const eventSource = subscribeToSamplingRunStream(run.runId, {
        onEvent: (event) => {
          if (eventIdsRef.current.has(event.eventId)) return
          eventIdsRef.current.add(event.eventId)

          setSamplingRunEvents((prev) => [...prev, event])
          setSamplingRun((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              status: event.type === 'run-finished'
                ? (event.level === 'error' ? 'failed' : 'succeeded')
                : prev.status,
              currentStage: event.stage ?? prev.currentStage,
              progressPercent: event.progressPercent ?? prev.progressPercent,
              errorCount: prev.errorCount + (event.level === 'error' ? 1 : 0),
              warningCount: prev.warningCount + (event.level === 'warning' ? 1 : 0),
              finishedAt: event.type === 'run-finished' ? event.createdAt : prev.finishedAt,
            }
          })

          if (event.type === 'run-finished') {
            streamRef.current?.close()
            streamRef.current = null

            // Extract batchId from the event metadata
            const batchId = (event.metadata as Record<string, unknown>)?.batchId as string | undefined

            void getSamplingRun(run.runId).then((finalRun) => {
              setSamplingRun(finalRun)
              const resolvedBatchId = batchId ?? finalRun.batchId
              setGeneratedBatchId(resolvedBatchId)
              setIsGenerating(false)
              if (event.level === 'error') {
                setErrorMessage(`生成失败: ${event.message}`)
              } else {
                setSuccessMessage(`生成完成！共 ${event.metadata && 'itemCount' in event.metadata ? String(event.metadata.itemCount) : '?'} 条记录。`)
              }
            }).catch(() => {
              setIsGenerating(false)
              setGeneratedBatchId(batchId ?? null)
              if (event.level !== 'error') {
                setSuccessMessage('生成完成！')
              }
            })
          }
        },
        onError: (error) => {
          console.error('SSE error:', error)
          streamRef.current?.close()
          streamRef.current = null
          setIsGenerating(false)
          setErrorMessage('连接中断，请重试。')
        },
      })

      streamRef.current = eventSource
    } catch (error) {
      setIsGenerating(false)
      setErrorMessage(error instanceof Error ? error.message : '启动生成失败')
    }
  }, [isGenerating, reset])

  const startImageExtractionFromUrls = useCallback(async (params: ImageExtractionUrlParams) => {
    if (isGenerating) return
    reset()
    setIsGenerating(true)
    setErrorMessage('')

    try {
      const result = await extractColorsFromUrls(params)
      setGeneratedBatchId(result.batchId)
      setIsGenerating(false)
      setSuccessMessage(`提取完成！共 ${result.records.length} 条记录。`)
    } catch (error) {
      setIsGenerating(false)
      setErrorMessage(error instanceof Error ? error.message : '图片取色失败')
    }
  }, [isGenerating, reset])

  const startImageExtractionFromFiles = useCallback(async (params: ImageExtractionFileParams) => {
    if (isGenerating) return
    reset()
    setIsGenerating(true)
    setErrorMessage('')

    try {
      const result = await extractColorsFromFiles(params)
      setGeneratedBatchId(result.batchId)
      setIsGenerating(false)
      setSuccessMessage(`提取完成！共 ${result.records.length} 条记录。`)
    } catch (error) {
      setIsGenerating(false)
      setErrorMessage(error instanceof Error ? error.message : '图片取色失败')
    }
  }, [isGenerating, reset])

  return {
    activeTab,
    isGenerating,
    errorMessage,
    successMessage,
    samplingRun,
    samplingRunEvents,
    generatedBatchId,
    setActiveTab,
    startLlmGeneration,
    startImageExtractionFromUrls,
    startImageExtractionFromFiles,
    clearMessages,
    reset,
  }
}
