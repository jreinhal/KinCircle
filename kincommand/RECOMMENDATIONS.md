# AUDIT RECOMMENDATIONS REPORT

**Date:** 2026-01-26
**Project:** KinCircle (KinCommand/kincommand)
**Agents Used:** Security, Architecture, Testing, Infrastructure, Compliance
**Overall Status:** CRITICAL ISSUES

---

## Executive Summary

KinCircle has strong UX foundations and several security-oriented utilities (rate limiting, Zod validation, error boundaries), but the current Supabase configuration enables unrestricted access and the AI workflows leak PII even when Privacy Mode is enabled. Several architectural gaps (Supabase schema/mapping for Phase 2 features) and compliance mismatches (immutable logs, encryption claims) remain. Address the critical data isolation issue before any cloud deployment.

**Critical Issues:** 1
**High Priority:** 5
**Medium Priority:** 10
**Low Priority:** 2

---

## 1. Security Findings

### Critical
- [ ] **Supabase RLS permits anonymous full access and no tenant scoping** - `kincommand/supabase_schema.sql:87`, `kincommand/services/storageService.ts:332`
  - **Risk:** Any client with the anon key can read/write all families' data. No family/user isolation.
  - **Fix:** Add `family_id` (or user ownership) to all tables, enforce authenticated users only, and create RLS policies that require `family_id` membership; filter queries by `family_id` in the client.

### High
- [ ] **Gemini API key exposed in client bundle** - `kincommand/services/geminiService.ts:9`
  - **Risk:** Key theft and quota abuse; prompts can be replayed outside the app.
  - **Fix:** Move Gemini calls to a backend proxy with auth and per-user quotas; rotate the existing key.

- [ ] **Privacy Mode does not scrub patient/user names in AI prompts** - `kincommand/services/geminiService.ts:312`, `kincommand/services/geminiService.ts:325`, `kincommand/services/agentService.ts:100`
  - **Risk:** PII is still sent to Gemini even when Privacy Mode is enabled.
  - **Fix:** Redact `patientName` and `userName` fields before prompt construction when Privacy Mode is on.

- [ ] **RBAC not enforced for destructive actions** - `kincommand/hooks/useKinStore.ts:176`, `kincommand/components/Ledger.tsx:156`
  - **Risk:** VIEWER/CONTRIBUTOR roles can delete or modify data through UI actions.
  - **Fix:** Centralize permission guards in the store layer (e.g., `requirePermission`) and hide/disable destructive UI affordances for non-admins.

- [ ] **Sensitive data stored unencrypted in localStorage** - `kincommand/services/storageService.ts:118`
  - **Risk:** Ledger entries, medications, and settings can be read by any script with browser access.
  - **Fix:** Encrypt at rest (AES-GCM with a user-derived key) or move storage to a backend with proper access controls.

### Medium
- [ ] **Lock screen default PIN and no lockout/backoff** - `kincommand/components/LockScreen.tsx:22`, `kincommand/components/LockScreen.tsx:99`
  - **Risk:** Brute-force unlock is trivial (4-digit PIN, default exposed in UI).
  - **Fix:** Force PIN setup on first run and add exponential backoff or temporary lockouts after failed attempts.

- [ ] **Backup import accepts unvalidated JSON** - `kincommand/components/Settings.tsx:103`
  - **Risk:** Corrupted or malicious data can poison local state.
  - **Fix:** Validate with `backupDataSchema` before import and reject/normalize invalid payloads.

- [ ] **AgentLab uses Gemini without rate limits or privacy gating** - `kincommand/services/agentService.ts:56`
  - **Risk:** Unbounded API usage and potential PII leakage via AI prompts.
  - **Fix:** Reuse rate limiters and honor Privacy Mode for all AgentLab prompts.

---

## 2. Architecture Findings

### Recommendations
1. **Supabase support incomplete for Phase 2 data types** - `kincommand/services/storageService.ts:272`, `kincommand/supabase_schema.sql:9`
   - Current: Schema defines only ledger/tasks/vault/settings/logs; `mapToRow/mapFromRow` handles only those types.
   - Suggested: Add tables for `recurring_expenses`, `family_invites`, `help_tasks`, `medications`, `medication_logs` and implement full mapping in `storageService`.
   - Files: `kincommand/supabase_schema.sql:9`, `kincommand/services/storageService.ts:272`

