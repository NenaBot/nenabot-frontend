/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_USE_MOCK_DATA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv &
    Readonly<{
      DEV: boolean;
      PROD: boolean;
      MODE: string;
    }>;
}

declare const __APP_ENV__:
  | (ImportMetaEnv &
      Readonly<{
        DEV?: boolean;
        PROD?: boolean;
        MODE?: string;
      }>)
  | undefined;
