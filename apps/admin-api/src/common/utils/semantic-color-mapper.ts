const semanticColorBucketPresets = [
  {
    bucket: 'light-neutral',
    keywords: ['壳白', '米白', '奶白', '乳白', '象牙白', '暖白', '白'],
    hexSamples: ['#F5F0E8', '#FAF7F2', '#FFFDF8'],
  },
  {
    bucket: 'mist-blue',
    keywords: ['雾蓝', '灰蓝', '雾灰蓝', '蓝灰', 'steel blue', 'mist blue'],
    hexSamples: ['#A9B7C4', '#8FA3B0', '#B8C8D6'],
  },
  {
    bucket: 'beige',
    keywords: ['浅卡其', '卡其', '沙色', '燕麦', '驼', 'camel', 'khaki', 'beige'],
    hexSamples: ['#D4C5A9', '#C8B68E', '#E0D5BE'],
  },
  {
    bucket: 'gray',
    keywords: ['炭灰', '深灰', '石墨', 'charcoal', 'graphite', '灰'],
    hexSamples: ['#5A5A5A', '#6B6B6B', '#4A4A4A'],
  },
  {
    bucket: 'navy',
    keywords: ['藏蓝', '海军蓝', 'navy'],
    hexSamples: ['#2C3E50', '#1B2838', '#34495E'],
  },
  {
    bucket: 'olive',
    keywords: ['橄榄', '鼠尾草', 'sage', '军绿', '苔绿', 'olive'],
    hexSamples: ['#6B7B3A', '#808A5C', '#5C6B2E'],
  },
  {
    bucket: 'brown',
    keywords: ['咖', '棕', '可可', 'brown', 'mocha'],
    hexSamples: ['#8B6914', '#6B4226', '#A0785A'],
  },
  {
    bucket: 'rust',
    keywords: ['砖红', '赤陶', 'terracotta', 'rust'],
    hexSamples: ['#B7472A', '#A0522D', '#C45A3C'],
  },
] as const

export type SemanticColorBucket =
  (typeof semanticColorBucketPresets)[number]['bucket']

const semanticBucketLabelOptions: Record<SemanticColorBucket, string[]> = {
  beige: ['浅卡其', '燕麦驼', '沙色卡其', '灰卡其', '奶驼', '暖燕麦', '浅驼', '柔卡其'],
  brown: ['焦糖棕', '可可棕', '栗棕', '深焦糖棕', '橡木棕', '摩卡棕', '暖咖棕', '榛棕'],
  gray: ['石墨灰', '深岩灰', '铅墨灰', '冷石墨', '板岩灰', '铁灰', '深雾灰', '烟炭灰'],
  'light-neutral': ['壳白', '云雾白', '雾米白', '珍珠白', '暖壳白', '奶雾白', '冰米白', '霜白'],
  'mist-blue': ['雾灰蓝', '钢蓝灰', '冷雾蓝', '浅钢蓝', '薄雾蓝', '烟灰蓝', '海雾蓝', '银雾蓝'],
  navy: ['墨海军蓝', '深海军蓝', '冷海军蓝', '雾海军蓝', '藏蓝黑', '夜海军蓝', '深藏蓝', '岩海军蓝'],
  olive: ['浅橄榄灰', '鼠尾草灰', '苔绿灰', '橄榄雾灰', '雾橄榄', '冷橄榄灰', '浅鼠尾草', '苔雾绿'],
  rust: ['暖砖红', '茶砖红', '深砖红', '浅砖红', '雾砖红', '赤陶红', '暖赤陶', '赤陶砖红'],
}

function normalizeToken(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

export function resolveSemanticColorBucket(
  value: string | undefined,
  fallbackIndex: number,
): string {
  const normalized = normalizeToken(value)

  if (!normalized) {
    return `fallback-${fallbackIndex}`
  }

  const matchedPreset = semanticColorBucketPresets.find((preset) =>
    preset.keywords.some((keyword) => normalized.includes(keyword)),
  )

  return matchedPreset?.bucket ?? `fallback-${fallbackIndex}`
}

export function isSemanticColorBucket(
  value: string | undefined,
): value is SemanticColorBucket {
  return semanticColorBucketPresets.some((preset) => preset.bucket === value)
}

export function pickSemanticBucketLabel(
  bucket: SemanticColorBucket,
  variantIndex: number,
  slotOffset: number,
): string {
  const labelPool = semanticBucketLabelOptions[bucket]

  if (!labelPool || labelPool.length === 0) {
    return bucket
  }

  return labelPool[(variantIndex + slotOffset) % labelPool.length] ?? bucket
}

export function getSemanticBucketHexSamples(bucket: string): string[] {
  const preset = semanticColorBucketPresets.find((p) => p.bucket === bucket)
  return preset ? [...preset.hexSamples] : []
}

export function getAllSemanticBuckets(): Array<{
  bucket: string
  keywords: readonly string[]
  hexSamples: readonly string[]
}> {
  return semanticColorBucketPresets.map((p) => ({
    bucket: p.bucket,
    keywords: p.keywords,
    hexSamples: p.hexSamples,
  }))
}
