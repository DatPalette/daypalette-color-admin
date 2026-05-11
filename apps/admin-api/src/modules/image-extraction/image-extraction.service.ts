import { Injectable, Logger } from '@nestjs/common';
import type {
  ExtractedColor,
  SamplingBatchDocument,
  SamplingRecord,
} from '@daypalette-color-admin/contracts';
import {
  writeSamplingBatchFile,
} from '../../common/files/sampling-batch-reader';
import type { ExtractImageColorsDto } from './dto/extract-image-colors.dto';

export interface ExtractionResult {
  batchId: string
  records: SamplingRecord[]
  extractedColors: ExtractedColor[][]
}

interface RgbPixel {
  r: number
  g: number
  b: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharpInstance = any

@Injectable()
export class ImageExtractionService {
  private readonly logger = new Logger(ImageExtractionService.name)

  async extractFromUrls(
    urls: string[],
    params: ExtractImageColorsDto,
  ): Promise<ExtractionResult> {
    const sharp = await this.loadSharp()
    const allColors: ExtractedColor[][] = []
    const records: SamplingRecord[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      if (!url) {
        allColors.push([])
        continue
      }
      try {
        const response = await fetch(url)
        if (!response.ok) {
          this.logger.warn(`Failed to fetch image ${url}: ${response.status}`)
          allColors.push([])
          continue
        }
        const buffer = Buffer.from(await response.arrayBuffer())
        const colors = await this.extractDominantColors(sharp, buffer)
        allColors.push(colors)

        const record = this.buildRecord(params, i, colors, url)
        records.push(record)
      } catch (error) {
        this.logger.warn(`Error processing image ${url}: ${error}`)
        allColors.push([])
      }
    }

    const batchId = params.batchId ?? this.buildBatchId(params)
    const batchDocument = this.buildBatchDocument(batchId, params, records)
    await writeSamplingBatchFile(batchId, batchDocument)

    return { batchId, records, extractedColors: allColors }
  }

  async extractFromBuffers(
    buffers: Buffer[],
    params: ExtractImageColorsDto,
  ): Promise<ExtractionResult> {
    const sharp = await this.loadSharp()
    const allColors: ExtractedColor[][] = []
    const records: SamplingRecord[] = []

    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i]
      if (!buffer) {
        allColors.push([])
        continue
      }
      try {
        const colors = await this.extractDominantColors(sharp, buffer)
        allColors.push(colors)

        const record = this.buildRecord(params, i, colors, `upload://${i}`)
        records.push(record)
      } catch (error) {
        this.logger.warn(`Error processing uploaded image ${i}: ${error}`)
        allColors.push([])
      }
    }

    const batchId = params.batchId ?? this.buildBatchId(params)
    const batchDocument = this.buildBatchDocument(batchId, params, records)
    await writeSamplingBatchFile(batchId, batchDocument)

