import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'

import {
  outfitPreviewBottomTemplates,
  outfitPreviewDressTemplates,
  outfitPreviewTopTemplates,
} from './outfit-preview.templates'
import { getOutfitPreviewTemplateLabel } from './outfit-preview.utils'
import type {
  OutfitPreviewBottomTemplate,
  OutfitPreviewDressTemplate,
  OutfitPreviewMode,
  OutfitPreviewTemplateId,
  OutfitPreviewTopTemplate,
} from './outfit-preview.types'

function ControlChip({
  isActive,
  isDisabled = false,
  label,
  onClick,
}: {
  isActive: boolean
  isDisabled?: boolean
  label: string
  onClick?: () => void
}): ReactElement {
  return (
    <button
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] transition',
        isActive
          ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
          : 'border-[var(--dp-border-subtle)] bg-white text-muted-foreground hover:border-[var(--dp-fill-inverse)] hover:text-foreground',
        isDisabled && 'cursor-not-allowed opacity-48 hover:border-[var(--dp-border-subtle)] hover:text-muted-foreground',
      )}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function ControlRow<TemplateId extends OutfitPreviewTemplateId>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  onSelect?: (template: TemplateId) => void
  options: TemplateId[]
  selected: TemplateId
}): ReactElement {
  return (
    <div className="space-y-2">
      <p className="label-caps text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ControlChip
            key={option}
            isActive={option === selected}
            isDisabled={!onSelect}
            label={getOutfitPreviewTemplateLabel(option)}
            onClick={onSelect ? () => onSelect(option) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export function OutfitPreviewControls({
  availableBottomTemplates = outfitPreviewBottomTemplates.map((template) => template.id),
  availableDressTemplates = outfitPreviewDressTemplates.map((template) => template.id),
  availableTopTemplates = outfitPreviewTopTemplates.map((template) => template.id),
  bottomTemplate,
  dressTemplate,
  mode,
  onBottomTemplateChange,
  onDressTemplateChange,
  onModeChange,
  onTopTemplateChange,
  topTemplate,
}: {
  availableBottomTemplates?: OutfitPreviewBottomTemplate[]
  availableDressTemplates?: OutfitPreviewDressTemplate[]
  availableTopTemplates?: OutfitPreviewTopTemplate[]
  bottomTemplate: OutfitPreviewBottomTemplate
  dressTemplate: OutfitPreviewDressTemplate
  mode: OutfitPreviewMode
  onBottomTemplateChange?: (template: OutfitPreviewBottomTemplate) => void
  onDressTemplateChange?: (template: OutfitPreviewDressTemplate) => void
  onModeChange?: (mode: OutfitPreviewMode) => void
  onTopTemplateChange?: (template: OutfitPreviewTopTemplate) => void
  topTemplate: OutfitPreviewTopTemplate
}): ReactElement {
  return (
    <div className="space-y-4 rounded-[18px] border border-[var(--dp-border-subtle)] bg-white p-4">
      <div className="space-y-2">
        <p className="label-caps text-muted-foreground">试穿模式</p>
        <div className="flex flex-wrap gap-2">
          <ControlChip
            isActive={mode === 'separates'}
            isDisabled={!onModeChange}
            label="分体穿搭"
            onClick={onModeChange ? () => onModeChange('separates') : undefined}
          />
          <ControlChip
            isActive={mode === 'dress'}
            isDisabled={!onModeChange}
            label="连衣穿搭"
            onClick={onModeChange ? () => onModeChange('dress') : undefined}
          />
        </div>
      </div>

      {mode === 'separates' ? (
        <>
          <ControlRow
            label="上装模板"
            onSelect={onTopTemplateChange}
            options={availableTopTemplates}
            selected={topTemplate}
          />
          <ControlRow
            label="下装模板"
            onSelect={onBottomTemplateChange}
            options={availableBottomTemplates}
            selected={bottomTemplate}
          />
        </>
      ) : (
        <ControlRow
          label="连衣模板"
          onSelect={onDressTemplateChange}
          options={availableDressTemplates}
          selected={dressTemplate}
        />
      )}
    </div>
  )
}