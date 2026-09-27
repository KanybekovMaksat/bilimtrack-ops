/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_HEALTH_URL?: string;
  readonly VITE_SUPPORT_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