2. **useKinStore is a god-hook with broad responsibilities** - `kincommand/hooks/useKinStore.ts:1`
   - Current: Single hook owns all domains and side effects.
   - Suggested: Split by domain (entries, tasks, meds, invites) and expose via context to reduce prop drilling.
   - Files: `kincommand/hooks/useKinStore.ts:1`, `kincommand/App.tsx:33`

---

## 3. Testing Findings

### Coverage Gaps
- [ ] **Critical UI flows lack tests** - `kincommand/components/Settings.tsx:1`, `kincommand/components/Vault.tsx:1`, `kincommand/components/ChatAssistant.tsx:1`, `kincommand/components/MedicationTracker.tsx:1`, `kincommand/components/Schedule.tsx:1`
  - Missing: RBAC enforcement tests, privacy mode redaction tests, emergency access/PIN flows, and Supabase data isolation tests.

---

## 4. Infrastructure Findings

### Security Hardening
- [ ] **CSP allows unsafe-inline/unsafe-eval and CDN import maps** - `kincommand/index.html:16`, `kincommand/index.html:18`
  - **Risk:** Increased XSS/supply-chain exposure.
  - **Fix:** Bundle assets locally, drop CDN scripts, and enforce strict CSP with nonces/hashes.

### Configuration Issues
- [ ] **CSP connect-src blocks OCR service** - `kincommand/index.html:22`, `kincommand/services/ocrService.ts:14`
  - **Risk:** LightOnOCR fails when enabled.
  - **Fix:** Add `VITE_OCR_SERVICE_URL` domain to `connect-src` (or make CSP environment-specific).

- [ ] **Service worker cache version is static** - `kincommand/public/sw.js:1`
  - **Risk:** Users may receive stale assets after deploys.
  - **Fix:** Inject a build hash into the cache name and clean up on activate.

---

## 5. Compliance Findings

### Documentation Gaps
- [ ] **"Security Audit Logs: Immutable" claim not accurate** - `kincommand/README.md:62`, `kincommand/components/Settings.tsx:63`
  - Local storage logs can be cleared/reset; no append-only storage.

- [ ] **Vault UI claims encryption without implementation** - `kincommand/components/Vault.tsx:102`, `kincommand/services/storageService.ts:118`
  - Clarify this is a simulation or implement encryption before claiming it.

- [ ] **Privacy Mode docs do not match actual AI prompts** - `kincommand/README.md:63`, `kincommand/services/geminiService.ts:325`
  - Update docs or fully redact patient/user names when Privacy Mode is enabled.

### Compliance Issues
- [ ] **HIPAA language appears in UI but app is not HIPAA compliant** - `kincommand/components/LockScreen.tsx:83`, `kincommand/components/Settings.tsx:78`
  - Avoid implying compliance unless requirements are met.

---

## Summary Posture

| Category | Status | Notes |
|----------|--------|-------|
| Security | FAIL | Critical data isolation and PII leakage issues present |
| Architecture | WARN | Supabase schema/mapping incomplete for Phase 2 features |
| Testing | WARN | Coverage gaps for critical flows and RBAC/privacy |
| Infrastructure | WARN | CSP too permissive and OCR blocked by CSP |
| Compliance | WARN | Documentation and UI claims out of sync with implementation |

**Overall Assessment:** The app is suitable for local prototyping, but cloud deployment is unsafe until tenant isolation, PII redaction, and backend proxying for AI are implemented.

---

## Next Steps

1. [ ] Fix Supabase RLS + tenant isolation before enabling cloud sync
2. [ ] Move Gemini calls to a backend proxy and enforce privacy scrubbing end-to-end
3. [ ] Enforce RBAC in store/actions and add regression tests for destructive actions
4. [ ] Tighten CSP and remove CDN dependencies for production builds
5. [ ] Align documentation and UI claims with actual security behavior
