function normalizeComparableLabel(value: string): string {
  return value.replace(/[\s_-]+/g, '').toLowerCase()
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