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