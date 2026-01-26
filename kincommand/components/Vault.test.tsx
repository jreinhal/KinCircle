import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Vault from './Vault';
const { mockDocumentsStore, mockSettingsStore, mockAppContext } = vi.hoisted(() => ({
  mockDocumentsStore: {
    documents: [],
    addDocument: vi.fn(),
    deleteDocument: vi.fn()
  },
  mockSettingsStore: {
    settings: {
      hourlyRate: 25,
      patientName: 'Mom',
      privacyMode: false,
      autoLockEnabled: true,
      hasCompletedOnboarding: true,
      customPinHash: 'legacy-pin-placeholder',
      isSecurePinHash: false
    },
    logSecurityEvent: vi.fn()
  },
  mockAppContext: {
    users: [{ id: 'u1', name: 'Admin', role: 'ADMIN' }],
    currentUser: { id: 'u1', name: 'Admin', role: 'ADMIN' }
  }
}));

vi.mock('../hooks/useDocumentsStore', () => ({
  useDocumentsStore: () => mockDocumentsStore
}));

vi.mock('../hooks/useSettingsStore', () => ({
  useSettingsStore: () => mockSettingsStore
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => mockAppContext
}));

vi.mock('./ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true)
}));

describe('Vault', () => {
  beforeEach(async () => {
    const { hashPinLegacy } = await import('../utils/crypto');
    mockSettingsStore.settings.customPinHash = hashPinLegacy('1234');
  });

  it('opens the emergency PIN modal', async () => {
    render(<Vault />);

    await userEvent.click(screen.getByRole('button', { name: /emergency access/i }));

    expect(screen.getByRole('heading', { name: /emergency access/i })).toBeVisible();
    expect(screen.getByText(/enter your pin/i)).toBeVisible();
  });

  it('activates emergency mode with a valid PIN', async () => {
    render(<Vault />);

    await userEvent.click(screen.getByRole('button', { name: /emergency access/i }));

    const pinInput = screen.getByPlaceholderText('••••');
    await userEvent.type(pinInput, '1234');
    await userEvent.click(screen.getByRole('button', { name: /activate emergency mode/i }));

    expect(await screen.findByText(/emergency responder view/i)).toBeVisible();
  });
});
