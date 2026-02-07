/// <reference types="vite/client" />

/**
 * Env type declarations for Ketchup Portal.
 * VITE_* are injected at build time from .env / Vercel env.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_SENTRY?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
