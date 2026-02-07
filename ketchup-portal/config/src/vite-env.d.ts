/**
 * Vite-style ImportMeta.env types for @smartpay/config build.
 * Consuming Vite apps provide real import.meta.env at runtime.
 */
interface ImportMeta {
  env: {
    MODE?: string;
    [key: string]: string | undefined;
  };
}
