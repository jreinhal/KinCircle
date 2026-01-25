# KinCircle

[![CI](https://github.com/jreinhal/KinCommand/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/jreinhal/KinCommand/actions/workflows/ci.yml)

**Your Family's Circle of Care.**

KinCircle is a modern web application designed to bring transparency, fairness, and organization to families managing the care of an aging loved one. It tracks both financial contributions and "care hours" (time spent) to ensure sibling fairness, prepares data for Medicaid look-back periods, and provides instant access to critical documents in emergencies.

## 🚀 Key Features

*   **Sibling Ledger**: Tracks expenses and time. Time is converted to monetary value based on a configurable hourly rate ("Sweat Equity").
*   **Kin AI Assistant**: A chat interface powered by **Google Gemini**. It has access to the ledger data and uses **Google Search Grounding** to answer external questions (e.g., "Find pharmacies near me").
*   **Medicaid Look-Back Auditor**: AI agents analyze historical ledger entries to flag potential "Gift" transactions that could jeopardize Medicaid eligibility.
*   **Digital Vault**: Secure storage simulation for legal/medical docs with a high-contrast **Emergency Responder Mode**.
*   **Care Schedule**: Task management that converts completed tasks directly into ledger entries.
*   **Agent Lab**: A developer diagnostic tool that runs automated AI agents to test data integrity, privacy compliance (PII scrubbing), and generate synthetic stress-test scenarios.

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
    VITE_GEMINI_API_KEY=your_api_key_here

    # Optional: LightOnOCR for offline/fallback receipt scanning
    VITE_OCR_ENABLED=false
    VITE_OCR_SERVICE_URL=http://localhost:8090
    ```
    Get a free API key from [Google AI Studio](https://ai.google.dev/)

2.  **Installation**:
    ```bash
    npm install
    ```

3.  **Running Locally**:
    ```bash
    npm run dev
    ```

4.  **Optional: LightOnOCR Service** (for offline receipt scanning):
    ```bash
    cd D:/Projects/lightonocr-service
    pip install -r requirements.txt
    python ocr_service.py
    ```
    When enabled, LightOnOCR serves as a fallback when Gemini is rate-limited or unavailable.

## 🔐 Security Features

*   **Custom PIN Lock**: Set your own 4-digit PIN in Settings (default: `1234`). PIN is hashed before storage.
*   **Auto-Lock**: Configurable 60-second idle timeout. Can be disabled in Settings for development.
*   **Security Audit Logs**: Immutable trail of auth attempts, settings changes, and data imports.
*   **Privacy Mode**: Regex-based PII scrubbing removes patient names, emails, phone numbers, and SSNs before sending data to AI.
*   **Input Validation**: Form validation prevents invalid amounts, empty descriptions, and data corruption.
*   **API Key Protection**: `.env.local` is gitignored to prevent accidental key exposure.

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
*   **Privacy Scrubbing**: The app includes a "Privacy Mode" that regex-scrubs the patient's name before sending data to the LLM.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Run `Agent Lab` diagnostics to ensure AI behaviors remain stable.
4.  Submit a Pull Request.
