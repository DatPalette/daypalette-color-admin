import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const paletteDataRelativePath = 'entry/src/main/resources/rawfile/palette-data';

function resolveCandidateRoots(): string[] {
  const candidates = [
    process.env.DAY_PALETTE_ROOT,
    path.resolve(process.cwd(), '../../../day_palette'),
    path.resolve(process.cwd(), '../../day_palette'),
    path.resolve(process.cwd(), '../day_palette'),
  ];

  return candidates.filter((candidate): candidate is string => Boolean(candidate));
}

function hasPaletteDataDirectory(root: string): boolean {
  return existsSync(path.join(root, paletteDataRelativePath, 'base-colors.v1.json'));
}

export function resolveDayPaletteRoot(): string {
  for (const candidate of resolveCandidateRoots()) {
    if (hasPaletteDataDirectory(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Unable to resolve the day_palette repository root. Set DAY_PALETTE_ROOT or run the API from the expected workspace layout.',
  );
}

export function resolvePaletteDataFilePath(fileName: string): string {
  return path.join(resolveDayPaletteRoot(), paletteDataRelativePath, fileName);
}

export async function readPaletteDataFile<T>(fileName: string): Promise<T> {
  const fileContent = await readFile(resolvePaletteDataFilePath(fileName), 'utf8');

  return JSON.parse(fileContent) as T;
}

export async function writePaletteDataFile<T>(fileName: string, data: T): Promise<void> {
  await writeFile(resolvePaletteDataFilePath(fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}