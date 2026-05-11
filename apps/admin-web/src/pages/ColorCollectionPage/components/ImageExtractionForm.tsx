import { useState, type ReactElement, type FormEvent } from 'react'
import { Upload, Link as LinkIcon } from 'lucide-react'
import { samplingOccasionLabelMap } from '@/models/sampling-batches/sampling-batch-constants'

const OCCASION_OPTIONS = Object.entries(samplingOccasionLabelMap)
  .filter(([key]) => ['workday', 'weekend', 'outdoor', 'dinner'].includes(key))
  .map(([value, label]) => ({ value, label }))

const THEME_OPTIONS: Array<{ value: string; label: string; occasion: string }> = [
  { value: 'polished-light-commute', label: '轻正式通勤', occasion: 'workday' },
  { value: 'urban-minimal-foundation', label: '都市极简基础', occasion: 'workday' },
  { value: 'soft-tone-lift', label: '柔调提亮', occasion: 'workday' },
  { value: 'city-weekend-soft', label: '城市周末柔和', occasion: 'weekend' },
  { value: 'date-evening-glow', label: '约会暮光', occasion: 'weekend' },
  { value: 'holiday-sunlit-escape', label: '假日阳光逃逸', occasion: 'outdoor' },
  { value: 'nature-earth-walk', label: '自然大地漫步', occasion: 'outdoor' },
  { value: 'light-social-glow', label: '社交微光', occasion: 'dinner' },
  { value: 'elegant-dinner-luxe', label: '优雅晚宴奢华', occasion: 'dinner' },
]

interface ImageExtractionFormProps {
  isDisabled: boolean
  onSubmitUrls: (params: {
    imageUrls: string[]
    occasionId: string
    themeKey: string
    themeLabelZh: string
  }) => void
  onSubmitFiles: (params: {
    files: File[]
    occasionId: string
    themeKey: string
    themeLabelZh: string
  }) => void
}

export function ImageExtractionForm({ isDisabled, onSubmitUrls, onSubmitFiles }: ImageExtractionFormProps): ReactElement {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url')
  const [occasionId, setOccasionId] = useState('workday')
  const [themeKey, setThemeKey] = useState('polished-light-commute')
  const [urlText, setUrlText] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const filteredThemes = THEME_OPTIONS.filter((t) => t.occasion === occasionId)
  const selectedTheme = filteredThemes.find((t) => t.value === themeKey) ?? filteredThemes[0]

  const handleOccasionChange = (nextOccasion: string) => {
    setOccasionId(nextOccasion)
    const nextThemes = THEME_OPTIONS.filter((t) => t.occasion === nextOccasion)
    setThemeKey(nextThemes[0]?.value ?? '')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (inputMode === 'url') {
      const urls = urlText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      if (urls.length === 0) return
      onSubmitUrls({
        imageUrls: urls,
        occasionId,
        themeKey,
        themeLabelZh: selectedTheme?.label ?? themeKey,
      })
    } else {
      if (files.length === 0) return
      onSubmitFiles({
        files,
        occasionId,
        themeKey,
        themeLabelZh: selectedTheme?.label ?? themeKey,
      })
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Input mode toggle */}
      <div className="flex gap-1 rounded-lg bg-[var(--dp-fill-subtle)] p-1">
        <button
          className={`flex items-center gap-1.5 flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            inputMode === 'url'
              ? 'bg-[var(--dp-fill-surface)] text-[var(--dp-text-primary)] shadow-sm'
              : 'text-[var(--dp-text-secondary)] hover:text-[var(--dp-text-primary)]'
          }`}
          disabled={isDisabled}
          onClick={() => setInputMode('url')}
          type="button"
        >
          <LinkIcon size={14} />
          URL 输入
        </button>
        <button
          className={`flex items-center gap-1.5 flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            inputMode === 'upload'
              ? 'bg-[var(--dp-fill-surface)] text-[var(--dp-text-primary)] shadow-sm'
              : 'text-[var(--dp-text-secondary)] hover:text-[var(--dp-text-primary)]'
          }`}
          disabled={isDisabled}
          onClick={() => setInputMode('upload')}
          type="button"
        >
          <Upload size={14} />
          文件上传
        </button>
      </div>

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

      {/* Theme selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
          主题方向
        </label>
        <select
          className="w-full rounded-lg border border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] px-3 py-2 text-sm text-[var(--dp-text-primary)] focus:border-[var(--dp-border-focus)] focus:outline-none"
          disabled={isDisabled}
          onChange={(e) => setThemeKey(e.target.value)}
          value={themeKey}
        >
          {filteredThemes.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      {/* URL input or file upload */}
      {inputMode === 'url' ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
            图片 URL（每行一个）
          </label>
          <textarea
            className="w-full rounded-lg border border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] px-3 py-2 text-sm text-[var(--dp-text-primary)] placeholder:text-[var(--dp-text-tertiary)] focus:border-[var(--dp-border-focus)] focus:outline-none font-mono"
            disabled={isDisabled}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder={'https://example.com/outfit1.jpg\nhttps://example.com/outfit2.jpg'}
            rows={5}
            value={urlText}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--dp-text-secondary)]">
            上传图片（最多 20 张）
          </label>
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--dp-border-subtle)] bg-[var(--dp-fill-surface)] p-6 text-center cursor-pointer hover:border-[var(--dp-border-focus)] transition-colors">
            <Upload size={24} className="text-[var(--dp-text-tertiary)]" />
            <span className="text-sm text-[var(--dp-text-secondary)]">
              点击或拖拽图片到这里
            </span>
            <input
              accept="image/*"
              className="hidden"
              disabled={isDisabled}
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              type="file"
            />
          </label>
          {files.length > 0 && (
            <div className="text-xs text-[var(--dp-text-secondary)]">
              已选择 {files.length} 个文件
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--dp-accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        disabled={isDisabled || (inputMode === 'url' ? !urlText.trim() : files.length === 0)}
        type="submit"
      >
        <Upload size={16} />
        {isDisabled ? '提取中...' : '提取配色'}
      </button>
    </form>
  )
}
