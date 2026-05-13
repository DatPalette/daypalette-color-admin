import type { LabEnvConfig } from '../config/env.js'
import type { ResolvedImageLabProfile } from '../types/job.js'
import type { ProviderExecutionResult, ProviderRunOptions } from '../types/provider.js'

export interface ImageProvider {
  readonly name: ResolvedImageLabProfile['provider']
  run(
    profile: ResolvedImageLabProfile,
    env: LabEnvConfig,
    options: ProviderRunOptions,
  ): Promise<ProviderExecutionResult>
  fetch?(
    taskId: string,
    env: LabEnvConfig,
    options: ProviderRunOptions,
  ): Promise<ProviderExecutionResult>
}