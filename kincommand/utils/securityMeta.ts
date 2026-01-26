export interface SecurityMeta {
  pinHash?: string;
  isSecurePinHash?: boolean;
  encryptionEnabled?: boolean;
  saltHex?: string;
  version?: number;
}

const META_KEY = 'kin_security_meta';
const FAMILY_ID_KEY = 'kin_family_id';

const resolveMetaKey = (): string => {
  try {
    const familyId = localStorage.getItem(FAMILY_ID_KEY);
    return familyId ? `${META_KEY}:${familyId}` : META_KEY;
  } catch {
    return META_KEY;
  }
};

export const getSecurityMeta = (): SecurityMeta => {
  try {
    const raw = localStorage.getItem(resolveMetaKey());
    return raw ? (JSON.parse(raw) as SecurityMeta) : {};
  } catch {
    return {};
  }
};

export const setSecurityMeta = (meta: SecurityMeta): void => {
  try {
    localStorage.setItem(resolveMetaKey(), JSON.stringify(meta));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-meta-updated'));
    }
  } catch {
    // Ignore storage errors
  }
};

export const updateSecurityMeta = (updates: Partial<SecurityMeta>): SecurityMeta => {
  const current = getSecurityMeta();
  const next = { ...current, ...updates };
  setSecurityMeta(next);
  return next;
};
