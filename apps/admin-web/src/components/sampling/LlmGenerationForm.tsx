import { useState, type ReactElement } from 'react'
import { Check, Sparkles } from 'lucide-react'
import type { LlmBatchGenerateParams } from '@daypalette-color-admin/contracts'
import { samplingOccasionLabelMap } from '@/models/sampling-batches/sampling-batch-constants'
import { THEME_OPTIONS } from '@/models/sampling-batches/sampling-theme-options'

const OCCASION_OPTIONS = Object.entries(samplingOccasionLabelMap)
  .map(([value, label]) => ({ value, label }))

interface LlmGenerationFormProps {
  isDisabled: boolean
  onSubmit: (params: LlmBatchGenerateParams) => void
}

export function LlmGenerationForm({ isDisabled, onSubmit }: LlmGenerationFormProps): ReactElement {
  const [occasionId, setOccasionId] = useState('workday')
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['polished-light-commute'])
  const [targetCount, setTargetCount] = useState(20)
  const [styleConstraints, setStyleConstraints] = useState('')

  const filteredThemes = THEME_OPTIONS.filter((t) => t.occasion === occasionId)

  const handleOccasionChange = (nextOccasion: string) => {
    setOccasionId(nextOccasion)
    const nextThemes = THEME_OPTIONS.filter((t) => t.occasion === nextOccasion)
    setSelectedThemes(nextThemes.length > 0 ? [nextThemes[0].value] : [])
  }

  const toggleTheme = (themeValue: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeValue)
        ? prev.filter((t) => t !== themeValue)
        : [...prev, themeValue],
    )
  }

  const handleSubmit = () => {
    if (selectedThemes.length === 0) return
    const occasionLabel = OCCASION_OPTIONS.find((o) => o.value === occasionId)?.label ?? occasionId
    onSubmit({
      occasionId,
      titleZh: `${occasionLabel} LLM 批量生成 ${targetCount} 条`,
      themeKeys: selectedThemes,
      targetCount,
      styleConstraints: styleConstraints.trim() || undefined,
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground">场景</label>
        <div className="flex flex-wrap gap-2">
          {OCCASION_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                occasionId === option.value
                  ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
                  : 'border-[var(--dp-border-subtle)] bg-white text-foreground hover:border-[var(--dp-fill-inverse)]'
              }`}
              disabled={isDisabled}
              onClick={() => handleOccasionChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground">主题方向（可多选）</label>
        <div className="flex flex-wrap gap-2">
          {filteredThemes.map((theme) => {
            const isSelected = selectedThemes.includes(theme.value)
            return (
              <button
                key={theme.value}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
                    : 'border-[var(--dp-border-subtle)] bg-white text-foreground hover:border-[var(--dp-fill-inverse)]'
                }`}
                disabled={isDisabled}
                onClick={() => toggleTheme(theme.value)}
                type="button"
              >
                {isSelected && <Check size={14} />}
                {theme.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground">生成数量：{targetCount} 条</label>
        <input
          className="w-full"
          disabled={isDisabled}
          max={50}
          min={5}
          onChange={(e) => setTargetCount(Number(e.target.value))}
          step={5}
          type="range"
          value={targetCount}
        />
        <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>50</span></div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground">风格约束（可选）</label>
        <textarea
          className="w-full rounded-lg border border-[var(--dp-border-subtle)] bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--dp-outline)] focus:outline-none"
          disabled={isDisabled}
          onChange={(e) => setStyleConstraints(e.target.value)}
          placeholder="例如：偏好莫兰迪色系、避免高饱和度、适合 30+ 轻熟风"
          rows={2}
          value={styleConstraints}
        />
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--dp-fill-inverse)] px-4 py-2.5 text-sm font-medium text-[var(--dp-text-on-inverse)] transition-opacity hover:opacity-90 disabled:opacity-50"
        disabled={isDisabled || selectedThemes.length === 0}
        onClick={handleSubmit}
        type="button"
      >
        <Sparkles size={16} />
        {isDisabled ? '生成中...' : '开始生成'}
      </button>
    </div>
  )
}
