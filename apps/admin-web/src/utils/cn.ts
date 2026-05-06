type ClassDictionary = Record<string, boolean | null | string | undefined>
type ClassInput = ClassDictionary | ClassInput[] | false | null | string | undefined

function flattenClassInput(input: ClassInput, output: string[]): void {
  if (!input) {
    return
  }

  if (typeof input === 'string') {
    output.push(input)
    return
  }

  if (Array.isArray(input)) {
    input.forEach((item) => flattenClassInput(item, output))
    return
  }

  Object.entries(input).forEach(([className, isEnabled]) => {
    if (isEnabled) {
      output.push(className)
    }
  })
}

export function cn(...inputs: ClassInput[]): string {
  const tokens: string[] = []

  inputs.forEach((input) => flattenClassInput(input, tokens))

  return tokens.join(' ')
}