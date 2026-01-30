# KinCircle

[![CI](https://github.com/jreinhal/KinCommand/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/jreinhal/KinCommand/actions/workflows/ci.yml)

**Your Family's Circle of Care.**

KinCircle is a modern web application designed to bring transparency, fairness, and organization to families managing the care of an aging loved one. It tracks both financial contributions and "care hours" (time spent) to ensure fair recognition across caregivers, prepares data for Medicaid look-back periods, and provides instant access to critical documents in emergencies.

## 🚀 Key Features

*   **Care Ledger**: Tracks expenses and time. Time is converted to monetary value based on a configurable hourly rate ("Sweat Equity").
*   **Kin AI Assistant**: A chat interface powered by **Google Gemini**. It has access to the ledger data and uses **Google Search Grounding** to answer external questions (e.g., "Find pharmacies near me").
*   **Medicaid Look-Back Auditor**: AI agents analyze historical ledger entries to flag potential "Gift" transactions that could jeopardize Medicaid eligibility.
*   **Document Vault**: Secure storage simulation for legal/medical docs with a high-contrast **Emergency Responder Mode**.
*   **Care Tasks**: Task management that converts completed tasks directly into ledger entries.
*   **Agent Lab**: A developer diagnostic tool that runs automated AI agents to test data integrity, privacy compliance (PII scrubbing), and generate synthetic stress-test scenarios.
*   **Theme Modes**: Light, Dark, or System appearance settings per device.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
    *   Models: `gemini-3-flash-preview` (Logic/Search/Vision), `gemini-2.5-flash-native-audio-preview-12-2025` (Voice).
*   **Visualization**: Recharts
*   **Icons**: Lucide React

## ⚙️ Setup & Configuration

1.  **Environment Variables**:
    Create a `.env.local` file in the `kincommand` directory:
    ```bash
    # Server-side Gemini key (used by the local API proxy)
    GEMINI_API_KEY=your_api_key_here

    # Optional: Base URL for the local API proxy
    VITE_API_BASE_URL=http://localhost:8787

    # Optional: Shared token to protect the local API (server + client)
    KIN_API_TOKEN=your_shared_api_token_here
    VITE_KIN_API_TOKEN=your_shared_api_token_here

    # Optional: LightOnOCR for offline/fallback receipt scanning
    VITE_OCR_ENABLED=false
    VITE_OCR_SERVICE_URL=http://localhost:8090

    # Optional: Server hardening
    KIN_API_HOST=127.0.0.1
    KIN_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    KIN_RATE_LIMIT_MAX=60
    KIN_AI_RATE_LIMIT_MAX=20
    KIN_PRIVACY_REQUIRED=false
    ```
    Get a free API key from [Google AI Studio](https://ai.google.dev/)

2.  **Installation**:
    ```bash
    npm install
    ```

3.  **Running Locally**:
    ```bash
    npm run dev
    npm run dev:api
    ```

    If you point the API/OCR services at a different host, update the `connect-src` allowlist in `kincommand/index.html`.
    The API server binds to `127.0.0.1` by default; set `KIN_API_HOST=0.0.0.0` if you need LAN access.

4.  **Optional: LightOnOCR Service** (for offline receipt scanning):
    ```bash
    cd D:/Projects/lightonocr-service
    pip install -r requirements.txt
    python ocr_service.py
    ```
    When enabled, LightOnOCR serves as a fallback when Gemini is rate-limited or unavailable.

5.  **Quality & Analysis**:
    ```bash
    npm run lint
    npm run analyze
    ```

## ✅ Testing

**Local commands:**
```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# Typecheck
npm run typecheck

# E2E tests (mocked)
npm run test:e2e

# E2E tests (CI, excludes @flaky)
npm run test:e2e:ci

# Unit + E2E (mocked)
npm run test:ops

# E2E with Supabase
npm run test:e2e:supabase

# E2E with real Gemini (requires GEMINI_API_KEY + E2E_GEMINI_REAL=true)
npm run test:e2e:real
```

**Test plan (exhaustive):**
`D:\Projects\Project Documentation\KinCircle\Testing\RAG_DEV_TEST_PLAN.md`

**GitHub Actions:**
- `ci.yml` runs unit + E2E tests on push/PR.
- `real-backend.yml` runs scheduled real-backend E2E tests (Supabase + Gemini).
- `nightly-regression.yml` runs a nightly regression matrix (desktop + mobile).

**Flaky test policy:**
- Tag unstable Playwright tests with `@flaky` in the test title.
- CI excludes `@flaky` tests; run locally to validate when working on a fix.

## 🔐 Security Features

*   **Custom PIN Lock**: Set your own 4-digit PIN in Settings. PINs are hashed before storage.
*   **Auto-Lock**: Enabled by default with a 5-minute idle timeout. Can be disabled in Settings for development.
*   **Security Audit Logs**: Append-only event log in-app (local storage can still be reset).
*   **Privacy Mode**: Regex-based PII scrubbing removes patient and user names, emails, phone numbers, and SSNs before sending data to AI.
*   **Local Encryption**: When a PIN is set, local storage is encrypted at rest.
*   **Input Validation**: Form validation prevents invalid amounts, empty descriptions, and data corruption.
*   **API Key Protection**: `.env.local` is gitignored to prevent accidental key exposure. If a secret is ever committed, rotate it immediately and purge git history.
*   **Optional API Token**: The local API can be locked behind `KIN_API_TOKEN` (use `VITE_KIN_API_TOKEN` on the client).

## ⚠️ Compliance & Data Sharing

**Not HIPAA compliant.** KinCircle is a prototype and is not approved for production storage of PHI without a full compliance review.

**AI data sharing:** When AI features are enabled, sanitized data is sent to Google Gemini (and optionally LightOnOCR). Use Privacy Mode and obtain user consent before sharing sensitive data.

**No medical/legal advice:** AI outputs are informational only and should not replace professional advice.

For future enterprise work, see `COMPLIANCE_READINESS.md`.

## 📂 Project Structure

*   `services/geminiService.ts`: Core AI logic. Handles interaction with Gemini API, including Search Grounding tool configuration, image parsing, and voice-to-text transaction parsing.
*   `services/agentService.ts`: Autonomous agents for the "Agent Lab" (Integrity, Scenario, UX, Privacy agents).
*   `components/`:
    *   `Dashboard`: Visual analytics of family contributions.
    *   `ChatAssistant`: RAG-like interface combining Ledger data + Web Search.
    *   `Vault`: Document management with "Emergency Mode" overlay.
    *   `EntryForm`: Multimodal input (Text, Voice, Image/Receipts).
    *   `MedicaidReport`: Compliance analysis view.

## 🧠 AI Capabilities Detail

*   **Search Grounding**: The Chat Assistant uses the `googleSearch` tool to provide up-to-date real-world information alongside internal data.
*   **Multimodal Input**:
    *   *Voice*: Uses `gemini-2.5-flash-native-audio-preview` to parse raw audio into structured JSON transactions (Expense vs Time).
    *   *Vision*: Uses `gemini-3-flash-preview` to extract date, merchant, and total from receipt images.
*   **LightOnOCR Fallback**: When Gemini is rate-limited or unavailable, receipt scanning falls back to the local LightOnOCR-2-1B model. This 1B parameter vision-language model runs entirely offline, extracting structured data (amount, date, merchant, category) from receipt images.
*   **Privacy Scrubbing**: The app includes a "Privacy Mode" that regex-scrubs patient and user names before sending data to the LLM.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Run `Agent Lab` diagnostics to ensure AI behaviors remain stable.
4.  Submit a Pull Request.
