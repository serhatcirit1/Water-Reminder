// ============================================
// EXPORT UTILS UNIT TESTS
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('../locales/i18n', () => ({
    __esModule: true,
    default: {
        t: (key: string) => {
            if (key === 'common.locale') return 'en-US';
            return key;
        },
        language: 'en',
    },
}));

jest.mock('expo-file-system/legacy', () => ({
    cacheDirectory: '/cache/',
    writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    shareAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
    Alert: { alert: jest.fn() },
}));

import {
    suGecmisiniYukle,
    premiumCsvOlustur,
    toplamVeriSayisi,
} from '../exportUtils';

describe('ExportUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('suGecmisiniYukle', () => {
        it('kayıtlı geçmişi doğru yükler', async () => {
            const mockGecmis = {
                '2024-01-15': { ml: 2500, miktar: 10 },
                '2024-01-14': { ml: 2000, miktar: 8 },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockGecmis));

            const gecmis = await suGecmisiniYukle();

            expect(gecmis['2024-01-15'].ml).toBe(2500);
            expect(gecmis['2024-01-14'].ml).toBe(2000);
        });

        it('kayıt yoksa boş obje döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const gecmis = await suGecmisiniYukle();

            expect(gecmis).toEqual({});
        });

        it('hata durumunda boş obje döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Test'));

            const gecmis = await suGecmisiniYukle();

            expect(gecmis).toEqual({});
        });
    });

    describe('premiumCsvOlustur', () => {
        it('CSV formatında rapor oluşturur', () => {
            const mockGecmis = {
                '2024-01-15': { ml: 2500, miktar: 10 },
                '2024-01-14': { ml: 1800, miktar: 7 },
            };

            const csv = premiumCsvOlustur(mockGecmis, 2000);

            expect(csv).toContain('csv.title');
            expect(csv).toContain('csv.date');
            expect(csv).toContain('csv.consumption_ml');
            expect(csv).toContain('2024-01-15');
            expect(csv).toContain('2500');
        });

        it('boş veri ile header içerir', () => {
            const csv = premiumCsvOlustur({}, 2000);

            expect(csv).toContain('csv.title');
            expect(csv).toContain('csv.date');
        });
    });

    describe('toplamVeriSayisi', () => {
        it('toplam gün sayısını döner', async () => {
            const mockGecmis = {
                '2024-01-15': { ml: 2500, miktar: 10 },
                '2024-01-14': { ml: 2000, miktar: 8 },
                '2024-01-13': { ml: 1500, miktar: 6 },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockGecmis));

            const sayi = await toplamVeriSayisi();

            expect(sayi).toBe(3);
        });

        it('veri yoksa 0 döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const sayi = await toplamVeriSayisi();

            expect(sayi).toBe(0);
        });
    });
});
