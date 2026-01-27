/**
 * Zod validation schemas for KinCircle data types
 * Used for form validation and data import validation
 */

import { z } from 'zod';
import { EntryType, UserRole, HelpTaskStatus } from '../types';

// Entry validation
export const ledgerEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.nativeEnum(EntryType),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: z.string(),
  amount: z.number().min(0),
  timeDurationMinutes: z.number().int().min(0).optional(),
  category: z.string(),
  receiptUrl: z.string().url().optional(),
  isMedicaidFlagged: z.boolean().optional(),
  aiAnalysis: z.string().optional()
});

// Task validation
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  assignedUserId: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  isCompleted: z.boolean(),
  relatedEntryId: z.string().optional()
});

// Document validation
export const vaultDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Document name is required'),
  date: z.string(),
  type: z.string(),
  size: z.string()
});

// Family settings validation
export const familySettingsSchema = z.object({
  hourlyRate: z.number().min(0).max(1000),
  patientName: z.string(),
  privacyMode: z.boolean(),
  autoLockEnabled: z.boolean(),
  hasCompletedOnboarding: z.boolean(),
  customPinHash: z.string().optional(),
  isSecurePinHash: z.boolean().optional(),
  familyId: z.string().optional(),
  securityProfile: z.enum(['standard', 'compliance']).optional(),
  themeMode: z.enum(['system', 'light', 'dark']).optional()
});

// Backup data validation
export const backupDataSchema = z.object({
  version: z.string().optional(),
  timestamp: z.string().optional(),
  settings: familySettingsSchema,
  entries: z.array(ledgerEntrySchema),
  tasks: z.array(taskSchema).optional(),
  documents: z.array(vaultDocumentSchema).optional()
});

// Entry form validation
export const entryFormSchema = z.object({
  type: z.nativeEnum(EntryType),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  timeDurationMinutes: z.number().int().min(0).optional()
});

// PIN validation
export const pinSchema = z.string()
  .length(4, 'PIN must be exactly 4 digits')
  .regex(/^\d{4}$/, 'PIN must contain only digits');

// Medication validation
export const medicationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  prescribedFor: z.string().optional(),
  pharmacy: z.string().optional(),
  refillDate: z.string().optional(),
  monthlyCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  isActive: z.boolean()
});

// Help task validation
export const helpTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['meals', 'transport', 'errands', 'companionship', 'medical', 'household', 'other']),
  date: z.string(),
  timeSlot: z.string().optional(),
  createdByUserId: z.string().min(1),
  claimedByUserId: z.string().optional(),
  status: z.enum(['available', 'claimed', 'completed', 'missed']),
  estimatedMinutes: z.number().int().min(0).optional(),
  convertedToEntryId: z.string().optional()
});

// Family invite validation
export const familyInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRole)
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  count: z.number().int().min(0),
  windowStart: z.number(),
  maxRequests: z.number().int().min(1),
  windowMs: z.number().int().min(1000)
});

// Validate function that returns typed errors
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Format Zod errors for display
export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
}

export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type BackupDataInput = z.infer<typeof backupDataSchema>;
export type EntryFormInput = z.infer<typeof entryFormSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
export type HelpTaskInput = z.infer<typeof helpTaskSchema>;
export type FamilyInviteInput = z.infer<typeof familyInviteSchema>;
