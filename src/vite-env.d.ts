/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // add other env vars if needed
  readonly [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
