// ============================================
// APPLE HEALTHKIT ENTEGRASYONU
// ============================================
// Su tüketimini Apple Health'e kaydetme

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HealthKit sadece iOS'ta çalışır
let AppleHealthKit: any = null;

if (Platform.OS === 'ios') {
    try {
        AppleHealthKit = require('react-native-health').default;
    } catch (error) {
        console.log('HealthKit yüklenemedi:', error);
    }
}

// --- SABİTLER ---
const HEALTHKIT_ENABLED_KEY = '@healthkit_enabled';

// --- TİPLER ---
export interface HealthKitDurumu {
    aktif: boolean;
    destekleniyor: boolean;
    izinVerildi: boolean;
}

// --- İZİN OPSİYONLARI ---
const healthKitOptions = {
    permissions: {
        read: ['StepCount'],
        write: ['Water'],
    },
};

// --- FONKSİYONLAR ---

/**
 * HealthKit'in cihazda desteklenip desteklenmediğini kontrol et
 */
export function healthKitDestekleniyor(): boolean {
    return Platform.OS === 'ios' && AppleHealthKit !== null;
}

/**
 * HealthKit ayarını yükle
 */
export async function healthKitAyarYukle(): Promise<boolean> {
    try {
        const kayitli = await AsyncStorage.getItem(HEALTHKIT_ENABLED_KEY);
        return kayitli === 'true';
    } catch {
        return false;
    }
}

/**
 * HealthKit ayarını kaydet
 */
export async function healthKitAyarKaydet(aktif: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(HEALTHKIT_ENABLED_KEY, aktif ? 'true' : 'false');
    } catch (error) {
        console.error('HealthKit ayarı kaydedilemedi:', error);
    }
}

/**
 * HealthKit'i başlat ve izin iste
 */
export async function healthKitBaslat(): Promise<boolean> {
    if (!healthKitDestekleniyor()) {
        console.log('HealthKit bu cihazda desteklenmiyor');
        return false;
    }

    return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(healthKitOptions, (error: string) => {
            if (error) {
                console.log('HealthKit başlatılamadı:', error);
                resolve(false);
            } else {
                console.log('HealthKit başarıyla başlatıldı');
                resolve(true);
            }
        });
    });
}

/**
 * Su tüketimini Apple Health'e kaydet
 */
export async function suTuketimiKaydet(mlMiktar: number): Promise<boolean> {
    // HealthKit aktif mi kontrol et
    const aktif = await healthKitAyarYukle();
    if (!aktif) {
        return false;
    }

    if (!healthKitDestekleniyor()) {
        return false;
    }

    // Litre cinsine çevir (HealthKit litre kullanır)
    const litreMiktar = mlMiktar / 1000;

    return new Promise((resolve) => {
        const options = {
            value: litreMiktar,
            date: new Date().toISOString(),
            unit: 'liter',
        };

        AppleHealthKit.saveWater(options, (error: string, result: any) => {
            if (error) {
                console.log('Su tüketimi kaydedilemedi:', error);
                resolve(false);
            } else {
                console.log('Su tüketimi Apple Health\'e kaydedildi:', litreMiktar, 'L');
                resolve(true);
            }
        });
    });
}

/**
 * HealthKit durumunu al
 */
export async function healthKitDurumuAl(): Promise<HealthKitDurumu> {
    const destekleniyor = healthKitDestekleniyor();
    const aktif = await healthKitAyarYukle();

    return {
        aktif,
        destekleniyor,
        izinVerildi: aktif && destekleniyor,
    };
}

/**
 * HealthKit'i aç/kapa
 */
export async function healthKitToggle(): Promise<boolean> {
    if (!healthKitDestekleniyor()) {
        Alert.alert(
            'Desteklenmiyor',
            'Apple Health sadece iOS cihazlarda kullanılabilir.'
        );
        return false;
    }

    const mevcutDurum = await healthKitAyarYukle();

    if (!mevcutDurum) {
        // Açmak istiyoruz - izin iste
        const izinVerildi = await healthKitBaslat();
        if (izinVerildi) {
            await healthKitAyarKaydet(true);
            Alert.alert('✅ Aktif', 'Su tüiketimin artık Apple Health\'e kaydedilecek.');
            return true;
        } else {
            Alert.alert(
                'İzin Gerekli',
                'Apple Health\'e erişim için izin vermeniz gerekiyor. Ayarlar > Sağlık > Veri Erişimi bölümünden izin verebilirsiniz.'
            );
            return false;
        }
    } else {
        // Kapatmak istiyoruz
        await healthKitAyarKaydet(false);
        return false;
    }
}

/**
 * Bugünkü adım sayısını Apple Health'ten al
 */
export async function adimSayisiAl(): Promise<number> {
    // HealthKit aktif mi kontrol et
    const aktif = await healthKitAyarYukle();
    if (!aktif) {
        return 0;
    }

    if (!healthKitDestekleniyor()) {
        return 0;
    }

    return new Promise((resolve) => {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);

        const options = {
            startDate: bugun.toISOString(),
            endDate: new Date().toISOString(),
        };

        AppleHealthKit.getStepCount(options, (error: string, results: { value: number }) => {
            if (error) {
                console.log('Adım sayısı alınamadı:', error);
                resolve(0);
            } else {
                console.log('Bugünkü adım sayısı:', results?.value || 0);
                resolve(results?.value || 0);
            }
        });
    });
}
