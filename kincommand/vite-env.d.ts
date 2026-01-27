/// \u003creference types="vite/client" />

interface ImportMetaEnv {
    readonly BASE_URL: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_STORAGE_PROVIDER?: string;
    readonly VITE_SUPABASE_AUTH_MODE?: string;
    readonly VITE_GEMINI_MOCK?: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_OCR_ENABLED?: string;
    readonly VITE_OCR_SERVICE_URL?: string;
    readonly VITE_ENABLE_LOGGING?: string;
    readonly VITE_LOG_LEVEL?: string;
    readonly VITE_KIN_API_TOKEN?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
