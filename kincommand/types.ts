
export enum EntryType {
  EXPENSE = 'EXPENSE',
  TIME = 'TIME'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VIEWER = 'VIEWER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: EntryType;
  date: string; // ISO String
  description: string;
  amount: number; // For Expense: currency value. For Time: calculated value.
  timeDurationMinutes?: number; // Only for TIME type
  category: string;
  receiptUrl?: string;
  isMedicaidFlagged?: boolean; // Flagged by AI as potential "Gift" or non-compliant
  aiAnalysis?: string;
}

export interface Task {
  id: string;
  title: string;
  assignedUserId: string;
  dueDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  relatedEntryId?: string; // If logged to ledger
}

export interface VaultDocument {
  id: string;
  name: string;
  date: string;
  type: string;
  size: string;
}

export interface FamilySettings {
  hourlyRate: number; // Sweat equity rate, e.g., $25/hr
  patientName: string;
  privacyMode: boolean; // If true, anonymize names before sending to AI
  autoLockEnabled: boolean; // Controls whether idle timer is active
  hasCompletedOnboarding: boolean; // Tracks if the user has finished the setup wizard
  customPinHash?: string; // Hash of user's custom PIN (PBKDF2 or legacy)
  isSecurePinHash?: boolean; // True if using PBKDF2, false/undefined for legacy hash
  familyId?: string; // Unique ID for multi-tenant data isolation
  securityProfile?: SecurityProfile; // Quick preset for consumer vs compliance-ready settings
  themeMode?: ThemeMode;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type SecurityProfile = 'standard' | 'compliance';

export interface MedicaidReportItem {
  entryId: string;
  status: 'COMPLIANT' | 'WARNING' | 'REVIEW_NEEDED';
  reason: string;
  categorySuggestion: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'SESSION_TIMEOUT' | 'EMERGENCY_ACCESS' | 'DATA_RESET' | 'SYSTEM_INIT' | 'SETTINGS_CHANGE';
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  user?: string;
}

// ============================================
// Phase 1: Recurring Expenses & Family Features
// ============================================

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface RecurringExpense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string; // ISO date string
  isActive: boolean;
  createdAt: string;
}

export interface FamilyInvite {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'declined';
  invitedByUserId: string;
  invitedAt: string;
  inviteCode: string; // Shareable code for joining
}

// Simplified debt between two family members
export interface DebtSummary {
  fromUserId: string;
  toUserId: string;
  netAmount: number; // Positive = fromUser owes toUser
}

// ============================================
// Phase 2: Help Calendar & Medications
// ============================================

export type HelpTaskCategory = 'meals' | 'transport' | 'errands' | 'companionship' | 'medical' | 'household' | 'other';
export type HelpTaskStatus = 'available' | 'claimed' | 'completed' | 'missed';

export interface HelpTask {
  id: string;
  title: string;
  description?: string;
  category: HelpTaskCategory;
  date: string; // ISO date
  timeSlot?: string; // e.g., "Morning", "2:00 PM"
  createdByUserId: string;
  claimedByUserId?: string;
  status: HelpTaskStatus;
  estimatedMinutes?: number;
  convertedToEntryId?: string; // Links to ledger entry when logged
}

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g., "10mg", "1 tablet"
  frequency: string; // e.g., "twice daily", "as needed"
  prescribedFor?: string; // e.g., "blood pressure"
  pharmacy?: string;
  refillDate?: string;
  monthlyCost?: number;
  notes?: string;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string; // ISO timestamp
  status: 'taken' | 'skipped' | 'late';
  notes?: string;
}