    return { batchId, records, extractedColors: allColors }
  }

  async extractDominantColors(
    sharp: SharpInstance,
    imageBuffer: Buffer,
    numColors = 5,
  ): Promise<ExtractedColor[]> {
    // Resize to small dimensions for performance
    const resized = await sharp(imageBuffer)
      .resize(150, 150, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data, info } = resized
    const pixels: RgbPixel[] = []

    for (let i = 0; i < data.length; i += 3) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      })
    }

    const clusters = this.kMeansClustering(pixels, numColors)
    const totalPixels = pixels.length

    return clusters
      .map((cluster) => {
        const hex = this.rgbToHex(cluster.center.r, cluster.center.g, cluster.center.b)
        const percentage = Math.round((cluster.count / totalPixels) * 100)
        const semanticLabel = this.matchSemanticLabel(hex)
        return { hex, percentage, semanticLabel }
      })
      .filter((c) => {
        // Filter out near-white and near-black
        const brightness = this.getColorBrightness(c.hex)
        return brightness > 10 && brightness < 245
      })
      .sort((a, b) => b.percentage - a.percentage)
  }

  private kMeansClustering(pixels: RgbPixel[], k: number, maxIterations = 20): Array<{ center: RgbPixel; count: number }> {
    if (pixels.length === 0) return []

    // Initialize centers randomly
    const centers: RgbPixel[] = []
    const step = Math.max(1, Math.floor(pixels.length / k))
    for (let i = 0; i < k; i++) {
      const pixel = pixels[Math.min(i * step, pixels.length - 1)]
      if (pixel) {
        centers.push({ ...pixel })
      }
    }

    const assignments = new Array<number>(pixels.length).fill(0)

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign pixels to nearest center
      let changed = false
      for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i]
        if (!pixel) continue
        let minDist = Infinity
        let minIdx = 0
        for (let j = 0; j < centers.length; j++) {
          const center = centers[j]
          if (!center) continue
          const dist = this.colorDistance(pixel, center)
          if (dist < minDist) {
            minDist = dist
            minIdx = j
          }
        }
        if (assignments[i] !== minIdx) {
          assignments[i] = minIdx
          changed = true
        }
      }

      if (!changed) break

      // Recompute centers
      const sums: Array<{ r: number; g: number; b: number; count: number }> = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }))
      for (let i = 0; i < pixels.length; i++) {
        const cluster = assignments[i] ?? 0
        const sum = sums[cluster]
        const pixel = pixels[i]
        if (!sum || !pixel) continue
        sum.r += pixel.r
        sum.g += pixel.g
        sum.b += pixel.b
        sum.count += 1
      }

      for (let j = 0; j < centers.length; j++) {
        const sum = sums[j]
        if (sum && sum.count > 0) {
          centers[j] = {
            r: Math.round(sum.r / sum.count),
            g: Math.round(sum.g / sum.count),
            b: Math.round(sum.b / sum.count),
          }
        }
      }
    }

    // Count assignments
    const counts = new Array<number>(centers.length).fill(0)
    for (const a of assignments) {
      counts[a] = (counts[a] ?? 0) + 1
    }

    return centers.map((center, i) => ({ center, count: counts[i] ?? 0 }))
  }

  private colorDistance(a: RgbPixel, b: RgbPixel): number {
    return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }

  private getColorBrightness(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000
  }

  private matchSemanticLabel(hex: string): string {
    // Simple mapping based on hue
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    const { h, s, l } = this.rgbToHsl(r, g, b)

    if (l > 90) return '壳白'
    if (l < 15) return '炭灰'
    if (s < 15) {
      if (l > 60) return '浅灰'
      return '石墨灰'
    }

    if (h >= 0 && h < 30) return '砖红'
    if (h >= 30 && h < 60) return '浅卡其'
    if (h >= 60 && h < 90) return '橄榄'
    if (h >= 90 && h < 150) return '鼠尾草'
    if (h >= 150 && h < 210) return '雾蓝'
    if (h >= 210 && h < 270) return '藏蓝'
    if (h >= 270 && h < 330) return '棕'
    return '砖红'
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2

    if (max === min) {
      return { h: 0, s: 0, l: l * 100 }
    }

    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    let h = 0
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  private buildRecord(
    params: ExtractImageColorsDto,
    index: number,
    colors: ExtractedColor[],
    sourceUrl: string,
  ): SamplingRecord {
    const now = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10)
    const samplingId = `sam_img_${params.occasionId}_${String(index + 1).padStart(3, '0')}`
    const primary = colors[0]
    const secondary = colors[1]
    const accent = colors[2]

    return {
      samplingId,
      productionBatchId: params.batchId ?? `img-${params.occasionId}`,
      occasionId: params.occasionId,
      themeKey: params.themeKey,
      themeLabelZh: params.themeLabelZh,
      brandName: '图片采集',
      channelType: 'brand-site',
      platform: '图片采集',
      sourceUrl,
      sourceId: `img-${params.occasionId}-${samplingId}`,
      observedAt: now,
      itemCategory: 'outfit',
      colorSummary: colors.slice(1, 4).map((c) => c.semanticLabel ?? c.hex),
      primaryColorSummary: primary?.semanticLabel ?? primary?.hex ?? '',
      secondaryColorSummary: secondary?.semanticLabel ?? secondary?.hex ?? '',
      accentColorSummary: accent?.semanticLabel ?? accent?.hex ?? '',
      digestionStatus: 'sampled',
      candidatePaletteIds: [],
      finalPaletteIds: [],
      styleSignals: [],
      marketSignals: `从图片提取的 ${colors.length} 色配色方案`,
      notes: `色彩: ${colors.map((c) => `${c.semanticLabel ?? c.hex}(${c.hex})`).join(', ')}`,
      seasonHint: 'all',
    }
  }

  private buildBatchId(params: ExtractImageColorsDto): string {
    const timestamp = Date.now().toString(36)
    return `img-${params.occasionId}-${timestamp}`
  }

  private buildBatchDocument(
    batchId: string,
    params: ExtractImageColorsDto,
    records: SamplingRecord[],
  ): SamplingBatchDocument {
    return {
      batch: {
        id: batchId,
        titleZh: `${params.themeLabelZh} 图片取色 ${records.length} 条`,
        occasionId: params.occasionId,
        status: 'collecting',
        themeKeys: [params.themeKey],
        sourceWhitelistIds: ['brand-site'],
        notes: `从 ${records.length} 张图片中提取的配色方案。`,
      },
      items: records,
      summary: {
        completedCount: records.length,
        recordCount: records.length,
        remainingVisibleUniqueCapacity: 0,
        uniqueBrandCount: 1,
        uniquePlatformCount: 1,
        visibleUniqueCapacity: records.length,
        visibleUniqueCount: records.length,
      },
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }

  private async loadSharp(): Promise<SharpInstance> {
    try {
      const sharpModule = await import('sharp')
      return sharpModule.default
    } catch {
      throw new Error(
        'sharp is not installed. Run: pnpm add sharp --filter @daypalette-color-admin/admin-api',
      )
    }
  }
}
