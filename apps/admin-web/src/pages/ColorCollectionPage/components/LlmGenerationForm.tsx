import { useState, type ReactElement } from 'react'
import { Sparkles } from 'lucide-react'
import type { LlmBatchGenerateParams } from '@daypalette-color-admin/contracts'
import { samplingOccasionLabelMap } from '@/models/sampling-batches/sampling-batch-constants'

const OCCASION_OPTIONS = Object.entries(samplingOccasionLabelMap)
  .filter(([key]) => ['workday', 'weekend', 'outdoor', 'dinner'].includes(key))
  .map(([value, label]) => ({ value, label }))

const THEME_OPTIONS: Array<{ value: string; label: string; occasion: string }> = [
  { value: 'polished-light-commute', label: '轻正式通勤', occasion: 'workday' },
  { value: 'urban-minimal-foundation', label: '都市极简基础', occasion: 'workday' },
  { value: 'soft-tone-lift', label: '柔调提亮', occasion: 'workday' },
  { value: 'mist-cool-commute', label: '雾冷调通勤', occasion: 'workday' },
  { value: 'warm-grounded-commute', label: '暖调沉稳通勤', occasion: 'workday' },
  { value: 'city-weekend-soft', label: '城市周末柔和', occasion: 'weekend' },
  { value: 'date-evening-glow', label: '约会暮光', occasion: 'weekend' },
  { value: 'playful-pop-weekend', label: '趣味波普周末', occasion: 'weekend' },
  { value: 'relaxed-denim-weekend', label: '休闲牛仔周末', occasion: 'weekend' },
  { value: 'holiday-sunlit-escape', label: '假日阳光逃逸', occasion: 'outdoor' },
  { value: 'nature-earth-walk', label: '自然大地漫步', occasion: 'outdoor' },
  { value: 'coastal-breeze-holiday', label: '海风假日', occasion: 'outdoor' },
  { value: 'adventure-sport-outdoor', label: '探险运动户外', occasion: 'outdoor' },
  { value: 'light-social-glow', label: '社交微光', occasion: 'dinner' },
  { value: 'elegant-dinner-luxe', label: '优雅晚宴奢华', occasion: 'dinner' },
  { value: 'moody-evening-drama', label: '暗调晚宴戏剧感', occasion: 'dinner' },
  { value: 'minimalist-evening', label: '极简晚宴', occasion: 'dinner' },
]

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
      {/* Occasion selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
          场景
        </label>
        <div className="flex flex-wrap gap-2">
          {OCCASION_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                occasionId === option.value
                  ? 'bg-[var(--dp-fill-inverse)] text-[var(--dp-text-primary)]'
                  : 'bg-[var(--dp-fill-subtle)] text-[var(--dp-text-secondary)] hover:bg-[var(--dp-fill-hover)]'
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

      {/* Theme multi-select */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
          主题方向（可多选）
        </label>
        <div className="flex flex-wrap gap-2">
          {filteredThemes.map((theme) => (
            <button
              key={theme.value}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedThemes.includes(theme.value)
                  ? 'bg-[var(--dp-accent)] text-white'
                  : 'bg-[var(--dp-fill-subtle)] text-[var(--dp-text-secondary)] hover:bg-[var(--dp-fill-hover)]'
              }`}
              disabled={isDisabled}
              onClick={() => toggleTheme(theme.value)}
              type="button"
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target count */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
          生成数量：{targetCount} 条
        </label>
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
        <div className="flex justify-between text-xs text-[var(--dp-text-tertiary)]">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      {/* Style constraints */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
          风格约束（可选）
        </label>
        <textarea
          className="w-full rounded-lg border border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] px-3 py-2 text-sm text-[var(--dp-text-primary)] placeholder:text-[var(--dp-text-tertiary)] focus:border-[var(--dp-border-focus)] focus:outline-none"
          disabled={isDisabled}
          onChange={(e) => setStyleConstraints(e.target.value)}
          placeholder="例如：偏好莫兰迪色系、避免高饱和度、适合 30+ 轻熟风"
          rows={2}
          value={styleConstraints}
        />
      </div>

      {/* Submit */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--dp-accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
