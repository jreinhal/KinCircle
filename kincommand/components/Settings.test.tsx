import { render, screen } from '@testing-library/react';
import Settings from './Settings';

vi.mock('../hooks/useEntriesStore', () => ({
  useEntriesStore: () => ({ entries: [] })
}));

vi.mock('../hooks/useTasksStore', () => ({
  useTasksStore: () => ({ tasks: [] })
}));

vi.mock('../hooks/useDocumentsStore', () => ({
  useDocumentsStore: () => ({ documents: [] })
}));

vi.mock('../hooks/useSettingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      hourlyRate: 25,
      patientName: 'Mom',
      privacyMode: false,
      autoLockEnabled: true,
      hasCompletedOnboarding: true
    },
    updateSettings: vi.fn(),
    importData: vi.fn(),
    securityLogs: []
  })
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    currentUser: { id: 'u1', name: 'Test User', role: 'ADMIN' }
  })
}));

vi.mock('./ConfirmDialog', () => ({
  useConfirm: () => async () => true
}));

vi.mock('../utils/rbac', () => ({
  hasPermission: () => true
}));

describe('Settings', () => {
  it('renders settings header and save button', () => {
    render(<Settings />);
    expect(screen.getByText(/Family Configuration/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });
});
