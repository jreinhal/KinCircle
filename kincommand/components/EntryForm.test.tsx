import React from 'react';
import { render, screen } from '@testing-library/react';
import EntryForm from './EntryForm';
import { EntryType } from '../types';

vi.mock('../hooks/useEntriesStore', () => ({
  useEntriesStore: () => ({ addEntry: vi.fn() })
}));

vi.mock('../hooks/useSettingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      hourlyRate: 25,
      patientName: '',
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

describe('EntryForm', () => {
  it('honors initialType for TIME entries', () => {
    render(
      <EntryForm
        initialType={EntryType.TIME}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Duration (Hours)')).toBeVisible();
  });
});
