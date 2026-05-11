import type {
  ExtractedColor,
  SamplingRecord,
} from '@daypalette-color-admin/contracts'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

export interface ImageExtractionResult {
  batchId: string
  records: SamplingRecord[]
  extractedColors: ExtractedColor[][]
}

export async function extractColorsFromUrls(params: {
  imageUrls: string[]
  occasionId: string
  themeKey: string
  themeLabelZh: string
}): Promise<ImageExtractionResult> {
  const requestUrl = new URL('/api/image-extraction/from-urls', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, '图片取色失败'))
  }

  return (await response.json()) as ImageExtractionResult
}

export async function extractColorsFromFiles(params: {
  files: File[]
  occasionId: string
  themeKey: string
  themeLabelZh: string
}): Promise<ImageExtractionResult> {
  const formData = new FormData()
  for (const file of params.files) {
    formData.append('files', file)
  }
  formData.append('occasionId', params.occasionId)
  formData.append('themeKey', params.themeKey)
  formData.append('themeLabelZh', params.themeLabelZh)

  const requestUrl = new URL('/api/image-extraction/upload', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, '图片取色失败'))
  }

  return (await response.json()) as ImageExtractionResult
}
