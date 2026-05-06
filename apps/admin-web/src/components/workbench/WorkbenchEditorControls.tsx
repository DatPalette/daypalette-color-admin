import type { ReactElement } from 'react'

interface WorkbenchEditorOption {
  label: string
  value: string
}

export function SectionTitle({ children }: { children: string }): ReactElement {
  return <p className="label-caps text-muted-foreground">{children}</p>
}

export function TextInput({
  disabled = false,
  label,
  onChange,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  value: string
}): ReactElement {
  return (
    <label className="space-y-2">
      <SectionTitle>{label}</SectionTitle>
      <input
        className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}

export function TextAreaInput({
  label,
  onChange,
  rows = 4,
  value,
}: {
  label: string
  onChange: (value: string) => void
  rows?: number
  value: string
}): ReactElement {
  return (
    <label className="space-y-2">
      <SectionTitle>{label}</SectionTitle>
      <textarea
        className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </label>
  )
}

export function SelectInput<TOption extends WorkbenchEditorOption>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: TOption[]
  value: string
}): ReactElement {
  return (
    <label className="space-y-2">
      <SectionTitle>{label}</SectionTitle>
      <select
        className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function MultiSelectChips<TOption extends WorkbenchEditorOption>({
  label,
  onToggle,
  options,
  selectedValues,
}: {
  label: string
  onToggle: (value: string) => void
  options: TOption[]
  selectedValues: string[]
}): ReactElement {
  return (
    <div className="space-y-3">
      <SectionTitle>{label}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value)

          return (
            <button
              key={option.value}
              className={[
                'border px-3 py-1.5 text-xs transition-colors',
                isSelected
                  ? 'border-transparent bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
                  : 'border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] text-foreground',
              ].join(' ')}
              onClick={() => onToggle(option.value)}
              aria-pressed={isSelected}
              type="button"
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}