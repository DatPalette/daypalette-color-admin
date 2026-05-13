import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export const packageRoot = path.resolve(currentDir, '../..')
export const defaultLocalRoot = path.join(packageRoot, '.local')
export const defaultRunsRoot = path.join(defaultLocalRoot, 'runs')

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return String(error)
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf8')
  return JSON.parse(content) as T
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function writeTextFile(filePath: string, value: string): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, value, 'utf8')
}

export function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function nowStamp(date = new Date()): string {
  return date.toISOString().replaceAll(':', '').replaceAll('.', '').replace('T', '-').slice(0, 15)
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'run'
}

export function createRunId(label: string): string {
  return `${slugify(label)}-${nowStamp()}-${crypto.randomUUID().slice(0, 8)}`
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isDataImageUrl(value: string): boolean {
  return value.startsWith('data:image/')
}

export function resolveFromBase(baseDir: string, targetPath: string): string {
  if (path.isAbsolute(targetPath)) {
    return targetPath
  }

  return path.resolve(baseDir, targetPath)
}

export function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base
  }

  const nextEntries = new Map<string, unknown>(Object.entries(base))

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = nextEntries.get(key)

    if (Array.isArray(overrideValue)) {
      nextEntries.set(key, overrideValue)
      continue
    }

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      nextEntries.set(key, deepMerge(baseValue, overrideValue))
      continue
    }

    nextEntries.set(key, overrideValue)
  }

  return Object.fromEntries(nextEntries) as T
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isPlainObject(value) ? value : undefined
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

export function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const strings = value.filter((item): item is string => typeof item === 'string')
  return strings.length > 0 ? strings : undefined
}

export function getMimeTypeFromExtension(filePath: string): string | undefined {
  const extension = path.extname(filePath).toLowerCase()

  switch (extension) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.bmp':
      return 'image/bmp'
    case '.tiff':
    case '.tif':
      return 'image/tiff'
    case '.gif':
      return 'image/gif'
    case '.heic':
      return 'image/heic'
    case '.heif':
      return 'image/heif'
    default:
      return undefined
  }
}

export async function resolveImageInputString(value: string, baseDir: string): Promise<string> {
  if (isHttpUrl(value) || isDataImageUrl(value)) {
    return value
  }

  const absolutePath = resolveFromBase(baseDir, value)

  if (!(await pathExists(absolutePath))) {
    return value
  }

  const mimeType = getMimeTypeFromExtension(absolutePath)

  if (!mimeType) {
    return value
  }

  const buffer = await fs.readFile(absolutePath)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

export async function resolveImageInputValue(value: unknown, baseDir: string): Promise<unknown> {
  if (typeof value === 'string') {
    return resolveImageInputString(value, baseDir)
  }

  if (Array.isArray(value)) {
    const resolved = await Promise.all(value.map((item) => resolveImageInputValue(item, baseDir)))
    return resolved
  }

  if (!isPlainObject(value)) {
    return value
  }

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, nestedValue]) => {
      return [key, await resolveImageInputValue(nestedValue, baseDir)] as const
    }),
  )

  return Object.fromEntries(entries)
}

export function sanitizeForPersistence(value: unknown): unknown {
  if (typeof value === 'string') {
    if (isDataImageUrl(value)) {
      return `[inline-image-omitted length=${value.length}]`
    }

    if (value.length > 12000 && /^[A-Za-z0-9+/=]+$/.test(value)) {
      return `[base64-omitted length=${value.length}]`
    }

    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForPersistence(item))
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, sanitizeForPersistence(nestedValue)]),
  )
}

export function computeWeightedOverall(input: {
  pose: number
  vectorFlatness: number
  faceAndAesthetic: number
  structure: number
  svgCleanup: number
}): number {
  const weighted =
    input.pose * 0.4
    + input.vectorFlatness * 0.25
    + input.faceAndAesthetic * 0.15
    + input.structure * 0.15
    + input.svgCleanup * 0.05

  return Math.round(weighted * 100) / 100
}

export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}