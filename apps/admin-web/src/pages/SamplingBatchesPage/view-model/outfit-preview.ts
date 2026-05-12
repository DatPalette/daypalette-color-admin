import type {
  OutfitPreviewBottomTemplate,
  OutfitPreviewDressTemplate,
  OutfitPreviewMode,
  OutfitPreviewModel,
  OutfitPreviewTopTemplate,
} from '@/components/outfit-preview'
import type { SamplingRecordDto } from '@/models/sampling-batches'

const semanticPreviewColorPresets = [
  {
    hex: '#F3EEE6',
    keywords: ['壳白', '米白', '奶白', '乳白', '象牙白', '暖白', '白'],
  },
  {
    hex: '#A9B7C4',
    keywords: ['雾蓝', '灰蓝', '雾灰蓝', '蓝灰', 'steel blue', 'mist blue'],
  },
  {
    hex: '#CCB79E',
    keywords: ['浅卡其', '卡其', '沙色', '燕麦', '驼', 'camel', 'khaki', 'beige'],
  },
  {
    hex: '#61656B',
    keywords: ['炭灰', '深灰', '石墨', 'charcoal', 'graphite', '灰'],
  },
  {
    hex: '#31445D',
    keywords: ['藏蓝', '海军蓝', 'navy'],
  },
  {
    hex: '#8E9780',
    keywords: ['橄榄', '鼠尾草', 'sage', '军绿', '苔绿', 'olive'],
  },
  {
    hex: '#7D6154',
    keywords: ['咖', '棕', '可可', 'brown', 'mocha'],
  },
  {
    hex: '#A05C56',
    keywords: ['砖红', '赤陶', 'terracotta', 'rust'],
  },
] as const

const fallbackPreviewHexes = ['#F3EEE6', '#A9B7C4', '#CCB79E'] as const

const dressKeywords = ['dress', 'gown', 'one-piece', '连衣']
const maxiKeywords = ['maxi', '长']
const midiKeywords = ['midi', 'mid', '中长']
const miniKeywords = ['mini', '短']
const skirtKeywords = ['skirt', '裙']
const shortsKeywords = ['shorts', '短裤']
const outerwearKeywords = ['blazer', 'jacket', 'coat', 'trench', 'outerwear', 'cardigan', '西装', '外套', '风衣', '大衣']
const camisoleKeywords = ['camisole', 'tank', 'vest', '吊带', '背心']
const shirtKeywords = ['shirt', 'blouse', '衬衫']
const longSleeveKeywords = ['long sleeve', '长袖', 'sweater', 'knit']

export interface SamplingPreviewSwatch {
  hex: string
  label: string
  slot: string
}

export interface SamplingOutfitPreviewSelection {
  bottomTemplate: OutfitPreviewBottomTemplate
  dressTemplate: OutfitPreviewDressTemplate
  mode: OutfitPreviewMode
  topTemplate: OutfitPreviewTopTemplate
}

function hasKeyword(source: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => source.includes(keyword))
}

function getFallbackPreviewHex(fallbackIndex: number): string {
  if (fallbackIndex <= 0) {
    return fallbackPreviewHexes[0]
  }

  if (fallbackIndex === 1) {
    return fallbackPreviewHexes[1]
  }

  return fallbackPreviewHexes[2]
}

function resolveSemanticPreviewHex(label: string, fallbackIndex: number): string {
  const trimmed = label.trim()

  if (!trimmed) {
    return getFallbackPreviewHex(fallbackIndex)
  }

  if (/^#(?:[\dA-F]{3}){1,2}$/i.test(trimmed)) {
    return trimmed
  }

  const normalized = trimmed.toLowerCase()
  const matchedPreset = semanticPreviewColorPresets.find((preset) =>
    preset.keywords.some((keyword) => normalized.includes(keyword)),
  )

  return matchedPreset?.hex ?? getFallbackPreviewHex(fallbackIndex)
}

