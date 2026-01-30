import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission, hasAllPermissions, getUserPermissions, isAdmin, canModify, requirePermission } from './rbac';
import { UserRole } from '../types';

const adminUser = { id: 'u1', name: 'Admin', role: UserRole.ADMIN };
const contributorUser = { id: 'u2', name: 'Contributor', role: UserRole.CONTRIBUTOR };
const viewerUser = { id: 'u3', name: 'Viewer', role: UserRole.VIEWER };

describe('rbac utilities', () => {
  it('grants admin full access to create/update/delete entries', () => {
    expect(hasPermission(adminUser, 'entries:create')).toBe(true);
    expect(hasPermission(adminUser, 'entries:update')).toBe(true);
    expect(hasPermission(adminUser, 'entries:delete')).toBe(true);
  });

  it('restricts viewer to read-only permissions', () => {
    expect(hasPermission(viewerUser, 'entries:read')).toBe(true);
    expect(hasPermission(viewerUser, 'entries:create')).toBe(false);
    expect(hasPermission(viewerUser, 'settings:update')).toBe(false);
  });

  it('supports any/all permission checks', () => {
    expect(hasAnyPermission(contributorUser, ['entries:update', 'entries:delete'])).toBe(true);
    expect(hasAllPermissions(contributorUser, ['entries:update', 'entries:delete'])).toBe(false);
  });

  it('returns role permission list and helpers', () => {
    expect(getUserPermissions(adminUser)).toContain('data:reset');
    expect(isAdmin(adminUser)).toBe(true);
    expect(canModify(viewerUser)).toBe(false);
  });

  it('throws when required permission is missing', () => {
    expect(() => requirePermission(viewerUser, 'entries:delete', 'delete entries')).toThrow(/Permission denied/);
  });
});
