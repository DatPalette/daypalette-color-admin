export type ProviderName = 'volcengine' | 'aliyun'

export type ImageOutputFormat = 'png' | 'jpeg'

export interface TextTemplateSpec {
  files?: string[]
  inline?: string[]
  joinWith?: string
}

export interface ImageLabProfile {
  id: string
  provider: ProviderName
  model?: string
  modelEnv?: string
  prompt: TextTemplateSpec
  negativePrompt?: TextTemplateSpec
  referenceImages?: string[]
  size?: string
  outputFormat?: ImageOutputFormat
  tags?: string[]
  metadata?: Record<string, string>
  providerOptions?: Record<string, unknown>
}

export interface ResolvedImageLabProfile
  extends Omit<ImageLabProfile, 'model' | 'negativePrompt' | 'prompt' | 'referenceImages'> {
  model: string
  profilePath: string
  profileDir: string
  promptText: string
  negativePromptText?: string
  referenceImagePaths: string[]
  rawProfile: ImageLabProfile
}

export interface BatchManifestJob {
  profile: string
  overrides?: Partial<ImageLabProfile>
}

export interface BatchManifest {
  id?: string
  continueOnError?: boolean
  jobs: BatchManifestJob[]
}