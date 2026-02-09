// ============================================
// APPLE HEALTHKIT ENTEGRASYONU
// ============================================
// Su tüketimini Apple Health'e kaydetme

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HealthKit sadece iOS'ta çalışır
let AppleHealthKit: any = null;

// GELİŞTİRME MODU - Simülasyon Devre Dışı (Production Ready)
const DEV_MODE_SIMULATION = false;

if (Platform.OS === 'ios') {
    try {
        AppleHealthKit = require('react-native-health').default;
    } catch (error) {
        // console.log('HealthKit yüklenemedi:', error);
    }
}

// --- SABİTLER ---
const HEALTHKIT_ENABLED_KEY = '@healthkit_enabled';
const HEALTHKIT_DYNAMIC_GOAL_KEY = '@healthkit_dynamic_goal';

// --- TİPLER ---
export interface HealthKitDurumu {
    aktif: boolean;
    destekleniyor: boolean;
    izinVerildi: boolean;
}

// --- İZİN OPSİYONLARI ---
const healthKitOptions = {
    permissions: {
        read: ['StepCount', 'Water', 'ActiveEnergyBurned'],  // Adım, Su ve Aktif Enerji okuma
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
        // console.error('HealthKit ayarı kaydedilemedi:', error);
    }
}

/**
 * HealthKit'i başlat ve izin iste
 */
export async function healthKitBaslat(): Promise<boolean> {
    if (!healthKitDestekleniyor()) {
        // console.log('HealthKit bu cihazda desteklenmiyor');
        return false;
    }

    return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(healthKitOptions, (error: string) => {
            if (error) {
                // console.log('HealthKit başlatılamadı:', error);
                resolve(false);
            } else {
                // console.log('HealthKit başarıyla başlatıldı');
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
                // console.log('Su tüketimi kaydedilemedi:', error);
                resolve(false);
            } else {
                // console.log('Su tüketimi Apple Health\'e kaydedildi:', litreMiktar, 'L');
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
            Alert.alert('✅ Aktif', 'Su tüketimin artık Apple Health\'e kaydedilecek.');
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
                // console.log('Adım sayısı alınamadı:', error);
                resolve(0);
            } else {
                // console.log('Bugünkü adım sayısı:', results?.value || 0);
                resolve(results?.value || 0);
            }
        });
    });
}

/**
 * Bugünkü su tüketimini Apple Health'ten al (çift yönlü senkronizasyon)
 * Diğer uygulamalardan kaydedilen su verisini de içerir
 */
export async function suTuketimiOku(): Promise<number> {
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
            ascending: false,
        };

        AppleHealthKit.getWaterSamples(options, (error: string, results: Array<{ value: number }>) => {
            if (error) {
                // console.log('Su tüketimi okunamadı:', error);
                resolve(0);
            } else {
                // Tüm kayıtları topla (litre cinsinden)
                const toplamLitre = results?.reduce((toplam, kayit) => toplam + (kayit.value || 0), 0) || 0;
                const toplamMl = Math.round(toplamLitre * 1000);
                // console.log('Bugünkü Apple Health su tüketimi:', toplamMl, 'ml');
                resolve(toplamMl);
            }
        });
    });
}

/**
 * Apple Health'teki su verisini uygulama ile karşılaştır
 * Bu fonksiyon, hem uygulamadan hem de diğer kaynaklardan gelen verileri raporlar
 */
export interface HealthKitSuRapor {
    uygulamadanMl: number;      // Bu uygulamadan kaydedilen
    toplamHealthKitMl: number;  // Apple Health'teki toplam
    digerKaynaklarMl: number;   // Diğer uygulamalardan gelen
}

export async function suTuketimiKarsilastir(uygulamaMl: number): Promise<HealthKitSuRapor> {
    const healthKitMl = await suTuketimiOku();

    return {
        uygulamadanMl: uygulamaMl,
        toplamHealthKitMl: healthKitMl,
        digerKaynaklarMl: Math.max(0, healthKitMl - uygulamaMl),
    };
}

// ============================================
// DİNAMİK HEDEF - Kalori Bazlı Su Önerisi
// ============================================

/**
 * Dinamik hedef ayarını yükle
 */
export async function dinamikHedefAyarYukle(): Promise<boolean> {
    try {
        const kayitli = await AsyncStorage.getItem(HEALTHKIT_DYNAMIC_GOAL_KEY);
        return kayitli === 'true';
    } catch {
        return false;
    }
}

