import path from 'node:path'

export interface PaletteDataFilePaths {
  baseColors: string
  collections: string
  dictionaries: string
  palettes: string
}

export function resolvePaletteSamplingDataRoot(adminRoot: string): string {
  return path.join(adminRoot, 'data/palette-sampling')
}

export function resolvePaletteSamplingBatchFilePath(adminRoot: string, batchId: string): string {
  return path.join(resolvePaletteSamplingDataRoot(adminRoot), `${batchId}.v1.json`)
}

export function resolvePaletteDataFilePaths(dayPaletteRoot: string): PaletteDataFilePaths {
  const paletteDataRoot = path.join(
    dayPaletteRoot,
    'entry/src/main/resources/rawfile/palette-data',
  )

  return {
    baseColors: path.join(paletteDataRoot, 'base-colors.v1.json'),
    collections: path.join(paletteDataRoot, 'collections.v1.json'),
    dictionaries: path.join(paletteDataRoot, 'dictionaries.v1.json'),
    palettes: path.join(paletteDataRoot, 'palettes.v1.json'),
  }
}