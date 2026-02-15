// ============================================
// HEALTH KIT ENTEGRASYONU
// ============================================
// Apple Health ile su ve sağlık verisi senkronizasyonu

import AppleHealthKit, {
    HealthValue,
    HealthKitPermissions,
} from 'react-native-health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const HEALTH_KIT_AYAR_KEY = '@health_kit_aktif';
const DINAMIK_HEDEF_KEY = '@dinamik_hedef_aktif';

export interface DinamikHedefSonuc {
    hedefMl: number;
    aciklama: string;
}

// İzinler
const permissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.Water,
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.BodyMass,
        ],
        write: [
            AppleHealthKit.Constants.Permissions.Water,
        ],
    },
};

/**
 * HealthKit destekleniyor mu?
 */
export function healthKitDestekleniyor(): boolean {
    return Platform.OS === 'ios';
}

/**
 * HealthKit ayarını yükle
 */
export async function healthKitAyarYukle(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(HEALTH_KIT_AYAR_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}

/**
 * HealthKit'i başlat
 */
export async function healthKitBaslat(): Promise<boolean> {
    if (!healthKitDestekleniyor()) return false;

    return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
            if (error) {
                console.log('[HealthKit] İzin hatası:', error);

                // Kullanıcıya hatayı göster
                // Not: Prodüksiyonda bu kadar detaylı hata göstermek istemeyebilirsiniz ama debug için gerekli.
                import('react-native').then(({ Alert }) => {
                    Alert.alert(
                        'Apple Health Hatası',
                        `HealthKit başlatılamadı: ${JSON.stringify(error)}`
                    );
                });

                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

/**
 * HealthKit'i aç/kapat
 */
export async function healthKitToggle(): Promise<boolean> {
    try {
        const aktif = await healthKitAyarYukle();
        const yeniDurum = !aktif;

        if (yeniDurum) {
            const basarili = await healthKitBaslat();
            if (!basarili) return false;
        }

        await AsyncStorage.setItem(HEALTH_KIT_AYAR_KEY, String(yeniDurum));
        return yeniDurum;
    } catch {
        return false;
    }
}

/**
 * Su tüketimini HealthKit'e kaydet
 */
export async function suTuketimiKaydet(miktarMl: number): Promise<void> {
    const aktif = await healthKitAyarYukle();
    if (!aktif || !healthKitDestekleniyor()) return;

    // Litreye çevir (HealthKit litre kullanır)
    const litre = miktarMl / 1000;

    const options = {
        value: litre,
    };

    AppleHealthKit.saveWater(options, (err: Object, res: Object) => {
        if (err) {
            console.log('[HealthKit] Su kaydetme hatası:', err);
            return;
        }
        console.log('[HealthKit] Su kaydedildi:', litre);
    });
}

/**
 * Dinamik hedef hesaplama (Kilo ve aktif enerjiye göre)
 */
export async function dinamikHedefHesapla(kilo: number): Promise<DinamikHedefSonuc> {
    // Temel ihtiyaç: Kilo * 35ml
    let hedef = kilo * 35;
    let aciklama = 'Temel İhtiyaç';

    // HealthKit verisi varsa ekle
    const aktif = await healthKitAyarYukle();
    if (aktif && healthKitDestekleniyor()) {
        try {
            // Son 24 saatlik aktif enerji (Cal)
            const options = {
                startDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
            };

            const enerjiPromise = new Promise<number>((resolve) => {
                AppleHealthKit.getActiveEnergyBurned(
                    options,
                    (err: Object, results: HealthValue[]) => {
                        if (err || !results || results.length === 0) {
                            resolve(0);
                            return;
                        }
                        // Toplam kaloriyi hesapla
                        const toplamCal = results.reduce((acc, curr) => acc + curr.value, 0);
                        resolve(toplamCal);
                    }
                );
            });

            const yakilanKalori = await enerjiPromise;

            // Her 1 kcal için 1 ml ekle
            if (yakilanKalori > 0) {
                const ek = Math.round(yakilanKalori); // Basit hesap: 1 kcal = 1 ml su
                hedef += ek;
                aciklama = `Temel + ${Math.round(yakilanKalori)} ml (Aktivite)`;
            }
        } catch (e) {
            console.log('[HealthKit] Enerji verisi alınamadı', e);
        }
    }

    return {
        hedefMl: Math.round(hedef / 100) * 100, // 100'e yuvarla
        aciklama,
    };
}

/**
 * Dinamik hedef ayarını yükle
 */
export async function dinamikHedefAyarYukle(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(DINAMIK_HEDEF_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}

/**
 * Dinamik hedef ayarını kaydet
 */
export async function dinamikHedefAyarKaydet(aktif: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(DINAMIK_HEDEF_KEY, String(aktif));
    } catch (e) {
        console.error('Dinamik hedef ayarı kaydedilemedi', e);
    }
}
