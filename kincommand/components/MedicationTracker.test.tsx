import React from 'react';
import { render, screen } from '@testing-library/react';
import MedicationTracker from './MedicationTracker';

vi.mock('../hooks/useMedicationsStore', () => ({
  useMedicationsStore: () => ({
    medications: [],
    medicationLogs: [],
    addMedication: vi.fn(),
    updateMedication: vi.fn(),
    deleteMedication: vi.fn(),
    logMedication: vi.fn()
  })
}));

vi.mock('../hooks/useSettingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      hourlyRate: 25,
      patientName: 'Mom',
      privacyMode: false,
      autoLockEnabled: true,
      hasCompletedOnboarding: true
    }
  })
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    currentUser: { id: 'u1', name: 'Test User', role: 'ADMIN' }
  })
}));

vi.mock('../utils/rbac', () => ({
  hasPermission: () => true
}));

describe('MedicationTracker', () => {
  it('renders empty state when no medications', () => {
    render(<MedicationTracker />);
    expect(screen.getByText(/Track Medications/i)).toBeVisible();
  });
});
