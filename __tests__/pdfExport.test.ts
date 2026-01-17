// ============================================
// PDF EXPORT UNIT TESTS
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('expo-print', () => ({
    printToFileAsync: jest.fn().mockResolvedValue({ uri: '/test/file.pdf' }),
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
    streakHesapla,
    detayliAylikIstatistikHesapla,
} from '../pdfExport';

describe('PdfExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('suGecmisiniYukle', () => {
        it('kayıtlı geçmişi doğru yükler', async () => {
            const mockGecmis = {
                '2024-01-15': { ml: 2500, miktar: 10 },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockGecmis));

            const gecmis = await suGecmisiniYukle();

            expect(gecmis['2024-01-15'].ml).toBe(2500);
        });

        it('kayıt yoksa boş obje döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const gecmis = await suGecmisiniYukle();

            expect(gecmis).toEqual({});
        });
    });

    describe('streakHesapla', () => {
        it('ardışık başarılı günleri sayar', () => {
            const bugun = new Date();
            const dun = new Date(bugun);
            dun.setDate(dun.getDate() - 1);
            const oncekiGun = new Date(bugun);
            oncekiGun.setDate(oncekiGun.getDate() - 2);

            const gecmis = {
                [bugun.toISOString().split('T')[0]]: { ml: 2500, miktar: 10 },
                [dun.toISOString().split('T')[0]]: { ml: 2200, miktar: 9 },
                [oncekiGun.toISOString().split('T')[0]]: { ml: 2100, miktar: 8 },
            };

            const streak = streakHesapla(gecmis, 2000);

            expect(streak).toBe(3);
        });

        it('hedef altındaki günde seri kırılır', () => {
            const bugun = new Date();
            const dun = new Date(bugun);
            dun.setDate(dun.getDate() - 1);

            const gecmis = {
                [bugun.toISOString().split('T')[0]]: { ml: 2500, miktar: 10 },
                [dun.toISOString().split('T')[0]]: { ml: 1500, miktar: 6 }, // Hedef altı
            };

            const streak = streakHesapla(gecmis, 2000);

            expect(streak).toBe(1);
        });

        it('boş veri için 0 döner', () => {
            const streak = streakHesapla({}, 2000);

            expect(streak).toBe(0);
        });
    });

    describe('detayliAylikIstatistikHesapla', () => {
        it('aylık istatistikleri doğru hesaplar', () => {
            const gecmis = {
                '2024-01-15': { ml: 2500, miktar: 10 },
                '2024-01-14': { ml: 2000, miktar: 8 },
                '2024-01-13': { ml: 1800, miktar: 7 },
            };

            const ozet = detayliAylikIstatistikHesapla(gecmis, 0, 2024, 2000); // Ocak 2024

            expect(ozet.toplamGun).toBe(3);
            expect(ozet.toplamMl).toBe(6300);
            expect(ozet.ortalamaMl).toBe(2100);
            expect(ozet.basariliGunler).toBe(2); // 2 gün hedefe ulaşıldı
        });

        it('veri olmayan ay için 0 değerler döner', () => {
            const ozet = detayliAylikIstatistikHesapla({}, 5, 2024, 2000); // Haziran 2024 - boş

            expect(ozet.toplamGun).toBe(0);
            expect(ozet.toplamMl).toBe(0);
        });
    });
});
