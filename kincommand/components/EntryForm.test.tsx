import { render, screen } from '@testing-library/react';
import EntryForm from './EntryForm';
import { EntryType, FamilySettings, User } from '../types';

const settings: FamilySettings = {
  hourlyRate: 25,
  patientName: '',
  privacyMode: false,
  autoLockEnabled: false,
  hasCompletedOnboarding: true
};

const user: User = { id: 'u1', name: 'Sarah Miller', role: 'ADMIN' as any };

describe('EntryForm', () => {
  it('honors initialType for TIME entries', () => {
    render(
      <EntryForm
        currentUser={user}
        settings={settings}
        initialType={EntryType.TIME}
        onAddEntry={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Duration (Hours)')).toBeVisible();
  });
});
