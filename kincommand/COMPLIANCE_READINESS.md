# Compliance Readiness Checklist (HIPAA-Oriented)

This checklist is for future enterprise/healthcare use. It is not required for consumer-only family use.

## 1) Governance and Legal
- Define whether you are a Business Associate (BA) or Covered Entity (CE).
- Sign Business Associate Agreements (BAA) with all vendors that handle PHI.
- Document data retention and deletion policies.
- Establish breach notification procedures for all applicable states.

## 2) Data Handling and Storage
- Encrypt PHI at rest and in transit (TLS 1.2+).
- Use per-tenant (family) access control on the server.
- Implement audit logging for all data access (read/write/delete).
- Maintain immutable logs and retention policies.

## 3) Access Controls
- Strong authentication (passwords or SSO).
- Role-based access control enforced server-side.
- Session expiration and idle timeouts.
- Optional MFA for admins.

## 4) Third-Party Services
- Ensure AI/LLM providers are covered by a BAA or remove PHI entirely.
- Document what data is sent to external services.
- Allow customers to disable external processing.

## 5) Security Program
- Regular vulnerability scanning and patching.
- Penetration tests and security reviews.
- Incident response plan and tabletop drills.
- Secure SDLC: threat modeling, code reviews, CI scanning.

## 6) Documentation
- Publish a clear privacy policy and data processing terms.
- Document compliance boundaries (what is and is not supported).
- Provide admin-facing security controls and audit exports.

## 7) Product Changes to Consider
- Server-side auth for all API endpoints.
- Per-tenant storage in Supabase with RLS enforced.
- IP allowlists for enterprise accounts.
- Dedicated audit log UI and export.

---

If you move toward healthcare orgs, use this as a starting point and schedule a formal compliance assessment.
