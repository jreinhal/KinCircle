import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { EntryType } from '../types';

vi.mock('../hooks/useEntriesStore', () => ({
  useEntriesStore: () => ({ entries: [] })
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
    users: [{ id: 'u1', name: 'Test User', role: 'ADMIN' }],
    currentUser: { id: 'u1', name: 'Test User', role: 'ADMIN' }
  })
}));

describe('Dashboard empty state', () => {
  it('routes to expense entry when Track Expenses is clicked', async () => {
    const onStartEntry = vi.fn();
    render(<Dashboard onStartEntry={onStartEntry} />);

    await userEvent.click(screen.getByRole('button', { name: /track expenses/i }));
    expect(onStartEntry).toHaveBeenCalledWith(EntryType.EXPENSE);
  });

  it('routes to time entry when Log Care Hours is clicked', async () => {
    const onStartEntry = vi.fn();
    render(<Dashboard onStartEntry={onStartEntry} />);

    await userEvent.click(screen.getByRole('button', { name: /log care hours/i }));
    expect(onStartEntry).toHaveBeenCalledWith(EntryType.TIME);
  });
});
