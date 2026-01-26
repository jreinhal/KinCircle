import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatAssistant from './ChatAssistant';

const { queryLedgerMock } = vi.hoisted(() => ({
  queryLedgerMock: vi.fn()
}));

vi.mock('../services/geminiService', () => ({
  queryLedger: (...args: unknown[]) => queryLedgerMock(...args)
}));

vi.mock('../hooks/useEntriesStore', () => ({
  useEntriesStore: () => ({ entries: [] })
}));

vi.mock('../hooks/useSettingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      hourlyRate: 25,
      patientName: 'Mom',
      privacyMode: true,
      autoLockEnabled: true,
      hasCompletedOnboarding: true
    }
  })
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    users: [{ id: 'u1', name: 'Alex', role: 'ADMIN' }],
    currentUser: { id: 'u1', name: 'Alex', role: 'ADMIN' }
  })
}));

describe('ChatAssistant', () => {
  beforeEach(() => {
    queryLedgerMock.mockReset();
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  it('sends a query and renders the response', async () => {
    queryLedgerMock.mockResolvedValueOnce({ text: 'Hello from Kin', sources: [] });

    render(<ChatAssistant />);

    const input = screen.getByPlaceholderText(/ask about expenses/i);
    await userEvent.type(input, 'Hello{enter}');

    expect(queryLedgerMock).toHaveBeenCalledWith('Hello', [], expect.any(Array), expect.any(Object));
    expect(await screen.findByText('Hello from Kin')).toBeVisible();
  });

  it('shows a friendly error message on failure', async () => {
    queryLedgerMock.mockRejectedValueOnce(new Error('Network down'));

    render(<ChatAssistant />);

    const input = screen.getByPlaceholderText(/ask about expenses/i);
    await userEvent.type(input, 'Help{enter}');

    expect(await screen.findByText(/encountered an error/i)).toBeVisible();
  });
});
