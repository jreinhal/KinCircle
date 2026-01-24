# KinCommand Development Roadmap

This document outlines the strategy for moving KinCommand from a local prototype to a scalable, production-ready application.

## Phase 1: Initial Test Development (✅ COMPLETED)
**Goal:** Prototype validation, investor/family demos, local testing.
**Backend:** None (Local Browser Storage).

*   **Data Storage:** `localStorage` (saved in the specific browser instance).
*   **Syncing:** ✅ Manual "Sneaker-net" using the **Export/Import** feature in Settings.
*   **Security:** ✅ Basic PIN Lock & Privacy Masking implemented.
*   **Pros:** Free, instant setup, zero latency.
*   **Cons:** Data is lost if browser cache is cleared; no real-time collaboration.
*   **Cost:** **$0**

---

## Phase 2: The "Beta" (Connecting a Backend)
**Goal:** Real-time family collaboration (e.g., you add an expense, it appears on your brother's phone instantly).
**Backend Recommendation:** **Supabase**.

### Why Supabase?
It offers a spreadsheet-like interface for the database, making it easier to manage than raw SQL or NoSQL options.

### Implementation Steps:
1.  **Create Account:** Sign up at [Supabase.com](https://supabase.com).
2.  **Database Setup:** Create a project and add a table named `ledger_entries`.
3.  **Code Integration:**
    *   Install SDK: `npm install @supabase/supabase-js`
    *   Replace `localStorage.setItem` calls in `App.tsx` with `supabase.from('ledger_entries').insert(...)`.
    *   Replace `useState` initialization with `supabase.from('ledger_entries').select('*')`.

**Cost:** **$0** (Free Tier covers up to 500MB database & 50k monthly active users).

---

## Phase 3: Production Deployment
**Goal:** Public launch to thousands of families.
**Infrastructure:** Vercel (Hosting) + Scaled Supabase (Database).

### 1. Hosting
*   **Service:** Vercel or Netlify.
*   **Setup:** Connect GitHub repo to Vercel. Auto-deploys on push.

### 2. HIPAA Compliance (Critical for Medical Data)
*   **Requirement:** If storing sensitive health data (e.g., "Driving Mom to Oncologist") for paid customers, you need a BAA (Business Associate Agreement).
*   **Solution:** Upgrade to Supabase Enterprise or use AWS/GCP with strict access controls.
*   **Privacy Mode:** Ensure the "Privacy Mode" in the app (regex scrubbing) is enabled by default to minimize PII leakage to AI services.

---

## Estimated Costs

| Item | Phase 1 (Prototype) | Phase 2 (Beta) | Phase 3 (10k Users) |
| :--- | :--- | :--- | :--- |
| **Hosting** (Vercel) | $0 | $0 | ~$20/month |
| **Database** (Supabase) | $0 | $0 | ~$25/month + usage |
| **AI** (Google Gemini) | $0 (Free Tier) | $0 (Free Tier) | **Variable** (See below) |
| **Total** | **$0** | **$0** | **~$45/mo + AI Usage** |

### AI Cost Estimation (Gemini API)
*   **Pricing Model:** Pay-per-token (roughly per word/image).
*   **Example Usage:**
    *   Receipt Scan: ~$0.002
    *   Chat Query: ~$0.001
*   **Projection:** A heavy user might cost $0.50 - $1.00 per month.
*   **Business Model:** Charge a subscription (e.g., $9.99/mo) to cover these API costs with healthy margin.
