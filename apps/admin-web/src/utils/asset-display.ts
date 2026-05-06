interface LabeledOption {
  label: string
  value: string
}

const dictionarySelectionModeLabels: Record<string, string> = {
  mixed: '混合选择',
  multi: '多选',
  single: '单选',
}

const dictionaryEntityLabels: Record<string, string> = {
  baseColor: '基础色',
  collection: '合集',
  palette: '配色盘',
}

const dictionaryFieldLabels: Record<string, Record<string, string>> = {
  baseColor: {
    colorFamily: '色系',
    lightnessLevel: '明度等级',
    occasionTags: '场合标签',
    saturationLevel: '饱和度等级',
    status: '状态',
    styleTags: '风格标签',
    tone: '冷暖',
  },
  collection: {
    occasionTags: '场合标签',
    releaseMode: '发布模式',
    status: '状态',
    styleTags: '风格标签',
    themeType: '主题类型',
  },
  palette: {
    moodTags: '心情标签',
    occasionId: '场合',
    seasonTags: '季节标签',
    sourceCollectionIds: '来源合集',
    status: '状态',
    styleTags: '风格标签',
  },
}

const paletteSafetyLevelLabels: Record<string, string> = {
  safe: '安全',
}

const paletteSourceTypeLabels: Record<string, string> = {
  curated: '人工策划',
  generated: '自动生成',
  imported: '外部导入',
  manual: '手工录入',
  mixed: '混合来源',
}

function normalizeComparableLabel(value: string): string {
  return value.replace(/[\s_-]+/g, '').toLowerCase()
}

export function buildOptionLabelMap<TOption extends LabeledOption>(options: TOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

export function resolveOptionLabel(optionLabelMap: Map<string, string>, value: string): string {
  return optionLabelMap.get(value) ?? value
}

export function getBooleanLabel(value: boolean, trueLabel = '是', falseLabel = '否'): string {
  return value ? trueLabel : falseLabel
}

export function shouldShowEnglishLabel(identifier: string, labelEn?: string | null): boolean {
  const normalizedIdentifier = normalizeComparableLabel(identifier)
  const normalizedLabel = normalizeComparableLabel(labelEn?.trim() ?? '')

  if (!normalizedLabel) {
    return false
  }

  if (!normalizedIdentifier) {
    return true
  }

  return normalizedIdentifier !== normalizedLabel
}

export function getDictionarySelectionModeLabel(selectionMode: string): string {
  return dictionarySelectionModeLabels[selectionMode] ?? selectionMode
}

export function getDictionaryEntityLabel(entity: string): string {
  return dictionaryEntityLabels[entity] ?? entity
}

export function getDictionaryEntityScopeSummary(entityScopes: string[]): string {
  return entityScopes.map(getDictionaryEntityLabel).join(' / ')
}

export function getDictionaryFieldMappingLabel(entity: string, field: string): string {
  const fieldLabel = dictionaryFieldLabels[entity]?.[field] ?? field

  return `${getDictionaryEntityLabel(entity)} / ${fieldLabel}`
}

export function getPaletteSafetyLevelLabel(value: string): string {
  return paletteSafetyLevelLabels[value] ?? value
}

export function getPaletteSourceTypeLabel(value: string): string {
  return paletteSourceTypeLabels[value] ?? value
}