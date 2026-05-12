import { Injectable, Logger } from '@nestjs/common';
import type {
  LlmBatchGenerateParams,
  SamplingBatchDocument,
  SamplingBatchSummary,
  SamplingRecord,
} from '@daypalette-color-admin/contracts';
import {
  readSamplingBatchFile,
  writeSamplingBatchFile,
} from '../../common/files/sampling-batch-reader';

interface LlmRecordResponse {
  brandName: string
  channelType: string
  itemCategory: string
  platform: string
  primaryColorSummary: string
  secondaryColorSummary: string
  accentColorSummary: string
  colorSummary: string[]
  styleSignals: string[]
  marketSignals: string
  notes: string
  seasonHint: string
}

const RECORDS_PER_LLM_CALL = 10

const OCCASION_LABEL_MAP: Record<string, string> = {
  workday: '温柔通勤',
  'city-weekend': '周末约会',
  'holiday-outing': '清风户外',
  'light-social': '晚宴流光',
}

const THEME_LABEL_MAP: Record<string, string> = {
  'polished-light-commute': '轻正式通勤',
  'urban-minimal-foundation': '都市极简基础',
  'soft-tone-lift': '柔调提亮',
  'mist-cool-commute': '雾冷调通勤',
  'warm-grounded-commute': '暖调沉稳通勤',
  'city-weekend-soft': '城市周末柔和',
  'date-evening-glow': '约会暮光',
  'playful-pop-weekend': '趣味波普周末',
  'relaxed-denim-weekend': '休闲牛仔周末',
  'holiday-sunlit-escape': '假日阳光逃逸',
  'nature-earth-walk': '自然大地漫步',
  'coastal-breeze-holiday': '海风假日',
  'adventure-sport-outdoor': '探险运动户外',
  'light-social-glow': '社交微光',
  'elegant-dinner-luxe': '优雅晚宴奢华',
  'moody-evening-drama': '暗调晚宴戏剧感',
  'minimalist-evening': '极简晚宴',
}

const CATEGORY_MATRIX: Record<string, string[]> = {
  workday: ['blazer', 'shirt', 'cardigan', 'coat', 'dress', 'knitwear', 'skirt', 'trench', 'trousers', 'blouse'],
  'city-weekend': ['dress', 'cardigan', 'jeans', 'blouse', 'skirt', 'sweater', 'jacket', 'tee', 'coat', 'knitwear'],
  'holiday-outing': ['jacket', 'vest', 'cargo-pants', 'windbreaker', 'hiking-shoes', 'backpack', 'polo', 'shorts', 'parka', 'fleece'],
  'light-social': ['dress', 'blazer', 'heels', 'clutch', 'silk-blouse', 'tailored-pants', 'wrap-dress', 'statement-earrings', 'evening-coat', 'satin-skirt'],
}

@Injectable()
export class LlmBatchGenerationService {
  private readonly logger = new Logger(LlmBatchGenerationService.name)

  async generateLlmBatch(
    params: LlmBatchGenerateParams,
    onProgress?: (generated: number, total: number) => void,
  ): Promise<{ records: SamplingRecord[]; batchDocument: SamplingBatchDocument }> {
    const apiKey = process.env.DAYPALETTE_LLM_API_KEY?.trim()
    const model = process.env.DAYPALETTE_LLM_MODEL?.trim()
    const baseUrl = (process.env.DAYPALETTE_LLM_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '')

    if (!apiKey || !model) {
      throw new Error('LLM API credentials not configured. Set DAYPALETTE_LLM_API_KEY and DAYPALETTE_LLM_MODEL.')
    }

    const batchId = this.buildBatchId(params)
    const categories = CATEGORY_MATRIX[params.occasionId] ?? CATEGORY_MATRIX.workday ?? ['blazer', 'shirt', 'dress', 'skirt', 'trousers']
    const allRecords: SamplingRecord[] = []
    const batches = Math.ceil(params.targetCount / RECORDS_PER_LLM_CALL)

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const remaining = params.targetCount - allRecords.length
      const count = Math.min(RECORDS_PER_LLM_CALL, remaining)

      const records = await this.callLlmForRecords({
        apiKey,
        model,
        baseUrl,
        params,
        count,
        startIndex: allRecords.length,
        categories,
        batchIndex,
      })

      allRecords.push(...records)
      onProgress?.(allRecords.length, params.targetCount)
    }

    const batchDocument = this.buildBatchDocument(batchId, params, allRecords)
    await writeSamplingBatchFile(batchId, batchDocument)

