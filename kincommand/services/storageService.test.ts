import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { storageService, setStorageProviderForTests, setActiveFamilyId } from './storageService';
import { supabase } from './supabase';

// Mock Supabase client
// We need to mock the chainable methods: from(table).select()...
vi.mock('./supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            single: vi.fn()
        }))
    },
    isSupabaseConfigured: true
}));

describe('storageService (Supabase Implementation)', () => {
    const fromMock = supabase.from as Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { }); // Silence console.error
        setStorageProviderForTests('supabase');
        setActiveFamilyId('family-test');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should map app keys to correct Supabase tables', async () => {
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });
        fromMock.mockReturnValue({ upsert: mockUpsert });

        await storageService.save('kin_entries', [{ id: 1, test: 'data' }]);

        expect(supabase.from).toHaveBeenCalledWith('ledger_entries');
        expect(mockUpsert).toHaveBeenCalled();
    });

    it('should handle load errors gracefully by returning default value', async () => {
        const mockSelect = vi.fn().mockResolvedValue({ data: null, error: { message: 'Network Error' } });
        fromMock.mockReturnValue({ select: mockSelect });

        const result = await storageService.load('kin_entries', []);

        expect(result).toEqual([]);
    });

    it('should convert data to snake_case on save', async () => {
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });
        fromMock.mockReturnValue({ upsert: mockUpsert });

        const testData = [{
            id: 'e1',
            userId: 'u1',
            type: 'EXPENSE',
            date: '2026-01-24',
            description: 'Test',
            amount: 12.5,
            category: 'Misc',
            timeDurationMinutes: 30,
            isMedicaidFlagged: true,
            aiAnalysis: 'note',
            receiptUrl: 'http://example.com'
        }];
        await storageService.save('kin_entries', testData);

        expect(mockUpsert).toHaveBeenCalledWith([
            expect.objectContaining({
                family_id: 'family-test',
                user_id: 'u1',
                time_duration_minutes: 30,
                is_medicaid_flagged: true,
                ai_analysis: 'note',
                receipt_url: 'http://example.com'
            })
        ]);
    });
});
