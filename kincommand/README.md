# KinCommand

**The Operating System for Family Caregiving.**

KinCommand is a modern web application designed to bring transparency, fairness, and organization to families managing the care of an aging loved one. It tracks both financial contributions and "sweat equity" (time spent) to ensure sibling fairness, prepares data for Medicaid look-back periods, and provides instant access to critical documents in emergencies.

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
    The application requires a Google Gemini API Key.
    Ensure `process.env.API_KEY` is available in your environment.

2.  **Installation**:
    ```bash
    npm install
    ```

3.  **Running Locally**:
    ```bash
    npm run dev
    ```

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
*   **Privacy Scrubbing**: The app includes a "Privacy Mode" that regex-scrubs the patient's name before sending data to the LLM.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Run `Agent Lab` diagnostics to ensure AI behaviors remain stable.
4.  Submit a Pull Request.
