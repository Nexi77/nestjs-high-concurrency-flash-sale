const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export function getPublicEnv() {
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  };
}
