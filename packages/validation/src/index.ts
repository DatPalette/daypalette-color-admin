export interface ValidationIssue {
  code: string
  message: string
  resource: string
  resourceId?: string
  fieldPath?: string
}

export function buildValidationIssue(issue: ValidationIssue): ValidationIssue {
  return issue
}

import type {
  PaletteOperationalMetadata,
  PaletteReferenceSource,
  PaletteReviewStatus,
} from '@daypalette-color-admin/contracts'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function validateReferenceSource(source: PaletteReferenceSource, index: number): ValidationIssue[] {
  const resourceId = source.sourceId || `referenceSources[${index}]`
  const issues: ValidationIssue[] = []

  if (!isNonEmptyString(source.sourceId)) {
    issues.push(
      buildValidationIssue({
        code: 'palette.reference-source-id.required',
        fieldPath: `referenceSources[${index}].sourceId`,
        message: 'Palette referenceSources item requires sourceId.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  if (!isNonEmptyString(source.platform)) {
    issues.push(
      buildValidationIssue({
        code: 'palette.reference-source-platform.required',
        fieldPath: `referenceSources[${index}].platform`,
        message: 'Palette referenceSources item requires platform.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  if (!isNonEmptyString(source.brandName)) {
    issues.push(
      buildValidationIssue({
        code: 'palette.reference-source-brand.required',
        fieldPath: `referenceSources[${index}].brandName`,
        message: 'Palette referenceSources item requires brandName.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  if (!isNonEmptyString(source.sourceUrl)) {
    issues.push(
      buildValidationIssue({
        code: 'palette.reference-source-url.required',
        fieldPath: `referenceSources[${index}].sourceUrl`,
        message: 'Palette referenceSources item requires sourceUrl.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  if (!isStringArray(source.colorSummary) || source.colorSummary.length === 0) {
    issues.push(
      buildValidationIssue({
        code: 'palette.reference-source-colors.invalid',
        fieldPath: `referenceSources[${index}].colorSummary`,
        message: 'Palette referenceSources item requires at least one color summary.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  return issues
}

export function validatePaletteOperationalMetadata(
  metadata: PaletteOperationalMetadata & { id?: string; status?: string },
): ValidationIssue[] {
  const resourceId = metadata.id
  const issues: ValidationIssue[] = []
  const referenceSources = metadata.referenceSources ?? []
  const approvedReviewStatuses = new Set<PaletteReviewStatus>(['approved'])
  const isPublishableStatus = metadata.status === 'approved' || metadata.status === 'published'

  referenceSources.forEach((source, index) => {
    issues.push(...validateReferenceSource(source, index))
  })

  if (isPublishableStatus && metadata.reviewStatus && !approvedReviewStatuses.has(metadata.reviewStatus as PaletteReviewStatus)) {
    issues.push(
      buildValidationIssue({
        code: 'palette.review-status.invalid-for-publishable-status',
        fieldPath: 'reviewStatus',
        message: 'Palette with approved or published status must have reviewStatus=approved.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  if (metadata.referenceMethod === 'market-sampled' && isPublishableStatus) {
    if (referenceSources.length < 3) {
      issues.push(
        buildValidationIssue({
          code: 'palette.reference-sources.insufficient-count',
          fieldPath: 'referenceSources',
          message: 'Market-sampled palette must include at least 3 reference sources before approval or publish.',
          resource: 'palette',
          resourceId,
        }),
      )
    }

    const distinctPlatforms = new Set(referenceSources.map((item) => item.platform.trim()).filter(Boolean))
    const distinctBrands = new Set(referenceSources.map((item) => item.brandName.trim()).filter(Boolean))

    if (referenceSources.length > 0 && distinctPlatforms.size < 2) {
      issues.push(
        buildValidationIssue({
          code: 'palette.reference-sources.insufficient-platform-diversity',
          fieldPath: 'referenceSources',
          message: 'Market-sampled palette should include references from at least 2 distinct platforms.',
          resource: 'palette',
          resourceId,
        }),
      )
    }

    if (referenceSources.length > 0 && distinctBrands.size < 2) {
      issues.push(
        buildValidationIssue({
          code: 'palette.reference-sources.insufficient-brand-diversity',
          fieldPath: 'referenceSources',
          message: 'Market-sampled palette should include references from at least 2 distinct brands.',
          resource: 'palette',
          resourceId,
        }),
      )
    }
  }

  if (metadata.status === 'archived' && !isNonEmptyString(metadata.archivedAt)) {
    issues.push(
      buildValidationIssue({
        code: 'palette.archive-metadata.required',
        fieldPath: 'archivedAt',
        message: 'Archived palette requires archivedAt.',
        resource: 'palette',
        resourceId,
      }),
    )
  }

  return issues
}