    return { records: allRecords, batchDocument }
  }

  private async callLlmForRecords(context: {
    apiKey: string
    model: string
    baseUrl: string
    params: LlmBatchGenerateParams
    count: number
    startIndex: number
    categories: string[]
    batchIndex: number
  }): Promise<SamplingRecord[]> {
    const { apiKey, model, baseUrl, params, count, startIndex, categories, batchIndex } = context
    const batchId = this.buildBatchId(params)
    const occasionLabel = OCCASION_LABEL_MAP[params.occasionId] ?? params.occasionId
    const themeLabels = params.themeKeys.map((k) => THEME_LABEL_MAP[k] ?? k).join('、')

    const systemPrompt = `你是一位专业的女性时尚配色分析师。你的任务是为穿搭应用生成高质量的三色配色方案记录。

要求：
1. 面向 25-35 岁女性用户
2. 配色方案要参考当季流行色趋势，兼顾经典与时尚
3. 每组配色包含：主色（面积最大）、辅色（面积次之）、点缀色（小面积亮点）
4. 色彩用中文描述（如"雾灰蓝"、"燕麦驼"），不要用 hex 值
5. 风格要多样化，避免雷同
6. 每条记录需要给出合理的品牌名和平台（可以是真实存在的品牌）

可选品类：${categories.join(', ')}
可选 channelType：brand-site, brand-flagship-store, multi-brand-platform, marketplace-brand-store
可选 seasonHint：spring, summer, autumn, winter
可选 styleSignals 示例：tailored, minimal, romantic, fresh, earthy, elegant, soft, urban, playful, sport, clean, calm, warm, cool, bold`

    const userPrompt = `请为「${occasionLabel}」场景生成 ${count} 条女性穿搭配色采样记录。

主题方向：${themeLabels}
${params.styleConstraints ? `风格约束：${params.styleConstraints}` : ''}

要求：
1. 每条记录的 brandName 尽量不同，覆盖多种品牌
2. 每条记录的 itemCategory 从上述品类中选取，尽量多样
3. colorSummary 数组包含 1-3 个辅色的中文色彩描述
4. primaryColorSummary、secondaryColorSummary、accentColorSummary 各为一个中文色彩词
5. styleSignals 包含 2-4 个风格标签
6. marketSignals 为一句话描述该配色的市场定位
7. notes 为一句话穿搭建议

严格按以下 JSON 格式返回，不要添加任何 markdown 标记：
{
  "records": [
    {
      "brandName": "品牌名",
      "channelType": "brand-site",
      "itemCategory": "品类",
      "platform": "平台名",
      "primaryColorSummary": "主色描述",
      "secondaryColorSummary": "辅色描述",
      "accentColorSummary": "点缀色描述",
      "colorSummary": ["辅色描述1", "辅色描述2"],
      "styleSignals": ["风格1", "风格2"],
      "marketSignals": "市场定位描述",
      "notes": "穿搭建议",
      "seasonHint": "spring"
    }
  ]
}`

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`LLM API request failed (${response.status}): ${errorText}`)
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
    }
    const content = payload.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('LLM returned empty response.')
    }

    const parsed = this.parseLlmResponse(content)
    return this.mapToSamplingRecords(parsed, params, batchId, startIndex)
  }

  private parseLlmResponse(content: string): LlmRecordResponse[] {
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/i)
    const jsonPayload = jsonBlockMatch?.[1] ?? content
    const parsed = JSON.parse(jsonPayload) as { records?: LlmRecordResponse[] }
    return parsed.records ?? []
  }

  private mapToSamplingRecords(
    llmRecords: LlmRecordResponse[],
    params: LlmBatchGenerateParams,
    batchId: string,
    startIndex: number,
  ): SamplingRecord[] {
    const categories = CATEGORY_MATRIX[params.occasionId] ?? CATEGORY_MATRIX.workday ?? ['blazer', 'shirt', 'dress']
    const now = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10)
    const fallbackThemeKey = params.themeKeys[0] ?? 'general'

    return llmRecords.map((record, i) => {
      const index = startIndex + i
      const samplingId = `sam_${params.occasionId}_llm_${String(index + 1).padStart(3, '0')}`
      const category = record.itemCategory || categories[index % categories.length] || 'blazer'
      const themeKey = params.themeKeys[index % params.themeKeys.length] ?? fallbackThemeKey

      return {
        samplingId,
        productionBatchId: batchId,
        occasionId: params.occasionId,
        themeKey,
        themeLabelZh: THEME_LABEL_MAP[themeKey] ?? themeKey,
        brandName: record.brandName || 'Unknown',
        channelType: record.channelType || 'brand-site',
        platform: record.platform || record.brandName || 'Unknown',
        sourceUrl: '',
        sourceId: `candidate-${record.brandName?.toLowerCase().replace(/\s+/g, '-')}-${category}-${samplingId}`,
        observedAt: now,
        itemCategory: category,
        colorSummary: (record.colorSummary ?? []).filter(Boolean).slice(0, 3),
        primaryColorSummary: record.primaryColorSummary || '',
        secondaryColorSummary: record.secondaryColorSummary || '',
        accentColorSummary: record.accentColorSummary || '',
        digestionStatus: 'sampled' as const,
        candidatePaletteIds: [],
        finalPaletteIds: [],
        styleSignals: (record.styleSignals ?? []).filter(Boolean),
        marketSignals: record.marketSignals || '',
        notes: record.notes || '',
        seasonHint: record.seasonHint || 'all',
      }
    })
  }

  private buildBatchId(params: LlmBatchGenerateParams): string {
    const timestamp = Date.now().toString(36)
    return `llm-${params.occasionId}-${timestamp}`
  }

  private buildBatchDocument(
    batchId: string,
    params: LlmBatchGenerateParams,
    records: SamplingRecord[],
  ): SamplingBatchDocument {
    const uniqueBrands = new Set(records.map((r) => r.brandName))
    const uniquePlatforms = new Set(records.map((r) => r.platform))

    const summary: SamplingBatchSummary = {
      completedCount: records.length,
      recordCount: records.length,
      remainingVisibleUniqueCapacity: 0,
      uniqueBrandCount: uniqueBrands.size,
      uniquePlatformCount: uniquePlatforms.size,
      visibleUniqueCapacity: records.length,
      visibleUniqueCount: records.length,
    }

    return {
      batch: {
        id: batchId,
        titleZh: params.titleZh,
        occasionId: params.occasionId,
        status: 'collecting',
        themeKeys: params.themeKeys,
        sourceWhitelistIds: params.sourceWhitelistIds ?? [
          'brand-site',
          'brand-flagship-store',
          'multi-brand-platform',
          'marketplace-brand-store',
        ],
        notes: `由 LLM 批量生成，共 ${records.length} 条记录。`,
      },
      items: records,
      summary,
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }
}
