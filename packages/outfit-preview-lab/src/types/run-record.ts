import type { ProviderName } from './job.js'

export interface SavedImage {
  index: number
  fileName: string
  filePath: string
  source: 'url' | 'b64_json'
  remoteUrl?: string
  size?: string
}

export interface RunScore {
  pose: number
  vectorFlatness: number
  faceAndAesthetic: number
  structure: number
  svgCleanup: number
  overall: number
  notes?: string
}

export interface RunRecord {
  id: string
  createdAt: string
  profileId: string
  profileSource: string
  provider: ProviderName
  model: string
  status: 'submitted' | 'completed' | 'failed'
  runDir: string
  requestId?: string
  taskId?: string
  tags: string[]
  metadata: Record<string, string>
  referenceImages: string[]
  images: SavedImage[]
  usage?: Record<string, unknown>
  warnings?: string[]
  errorMessage?: string
  score?: RunScore
}