import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  resolvePaletteSamplingBatchFilePath,
  resolvePaletteSamplingDataRoot,
} from '@daypalette-color-admin/file-store';

function resolveCandidateRoots(): string[] {
  const candidates = [
    process.env.DAYPALETTE_COLOR_ADMIN_ROOT,
    process.cwd(),
    path.resolve(process.cwd(), '../..'),
    path.resolve(process.cwd(), '..'),
  ];

  return candidates.filter((candidate): candidate is string => Boolean(candidate));
}

function hasAdminWorkspaceRoot(root: string): boolean {
  return (
    existsSync(path.join(root, 'pnpm-workspace.yaml')) &&
    existsSync(path.join(root, 'apps/admin-api/package.json'))
  );
}

export function resolveDayPaletteColorAdminRoot(): string {
  for (const candidate of resolveCandidateRoots()) {
    if (hasAdminWorkspaceRoot(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Unable to resolve the daypalette-color-admin repository root. Set DAYPALETTE_COLOR_ADMIN_ROOT or run the API from the expected workspace layout.',
  );
}

export async function listSamplingBatchFiles(): Promise<string[]> {
  const samplingRoot = resolvePaletteSamplingDataRoot(resolveDayPaletteColorAdminRoot());

  if (!existsSync(samplingRoot)) {
    return [];
  }

  const fileNames = await readdir(samplingRoot);

  return fileNames.filter((fileName) => fileName.endsWith('.v1.json'));
}

export async function readSamplingBatchFile<T>(batchId: string): Promise<T> {
  const filePath = resolvePaletteSamplingBatchFilePath(resolveDayPaletteColorAdminRoot(), batchId);
  const fileContent = await readFile(filePath, 'utf8');

  return JSON.parse(fileContent) as T;
}

export async function writeSamplingBatchFile<T>(batchId: string, data: T): Promise<void> {
  const adminRoot = resolveDayPaletteColorAdminRoot();
  const samplingRoot = resolvePaletteSamplingDataRoot(adminRoot);

  await mkdir(samplingRoot, { recursive: true });
  await writeFile(
    resolvePaletteSamplingBatchFilePath(adminRoot, batchId),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  );
}

export async function deleteSamplingBatchFile(batchId: string): Promise<void> {
  await rm(resolvePaletteSamplingBatchFilePath(resolveDayPaletteColorAdminRoot(), batchId));
}