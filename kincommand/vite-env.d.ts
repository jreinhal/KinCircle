/// \u003creference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_STORAGE_PROVIDER?: string;
    readonly VITE_SUPABASE_AUTH_MODE?: string;
    readonly VITE_GEMINI_MOCK?: string;
    readonly VITE_OCR_ENABLED?: string;
    readonly VITE_OCR_SERVICE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
