import { renderHook, waitFor, act } from '@testing-library/react';
import { useKinStore } from './useKinStore';
import { storageService } from '../services/storageService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EntryType, FamilySettings, UserRole } from '../types';

// Mock storage service
vi.mock('../services/storageService', () => ({
    storageService: {
        load: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined)
    },
    getStorageProvider: vi.fn(() => 'local')
}));

const mockUser = { id: 'u1', name: 'Test User', role: UserRole.ADMIN };
const defaultSettings: FamilySettings = {
    hourlyRate: 20,
    patientName: '',
    privacyMode: false,
    autoLockEnabled: false,
    hasCompletedOnboarding: true
};

describe('useKinStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should start with isLoading = true', () => {
        // Mock load to hang or take time
        (storageService.load as any).mockReturnValue(new Promise(() => { }));

        const { result } = renderHook(() => useKinStore([], [], [], defaultSettings, mockUser));

        expect(result.current.isLoading).toBe(true);
    });

    it('should populate state from storageService', async () => {
        const mockEntries = [{ id: '1', userId: 'u1', type: EntryType.EXPENSE, amount: 100 }];

        // Setup mocks to return data
        (storageService.load as any).mockImplementation((key: string, def: any) => {
            if (key === 'kin_entries') return Promise.resolve(mockEntries);
            return Promise.resolve(def);
        });

        const { result } = renderHook(() => useKinStore([], [], [], defaultSettings, mockUser));

        // Wait for loading to finish
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.entries).toEqual(mockEntries);
    });

    it('should add an entry and trigger save', async () => {
        // Setup: Load returns empty
        (storageService.load as any).mockResolvedValue([]);

        const { result } = renderHook(() => useKinStore([], [], [], defaultSettings, mockUser));

        // Wait for initial load to complete
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Initial save might happen when entries are set (even if empty), so clear mocks
        vi.clearAllMocks();

        const newEntry = {
            id: '2',
            userId: 'u1',
            type: EntryType.EXPENSE,
            amount: 50,
            description: 'Test',
            date: '2023-01-01',
            category: 'Test'
        };

        // Act: Add entry
        act(() => {
            result.current.addEntry(newEntry);
        });

        // Assert: State updated
        expect(result.current.entries).toContainEqual(newEntry);

        // Assert: Persistence triggered
        await waitFor(() => {
            // Check that save was called at least once
            expect(storageService.save).toHaveBeenCalled();

            // Check that the last call contained our data in the 'kin_entries' key
            const saveCalls = (storageService.save as any).mock.calls;
            const entryCall = saveCalls.find((c: any) => c[0] === 'kin_entries');
            expect(entryCall).toBeTruthy();

            // Loose match for the entry in the array
            expect(entryCall[1]).toEqual(expect.arrayContaining([expect.objectContaining({ id: '2' })]));
        });
    });
});
