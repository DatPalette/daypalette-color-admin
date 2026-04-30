const defaultAdminApiBaseUrl = 'http://localhost:3100'

export function resolveAdminApiBaseUrl(): string {
  return import.meta.env.VITE_ADMIN_API_BASE_URL ?? defaultAdminApiBaseUrl
}

export async function buildApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] }

    if (Array.isArray(payload.message)) {
      return payload.message.join(' ')
    }

    if (typeof payload.message === 'string') {
      return payload.message
    }
  } catch {
  }

  return fallbackMessage
}