// ============================================
// GLASS COLLECTION - Bardak Koleksiyonu
// ============================================
// Premium kullanıcılar için farklı bardak görselleri

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- STORAGE KEYS ---
const SECILI_BARDAK_KEY = '@secili_bardak';
const ACIK_BARDAKLAR_KEY = '@acik_bardaklar';

// --- TİPLER ---
export interface Bardak {
    id: string;
    ad: string;
    emoji: string;
    kiritAcmaSarti: 'varsayilan' | 'xp' | 'streak' | 'rozet' | 'premium';
    gerekliDeger?: number; // XP miktarı veya streak günü
    aciklama: string;
}

// --- BARDAK KOLEKSIYONU ---
export const BARDAKLAR: Bardak[] = [
    // Varsayılan (Herkese açık)
    { id: 'klasik', ad: 'Klasik Bardak', emoji: '🥛', kiritAcmaSarti: 'varsayilan', aciklama: 'Herkesin favorisi' },

    // XP ile açılan
    { id: 'su_sisesi', ad: 'Su Şişesi', emoji: '💧', kiritAcmaSarti: 'xp', gerekliDeger: 500, aciklama: '500 XP kazanınca açılır' },
    { id: 'matara', ad: 'Matara', emoji: '🫗', kiritAcmaSarti: 'xp', gerekliDeger: 1000, aciklama: '1000 XP kazanınca açılır' },
    { id: 'termos', ad: 'Termos', emoji: '🧴', kiritAcmaSarti: 'xp', gerekliDeger: 2500, aciklama: '2500 XP kazanınca açılır' },

    // Streak ile açılan
    { id: 'kuppa', ad: 'Altın Kupa', emoji: '🏆', kiritAcmaSarti: 'streak', gerekliDeger: 7, aciklama: '7 günlük streak ile açılır' },
    { id: 'elmas', ad: 'Elmas Bardak', emoji: '💎', kiritAcmaSarti: 'streak', gerekliDeger: 30, aciklama: '30 günlük streak ile açılır' },

    // Premium özel
    { id: 'tropical', ad: 'Tropik Kokteyl', emoji: '🍹', kiritAcmaSarti: 'premium', aciklama: 'Premium özel' },
    { id: 'unicorn', ad: 'Unicorn', emoji: '🦄', kiritAcmaSarti: 'premium', aciklama: 'Premium özel' },
    { id: 'kristal', ad: 'Kristal Kadeh', emoji: '🍷', kiritAcmaSarti: 'premium', aciklama: 'Premium özel' },
    { id: 'buz', ad: 'Buz Bardağı', emoji: '🧊', kiritAcmaSarti: 'premium', aciklama: 'Premium özel' },
];

// --- FONKSİYONLAR ---

/**
 * Seçili bardağı kaydet
 */
export async function seciliBardakKaydet(bardakId: string): Promise<void> {
    try {
        await AsyncStorage.setItem(SECILI_BARDAK_KEY, bardakId);
    } catch (hata) {
        console.error('Bardak kaydedilemedi:', hata);
    }
}

/**
 * Seçili bardağı yükle
 */
export async function seciliBardakYukle(): Promise<string> {
    try {
        const kayitli = await AsyncStorage.getItem(SECILI_BARDAK_KEY);
        return kayitli || 'klasik';
    } catch (hata) {
        console.error('Bardak yüklenemedi:', hata);
        return 'klasik';
    }
}

/**
 * Açık bardakları yükle
 */
export async function acikBardaklarYukle(): Promise<string[]> {
    try {
        const kayitli = await AsyncStorage.getItem(ACIK_BARDAKLAR_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Açık bardaklar yüklenemedi:', hata);
    }
    return ['klasik']; // Varsayılan her zaman açık
}

/**
 * Bardak kilidini aç
 */
export async function bardakKilidiAc(bardakId: string): Promise<void> {
    try {
        const mevcutAcik = await acikBardaklarYukle();
        if (!mevcutAcik.includes(bardakId)) {
            mevcutAcik.push(bardakId);
            await AsyncStorage.setItem(ACIK_BARDAKLAR_KEY, JSON.stringify(mevcutAcik));
        }
    } catch (hata) {
        console.error('Bardak kilidi açılamadı:', hata);
    }
}

/**
 * Bardak açık mı kontrol et
 */
export function bardakAcikMi(
    bardak: Bardak,
    acikBardaklar: string[],
    kullaniciXP: number,
    streak: number,
    premiumAktif: boolean
): boolean {
    // Zaten açılmış
    if (acikBardaklar.includes(bardak.id)) return true;

    // Varsayılan her zaman açık
    if (bardak.kiritAcmaSarti === 'varsayilan') return true;

    // Premium kontrolü
    if (bardak.kiritAcmaSarti === 'premium') return premiumAktif;

    // XP kontrolü
    if (bardak.kiritAcmaSarti === 'xp' && bardak.gerekliDeger) {
        return kullaniciXP >= bardak.gerekliDeger;
    }

    // Streak kontrolü
    if (bardak.kiritAcmaSarti === 'streak' && bardak.gerekliDeger) {
        return streak >= bardak.gerekliDeger;
    }

    return false;
}

/**
 * Bardak bilgisini ID'ye göre al
 */
export function bardakBul(bardakId: string): Bardak | undefined {
    return BARDAKLAR.find(b => b.id === bardakId);
}
