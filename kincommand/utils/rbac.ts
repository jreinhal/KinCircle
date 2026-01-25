/**
 * Role-Based Access Control (RBAC) utilities
 * Enforces permissions based on user roles
 */

import { User, UserRole } from '../types';

// Define permissions for each action
type Permission =
  | 'entries:create'
  | 'entries:read'
  | 'entries:update'
  | 'entries:delete'
  | 'tasks:create'
  | 'tasks:read'
  | 'tasks:update'
  | 'tasks:delete'
  | 'documents:create'
  | 'documents:read'
  | 'documents:delete'
  | 'settings:read'
  | 'settings:update'
  | 'family:invite'
  | 'family:manage'
  | 'medications:create'
  | 'medications:read'
  | 'medications:update'
  | 'medications:delete'
  | 'help_tasks:create'
  | 'help_tasks:read'
  | 'help_tasks:claim'
  | 'help_tasks:complete'
  | 'security_logs:read'
  | 'data:export'
  | 'data:import'
  | 'data:reset';

// Permission matrix by role
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    'entries:create', 'entries:read', 'entries:update', 'entries:delete',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'documents:create', 'documents:read', 'documents:delete',
    'settings:read', 'settings:update',
    'family:invite', 'family:manage',
    'medications:create', 'medications:read', 'medications:update', 'medications:delete',
    'help_tasks:create', 'help_tasks:read', 'help_tasks:claim', 'help_tasks:complete',
    'security_logs:read',
    'data:export', 'data:import', 'data:reset'
  ],
  [UserRole.CONTRIBUTOR]: [
    'entries:create', 'entries:read', 'entries:update',
    'tasks:create', 'tasks:read', 'tasks:update',
    'documents:create', 'documents:read',
    'settings:read',
    'medications:read', 'medications:update',
    'help_tasks:create', 'help_tasks:read', 'help_tasks:claim', 'help_tasks:complete',
    'data:export'
  ],
  [UserRole.VIEWER]: [
    'entries:read',
    'tasks:read',
    'documents:read',
    'settings:read',
    'medications:read',
    'help_tasks:read'
  ]
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user can perform any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

/**
 * Check if a user can perform all of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(user, p));
}

/**
 * Get all permissions for a user's role
 */
export function getUserPermissions(user: User): Permission[] {
  return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Check if user can modify data (not a viewer)
 */
export function canModify(user: User): boolean {
  return user.role !== UserRole.VIEWER;
}

/**
 * Permission guard - throws error if user lacks permission
 */
export function requirePermission(user: User, permission: Permission, action: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${action} requires ${permission} permission`);
  }
}

export type { Permission };