function normalizeCategory(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function inferDressTemplate(category: string): OutfitPreviewDressTemplate {
  if (hasKeyword(category, maxiKeywords)) {
    return 'maxi-dress'
  }

  if (hasKeyword(category, miniKeywords)) {
    return 'mini-dress'
  }

  return 'midi-dress'
}

function inferBottomTemplate(category: string): OutfitPreviewBottomTemplate {
  if (hasKeyword(category, shortsKeywords)) {
    return 'shorts'
  }

  if (hasKeyword(category, skirtKeywords)) {
    if (hasKeyword(category, maxiKeywords)) {
      return 'maxi-skirt'
    }

    if (hasKeyword(category, miniKeywords)) {
      return 'mini-skirt'
    }

    return 'midi-skirt'
  }

  return 'trousers'
}

function inferTopTemplate(category: string): OutfitPreviewTopTemplate {
  if (hasKeyword(category, outerwearKeywords)) {
    return 'outerwear'
  }

  if (hasKeyword(category, camisoleKeywords)) {
    return 'camisole'
  }

  if (hasKeyword(category, shirtKeywords)) {
    return 'shirt'
  }

  if (hasKeyword(category, longSleeveKeywords)) {
    return 'long-sleeve'
  }

  return 'short-sleeve'
}

function buildPreviewToken(
  swatch: SamplingPreviewSwatch | undefined,
  fallbackIndex: number,
  fallbackLabel: string,
): OutfitPreviewModel['colors'][keyof OutfitPreviewModel['colors']] {
  return {
    hex: swatch?.hex ?? getFallbackPreviewHex(fallbackIndex),
    label: swatch?.label ?? fallbackLabel,
  }
}

export function buildDefaultSamplingOutfitPreviewSelection(): SamplingOutfitPreviewSelection {
  return {
    bottomTemplate: 'trousers',
    dressTemplate: 'midi-dress',
    mode: 'separates',
    topTemplate: 'short-sleeve',
  }
}

export function buildSamplingPreviewSwatches(record: SamplingRecordDto): SamplingPreviewSwatch[] {
  const seen = new Set<string>()
  const candidates = [
    { slot: '主色', label: record.primaryColorSummary ?? '' },
    { slot: '次色', label: record.secondaryColorSummary ?? '' },
    { slot: '点缀', label: record.accentColorSummary ?? '' },
    ...record.colorSummary.map((label) => ({ slot: '综合色', label })),
  ]

  const swatches: SamplingPreviewSwatch[] = []

  for (const candidate of candidates) {
    const label = candidate.label.trim()

    if (!label || seen.has(label)) {
      continue
    }

    seen.add(label)
    swatches.push({
      hex: resolveSemanticPreviewHex(label, swatches.length),
      label,
      slot: candidate.slot,
    })

    if (swatches.length === 3) {
      break
    }
  }

  return swatches
}

export function buildSamplingOutfitPreviewSelection(record: SamplingRecordDto): SamplingOutfitPreviewSelection {
  const category = normalizeCategory(record.itemCategory)

  if (category && hasKeyword(category, dressKeywords)) {
    return {
      ...buildDefaultSamplingOutfitPreviewSelection(),
      dressTemplate: inferDressTemplate(category),
      mode: 'dress',
    }
  }

  return {
    bottomTemplate: inferBottomTemplate(category),
    dressTemplate: 'midi-dress',
    mode: 'separates',
    topTemplate: inferTopTemplate(category),
  }
}

export function buildSamplingOutfitPreviewModel(
  record: SamplingRecordDto,
  selection: SamplingOutfitPreviewSelection,
): OutfitPreviewModel {
  const swatches = buildSamplingPreviewSwatches(record)

  return {
    bottomTemplate: selection.bottomTemplate,
    colors: {
      accent: buildPreviewToken(swatches[2], 2, '点缀色待补'),
      main: buildPreviewToken(swatches[0], 0, '主色待补'),
      secondary: buildPreviewToken(swatches[1], 1, '次色待补'),
    },
    dressTemplate: selection.dressTemplate,
    mode: selection.mode,
    silhouetteId: 'female-line-v1',
    topTemplate: selection.topTemplate,
  }
}