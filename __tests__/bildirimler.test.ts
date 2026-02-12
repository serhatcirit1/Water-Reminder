// ============================================
// BILDIRIMLER UNIT TESTS
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    AndroidImportance: { HIGH: 4 },
    AndroidNotificationPriority: { HIGH: 'high' },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
    setNotificationChannelAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
    isDevice: true,
}));

jest.mock('react-native', () => ({
    Platform: { OS: 'ios' },
    Alert: { alert: jest.fn() },
}));

jest.mock('../aiUtils', () => ({
    bildirimGonderildiKaydet: jest.fn(),
}));

jest.mock('../locales/i18n', () => ({
    __esModule: true,
    default: {
        t: (key: string) => key,
        language: 'en',
    },
}));

import * as Notifications from 'expo-notifications';
import {
    bildirimIzniIste,
    bildirimAyarlariniKaydet,
    bildirimAyarlariniYukle,
    gunlukOzetAyarKaydet,
    gunlukOzetAyarYukle,
    haftalikRaporAyarKaydet,
    haftalikRaporAyarYukle,
    tumBildirimleriIptalEt,
    getRandomMesaj,
} from '../bildirimler';

describe('Bildirimler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('bildirimIzniIste', () => {
        it('iOS\'ta izin verildiğinde true döner', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'granted',
            });

            const sonuc = await bildirimIzniIste();
            expect(sonuc).toBe(true);
        });

        it('izin reddedildiğinde tekrar izin ister', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'denied',
            });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'granted',
            });

            const sonuc = await bildirimIzniIste();
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
            expect(sonuc).toBe(true);
        });

        it('hata durumunda false döner', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
                new Error('Test Error')
            );

            const sonuc = await bildirimIzniIste();
            expect(sonuc).toBe(false);
        });
    });

    describe('bildirimAyarlariniKaydet/Yukle', () => {
        it('ayarları doğru kaydeder', async () => {
            await bildirimAyarlariniKaydet(true, 120);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@bildirim_ayarlari',
                JSON.stringify({ aktif: true, aralikDakika: 120 })
            );
        });

        it('kayıtlı ayarları doğru yükler', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify({ aktif: true, aralikDakika: 60 })
            );

            const ayar = await bildirimAyarlariniYukle();

            expect(ayar.aktif).toBe(true);
            expect(ayar.aralikDakika).toBe(60);
        });

        it('kayıt yoksa varsayılan değerleri döner', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const ayar = await bildirimAyarlariniYukle();

            expect(ayar.aktif).toBe(true);
            expect(ayar.aralikDakika).toBe(120);
        });
    });

    describe('gunlukOzetAyarKaydet/Yukle', () => {
        it('günlük özet ayarını kaydeder', async () => {
            await gunlukOzetAyarKaydet({ aktif: true, saat: 21 });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@gunluk_ozet_ayar',
                JSON.stringify({ aktif: true, saat: 21 })
            );
        });

        it('günlük özet ayarını yükler', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify({ aktif: true, saat: 20 })
            );

            const ayar = await gunlukOzetAyarYukle();

            expect(ayar.aktif).toBe(true);
            expect(ayar.saat).toBe(20);
        });
    });

    describe('haftalikRaporAyarKaydet/Yukle', () => {
        it('haftalık rapor ayarını kaydeder', async () => {
            await haftalikRaporAyarKaydet({ aktif: true, gun: 0, saat: 10 });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@haftalik_rapor_ayar',
                JSON.stringify({ aktif: true, gun: 0, saat: 10 })
            );
        });

        it('haftalık rapor ayarını yükler', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify({ aktif: true, gun: 1, saat: 9 })
            );

            const ayar = await haftalikRaporAyarYukle();

            expect(ayar.aktif).toBe(true);
            expect(ayar.gun).toBe(1);
            expect(ayar.saat).toBe(9);
        });
    });

    describe('tumBildirimleriIptalEt', () => {
        it('tüm zamanlanmış bildirimleri iptal eder', async () => {
            await tumBildirimleriIptalEt();

            expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
        });
    });

    describe('getRandomMesaj', () => {
        it('rastgele bir motivasyon mesajı döner', () => {
            const mesaj = getRandomMesaj();

            expect(typeof mesaj).toBe('string');
            expect(mesaj.length).toBeGreaterThan(0);
        });
    });
});
