// ============================================
// PREMIUM UTILS
// ============================================
// Kullanıcının Premium durumunu yönetir

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SABİTLER ---
const PREMIUM_KEY = '@premium_durum';

// --- TİPLER ---
export interface PremiumDurum {
    aktif: boolean;
    paketId?: 'aylik' | 'yillik' | 'omur_boyu';
    satinAlmaTarihi?: string;
}

const VARSAYILAN_DURUM: PremiumDurum = {
    aktif: false
};

// --- FONKSİYONLAR ---

/**
 * Premium durumunu kaydet
 */
export async function premiumDurumKaydet(durum: PremiumDurum): Promise<void> {
    try {
        await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(durum));
    } catch (hata) {
        console.error('Premium durumu kaydedilemedi:', hata);
    }
}

/**
 * Premium durumunu yükle
 */
export async function premiumDurumYukle(): Promise<PremiumDurum> {
    try {
        const kayitli = await AsyncStorage.getItem(PREMIUM_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Premium durumu yüklenemedi:', hata);
    }
    return VARSAYILAN_DURUM;
}

/**
 * Basit premium kontrolü
 */
export async function premiumAktifMi(): Promise<boolean> {
    const durum = await premiumDurumYukle();
    return durum.aktif;
}

/**
 * Premium durumunu sıfırla (Test amaçlı)
 */
export async function premiumSifirla(): Promise<void> {
    await premiumDurumKaydet({ aktif: false });
}