/**
 * Dinamik hedef ayarını kaydet
 */
export async function dinamikHedefAyarKaydet(aktif: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(HEALTHKIT_DYNAMIC_GOAL_KEY, aktif ? 'true' : 'false');
    } catch (error) {
        // console.error('Dinamik hedef ayarı kaydedilemedi:', error);
    }
}

/**
 * Bugünkü aktif enerji (yakılan kalori) Apple Health'ten al
 */
export async function yakilanKaloriAl(): Promise<number> {
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

        AppleHealthKit.getActiveEnergyBurned(options, (error: string, results: Array<{ value: number }>) => {
            if (error) {
                // console.log('Yakılan kalori alınamadı:', error);
                resolve(0);
            } else {
                // Tüm kayıtları topla
                const toplamKalori = results?.reduce((toplam, kayit) => toplam + (kayit.value || 0), 0) || 0;
                // console.log('Bugünkü yakılan kalori:', Math.round(toplamKalori), 'kcal');
                resolve(Math.round(toplamKalori));
            }
        });
    });
}

/**
 * Dinamik su hedefi hesapla
 * 
 * Formül (bilimsel kaynaklara dayalı):
 * - Temel ihtiyaç: Kilo (kg) x 30-35 ml
 * - Aktivite eklentisi: Her 100 kalori yakım için +100ml
 * - Minimum: 1500ml, Maksimum: 5000ml
 * 
 * Referanslar:
 * - Mayo Clinic: Günlük 2.7-3.7L önerisi
 * - NIH: Aktivite arttıkça su ihtiyacı artar
 */
export interface DinamikHedefSonuc {
    hedefMl: number;
    temelIhtiyac: number;
    aktiviteEklentisi: number;
    yakilanKalori: number;
    aciklama: string;
}

export async function dinamikHedefHesapla(kiloKg: number): Promise<DinamikHedefSonuc> {
    // Kaloriyi al
    const yakilanKalori = await yakilanKaloriAl();

    // Temel su ihtiyacı: Kilo x 33ml (ortalama)
    const temelIhtiyac = Math.round(kiloKg * 33);

    // Aktivite eklentisi: Her 100 kalori için 100ml
    // Bazal metabolizma (yaklaşık 1500-2000 kcal) zaten temel ihtiyaçta
    // Sadece "aktif enerji" için eklenti yapılır
    const aktiviteEklentisi = Math.round(yakilanKalori);  // 1 kalori = 1ml

    // Toplam hedef
    let hedefMl = temelIhtiyac + aktiviteEklentisi;

    // Sınırlar: 1500ml - 5000ml
    hedefMl = Math.max(1500, Math.min(5000, hedefMl));

    // 50ml'ye yuvarla
    hedefMl = Math.round(hedefMl / 50) * 50;

    // Açıklama oluştur
    let aciklama = '';
    if (yakilanKalori > 500) {
        aciklama = 'Yüksek aktivite! Ekstra su ihtiyacın var.';
    } else if (yakilanKalori > 200) {
        aciklama = 'Aktif bir gün geçiriyorsun, su ihtiyacın arttı.';
    } else {
        aciklama = 'Kilona göre hesaplanan temel su ihtiyacın.';
    }

    return {
        hedefMl,
        temelIhtiyac,
        aktiviteEklentisi,
        yakilanKalori,
        aciklama,
    };
}

/**
 * Dinamik hedef toggle - açıp kapatma
 */
export async function dinamikHedefToggle(): Promise<boolean> {
    if (!healthKitDestekleniyor()) {
        Alert.alert(
            'Desteklenmiyor',
            'Dinamik hedef özelliği sadece iOS cihazlarda Apple Health ile çalışır.'
        );
        return false;
    }

    // Önce HealthKit'in aktif olduğundan emin ol
    const healthKitAktif = await healthKitAyarYukle();
    if (!healthKitAktif) {
        Alert.alert(
            'Apple Health Gerekli',
            'Dinamik hedef özelliğini kullanmak için önce Apple Health entegrasyonunu açmalısınız.'
        );
        return false;
    }

    const mevcutDurum = await dinamikHedefAyarYukle();
    await dinamikHedefAyarKaydet(!mevcutDurum);

    return !mevcutDurum;
}

