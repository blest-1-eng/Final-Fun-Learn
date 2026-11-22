const DEFAULT_NYRA_BACKEND_URL = 'https://backend-render-5u80.onrender.com';

export const NYRA_BACKEND_BASE_URL = (
  import.meta.env.VITE_NYRA_BACKEND_URL || DEFAULT_NYRA_BACKEND_URL
).replace(/\/+$/, '');

export const NYRA_ENDPOINTS = {
  HEALTH: '/health',
  CHAT: import.meta.env.VITE_NYRA_CHAT_ENDPOINT || '/v1/nyra/chat',
  GENERATE:
    import.meta.env.VITE_NYRA_GENERATE_ENDPOINT || '/v1/nyra/generate',
  LEVEL:
    import.meta.env.VITE_NYRA_LEVEL_ENDPOINT ||
    import.meta.env.VITE_NYRA_GENERATE_ENDPOINT ||
    '/v1/nyra/generate',
  TEST:
    import.meta.env.VITE_NYRA_TEST_ENDPOINT ||
    import.meta.env.VITE_NYRA_GENERATE_ENDPOINT ||
    '/v1/nyra/generate',
  QUOTA: import.meta.env.VITE_NYRA_QUOTA_ENDPOINT || '/v1/nyra/quota',
} as const;

export const NYRA_TIMEOUTS_MS = {
  HEALTH: 8000,
  QUOTA: 6000,
  AI: 22000,
} as const;

export function buildNyraEndpointUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${NYRA_BACKEND_BASE_URL}${cleanPath}`;
}
