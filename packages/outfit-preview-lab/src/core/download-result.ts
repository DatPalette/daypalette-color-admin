import fs from 'node:fs/promises'
import path from 'node:path'

import type { ImageOutputFormat } from '../types/job.js'
import type { GeneratedImage } from '../types/provider.js'
import type { SavedImage } from '../types/run-record.js'
import { ensureDir } from './utils.js'

function normalizeBase64(value: string): string {
  if (value.startsWith('data:image/')) {
    const commaIndex = value.indexOf(',')
    return commaIndex >= 0 ? value.slice(commaIndex + 1) : value
  }

  return value
}

function resolveExtension(image: GeneratedImage, defaultFormat?: ImageOutputFormat): string {
  if (image.remoteUrl) {
    try {
      const url = new URL(image.remoteUrl)
      const extension = path.extname(url.pathname)
      if (extension) {
        return extension
      }
    } catch {
      // ignore malformed URLs and fall back
    }
  }

  if (defaultFormat === 'jpeg') {
    return '.jpg'
  }

  if (defaultFormat === 'png') {
    return '.png'
  }

  if (image.format === 'jpeg') {
    return '.jpg'
  }

  return '.png'
}

export async function saveGeneratedImages(
  runDir: string,
  images: GeneratedImage[],
  defaultFormat?: ImageOutputFormat,
): Promise<SavedImage[]> {
  const imagesDir = path.join(runDir, 'images')
  await ensureDir(imagesDir)

  const savedImages: SavedImage[] = []

  for (const [index, image] of images.entries()) {
    const extension = resolveExtension(image, defaultFormat)
    const fileName = `${String(index + 1).padStart(2, '0')}${extension}`
    const filePath = path.join(imagesDir, fileName)

    if (image.remoteUrl) {
      const response = await fetch(image.remoteUrl)

      if (!response.ok) {
        throw new Error(`Failed to download image: ${image.remoteUrl}`)
      }

      const content = Buffer.from(await response.arrayBuffer())
      await fs.writeFile(filePath, content)
      savedImages.push({
        index,
        fileName,
        filePath,
        source: 'url',
        remoteUrl: image.remoteUrl,
        size: image.size,
      })
      continue
    }

    if (image.b64Json) {
      const content = Buffer.from(normalizeBase64(image.b64Json), 'base64')
      await fs.writeFile(filePath, content)
      savedImages.push({
        index,
        fileName,
        filePath,
        source: 'b64_json',
        size: image.size,
      })
    }
  }

  return savedImages
}