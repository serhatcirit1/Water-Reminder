// ============================================
// PREMIUM UTILS UNIT TESTS
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

import {
    premiumDurumKaydet,
    premiumDurumYukle,
    premiumAktifMi,
    premiumSifirla,
    PremiumDurum,
} from '../premiumUtils';

describe('PremiumUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('premiumDurumKaydet', () => {
        it('premium durumunu doğru kaydeder', async () => {
            const durum: PremiumDurum = {
                aktif: true,
                paketId: 'yillik',
                satinAlmaTarihi: '2024-01-01',
            };

            await premiumDurumKaydet(durum);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@premium_durum',
                JSON.stringify(durum)
            );
        });

        it('hata durumunda sessizce devam eder', async () => {
            (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Test'));

            await expect(premiumDurumKaydet({ aktif: true })).resolves.toBeUndefined();
        });
    });

    describe('premiumDurumYukle', () => {
        it('kayıtlı premium durumunu yükler', async () => {
            const mockDurum: PremiumDurum = {
                aktif: true,
                paketId: 'omur_boyu',
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockDurum));

            const durum = await premiumDurumYukle();

            expect(durum.aktif).toBe(true);
            expect(durum.paketId).toBe('omur_boyu');
        });

        it('kayıt yoksa varsayılan değer döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const durum = await premiumDurumYukle();

            expect(durum.aktif).toBe(false);
            expect(durum.paketId).toBeUndefined();
        });

        it('hata durumunda varsayılan değer döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Test'));

            const durum = await premiumDurumYukle();

            expect(durum.aktif).toBe(false);
        });
    });

    describe('premiumAktifMi', () => {
        it('premium aktifse true döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify({ aktif: true })
            );

            const sonuc = await premiumAktifMi();

            expect(sonuc).toBe(true);
        });

        it('premium aktif değilse false döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify({ aktif: false })
            );

            const sonuc = await premiumAktifMi();

            expect(sonuc).toBe(false);
        });
    });

    describe('premiumSifirla', () => {
        it('premium durumunu sıfırlar', async () => {
            await premiumSifirla();

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@premium_durum',
                JSON.stringify({ aktif: false })
            );
        });
    });
});
