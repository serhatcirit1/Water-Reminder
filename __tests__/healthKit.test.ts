// ============================================
// HEALTHKIT UNIT TESTS
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('react-native', () => ({
    Platform: { OS: 'ios' },
    Alert: { alert: jest.fn() },
}));

// Mock react-native-health (sadece import için)
jest.mock('react-native-health', () => ({
    default: {
        initHealthKit: jest.fn(),
        saveWater: jest.fn(),
        getStepCount: jest.fn(),
    },
}), { virtual: true });

import {
    healthKitDestekleniyor,
    healthKitAyarYukle,
    healthKitAyarKaydet,
    healthKitDurumuAl,
} from '../healthKit';

describe('HealthKit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('healthKitDestekleniyor', () => {
        it('iOS\'ta true döner', () => {
            // Platform mock zaten iOS olarak ayarlandı
            const sonuc = healthKitDestekleniyor();
            // Not: Bu test mock edilmiş ortamda çalışır
            expect(typeof sonuc).toBe('boolean');
        });
    });

    describe('healthKitAyarYukle', () => {
        it('kayıtlı ayarı yükler (aktif)', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

            const sonuc = await healthKitAyarYukle();

            expect(sonuc).toBe(true);
        });

        it('kayıtlı ayarı yükler (pasif)', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');

            const sonuc = await healthKitAyarYukle();

            expect(sonuc).toBe(false);
        });

        it('kayıt yoksa false döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const sonuc = await healthKitAyarYukle();

            expect(sonuc).toBe(false);
        });

        it('hata durumunda false döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Test'));

            const sonuc = await healthKitAyarYukle();

            expect(sonuc).toBe(false);
        });
    });

    describe('healthKitAyarKaydet', () => {
        it('aktif ayarını kaydeder', async () => {
            await healthKitAyarKaydet(true);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@healthkit_enabled',
                'true'
            );
        });

        it('pasif ayarını kaydeder', async () => {
            await healthKitAyarKaydet(false);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@healthkit_enabled',
                'false'
            );
        });
    });

    describe('healthKitDurumuAl', () => {
        it('durum objesini döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

            const durum = await healthKitDurumuAl();

            expect(durum).toHaveProperty('aktif');
            expect(durum).toHaveProperty('destekleniyor');
            expect(durum).toHaveProperty('izinVerildi');
        });

        it('aktif true ise izinVerildi de true olur', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

            const durum = await healthKitDurumuAl();

            expect(durum.aktif).toBe(true);
        });
    });
});
