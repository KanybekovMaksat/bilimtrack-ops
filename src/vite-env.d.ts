/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_HEALTH_URL?: string;
  /** Public blog, for «На сайте» links from the article editor. */
  readonly VITE_BLOG_URL?: string;
  /** Public origin of the panel for og:url / og:image (read in index.html). */
  readonly VITE_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
