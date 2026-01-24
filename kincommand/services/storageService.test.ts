import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storageService } from './storageService';
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
    }
}));

describe('storageService (Supabase Implementation)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { }); // Silence console.error
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should map app keys to correct Supabase tables', async () => {
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

        await storageService.save('kin_entries', [{ id: 1, test: 'data' }]);

        expect(supabase.from).toHaveBeenCalledWith('ledger_entries');
        expect(mockUpsert).toHaveBeenCalled();
    });

    it('should handle load errors gracefully by returning default value', async () => {
        const mockSelect = vi.fn().mockResolvedValue({ data: null, error: { message: 'Network Error' } });
        (supabase.from as any).mockReturnValue({ select: vi.fn(() => mockSelect()) });

        const result = await storageService.load('kin_entries', []);

        expect(result).toEqual([]);
    });

    it('should convert data to snake_case on save', async () => {
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

        const testData = [{ userId: 'u1', type: 'EXPENSE' }];
        await storageService.save('kin_entries', testData);

        // userId should become user_id
        expect(mockUpsert).toHaveBeenCalledWith([{ user_id: 'u1', type: 'EXPENSE' }]);
    });
});
