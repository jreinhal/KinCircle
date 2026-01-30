import React from 'react';
import { render, screen } from '@testing-library/react';
import Ledger from './Ledger';
const { mockEntriesStore, mockAppContext } = vi.hoisted(() => ({
  mockEntriesStore: {
    entries: [
      {
        id: 'e1',
        userId: 'u1',
        type: 'EXPENSE',
        date: '2025-01-01',
        description: 'Groceries',
        amount: 25,
        category: 'Food'
      }
    ],
    deleteEntry: vi.fn()
  },
  mockAppContext: {
    users: [{ id: 'u1', name: 'Viewer', role: 'VIEWER' }],
    currentUser: { id: 'u1', name: 'Viewer', role: 'VIEWER' }
  }
}));

vi.mock('../hooks/useEntriesStore', () => ({
  useEntriesStore: () => mockEntriesStore
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => mockAppContext
}));

vi.mock('./ConfirmDialog', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true)
}));

describe('Ledger RBAC', () => {
  it('hides destructive actions for viewers', () => {
    mockAppContext.currentUser = { id: 'u1', name: 'Viewer', role: 'VIEWER' };
    render(<Ledger />);
    expect(screen.queryByTitle('Delete Entry')).toBeNull();
  });

  it('shows destructive actions for admins', () => {
    mockAppContext.currentUser = { id: 'u1', name: 'Admin', role: 'ADMIN' };
    render(<Ledger />);
    expect(screen.getByTitle('Delete Entry')).toBeVisible();
  });
});
