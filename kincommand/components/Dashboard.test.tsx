import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { EntryType, FamilySettings, User } from '../types';

const settings: FamilySettings = {
  hourlyRate: 25,
  patientName: '',
  privacyMode: false,
  autoLockEnabled: false,
  hasCompletedOnboarding: true
};

const users: User[] = [
  { id: 'u1', name: 'Sarah Miller', role: 'ADMIN' as any },
  { id: 'u2', name: 'David Miller', role: 'CONTRIBUTOR' as any }
];

describe('Dashboard empty state', () => {
  it('routes to expense entry when Track Expenses is clicked', async () => {
    const onStartEntry = vi.fn();
    render(<Dashboard entries={[]} users={users} settings={settings} onStartEntry={onStartEntry} />);

    await userEvent.click(screen.getByRole('button', { name: /track expenses/i }));
    expect(onStartEntry).toHaveBeenCalledWith(EntryType.EXPENSE);
  });

  it('routes to time entry when Log Care Hours is clicked', async () => {
    const onStartEntry = vi.fn();
    render(<Dashboard entries={[]} users={users} settings={settings} onStartEntry={onStartEntry} />);

    await userEvent.click(screen.getByRole('button', { name: /log care hours/i }));
    expect(onStartEntry).toHaveBeenCalledWith(EntryType.TIME);
  });
});
