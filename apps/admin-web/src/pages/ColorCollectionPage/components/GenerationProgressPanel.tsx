import { type ReactElement } from 'react'
import { CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react'
import type { SamplingRunEvent } from '@daypalette-color-admin/contracts'
import type { SamplingRunDto } from '@/models/sampling-runs'

interface GenerationProgressPanelProps {
  samplingRun: SamplingRunDto | null
  events: SamplingRunEvent[]
}

export function GenerationProgressPanel({ samplingRun, events }: GenerationProgressPanelProps): ReactElement | null {
  if (!samplingRun) return null

  const isRunning = samplingRun.status === 'running' || samplingRun.status === 'queued'
  const isSucceeded = samplingRun.status === 'succeeded'
  const isFailed = samplingRun.status === 'failed'

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--dp-text-primary)]">
            {isRunning && '正在生成...'}
            {isSucceeded && '生成完成'}
            {isFailed && '生成失败'}
          </span>
          <span className="text-[var(--dp-text-tertiary)]">
            {samplingRun.progressPercent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--dp-surface-soft)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFailed ? 'bg-red-400' : isSucceeded ? 'bg-green-400' : 'bg-[var(--dp-fill-inverse)]'
            }`}
            style={{ width: `${samplingRun.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-[var(--dp-text-secondary)]">
        {samplingRun.errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <XCircle size={12} />
            {samplingRun.errorCount} 错误
          </span>
        )}
        {samplingRun.warningCount > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <AlertCircle size={12} />
            {samplingRun.warningCount} 警告
          </span>
        )}
      </div>

      {/* Event log */}
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg bg-[var(--dp-fill-surface)] p-3">
        {events.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-[var(--dp-text-tertiary)]">
            <Loader2 size={14} className="animate-spin" />
            等待事件...
          </div>
        )}
        {events.map((event, index) => {
          const isLastEvent = index === events.length - 1
          const showSpinner = isRunning && isLastEvent && event.level === 'info' && event.type !== 'run-finished'

          return (
            <div
              key={event.eventId}
              className="flex items-start gap-2 text-xs"
            >
              <span className="mt-0.5 shrink-0">
                {event.level === 'error' && (
                  <XCircle size={12} className="text-red-500" />
                )}
                {event.level === 'warning' && (
                  <AlertCircle size={12} className="text-amber-500" />
                )}
                {showSpinner && (
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                )}
                {event.level === 'info' && !showSpinner && (
                  <CheckCircle2 size={12} className="text-green-500" />
                )}
              </span>
              <span className="text-muted-foreground">
                {event.message}
              </span>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {samplingRun.summary && (
        <div className="rounded-lg bg-[var(--dp-fill-subtle)] p-3 text-sm text-[var(--dp-text-secondary)]">
          {samplingRun.summary}
        </div>
      )}
    </div>
  )
}
