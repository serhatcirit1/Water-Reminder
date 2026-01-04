// ============================================
// ROZET SİSTEMİ
// ============================================
// Kullanıcı başarıları için rozet kazanma

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- ROZET TİPLERİ ---
export interface Rozet {
    id: string;
    isim: string;
    aciklama: string;
    emoji: string;
    kosul: string; // Açıklama
    kazanildi: boolean;
    kazanilmaTarihi?: string;
}

export interface RozetDurumu {
    rozetler: Rozet[];
    toplamKazanilan: number;
}

// --- ROZET TANIMLARI ---
export const ROZET_TANIMLARI: Omit<Rozet, 'kazanildi' | 'kazanilmaTarihi'>[] = [
    // Streak Rozetleri
    {
        id: 'streak_3',
        isim: 'Başlangıç',
        aciklama: '3 gün üst üste hedefini tamamla',
        emoji: '🌱',
        kosul: '3 günlük streak',
    },
    {
        id: 'streak_7',
        isim: 'Haftalık Şampiyon',
        aciklama: '7 gün üst üste hedefini tamamla',
        emoji: '🔥',
        kosul: '7 günlük streak',
    },
    {
        id: 'streak_14',
        isim: 'İki Haftalık Kahraman',
        aciklama: '14 gün üst üste hedefini tamamla',
        emoji: '⭐',
        kosul: '14 günlük streak',
    },
    {
        id: 'streak_30',
        isim: 'Aylık Efsane',
        aciklama: '30 gün üst üste hedefini tamamla',
        emoji: '🏆',
        kosul: '30 günlük streak',
    },

    // Toplam Su Rozetleri
    {
        id: 'toplam_2500',
        isim: 'İlk Adım',
        aciklama: 'Toplam 2500 ml (2.5L) su iç',
        emoji: '💧',
        kosul: '2500 ml toplam',
    },
    {
        id: 'toplam_12500',
        isim: 'Su Sever',
        aciklama: 'Toplam 12500 ml (12.5L) su iç',
        emoji: '🌊',
        kosul: '12500 ml toplam',
    },
    {
        id: 'toplam_25000',
        isim: 'Hidrasyon Ustası',
        aciklama: 'Toplam 25000 ml (25L) su iç',
        emoji: '🐳',
        kosul: '25000 ml toplam',
    },
    {
        id: 'toplam_125000',
        isim: 'Su Efsanesi',
        aciklama: 'Toplam 125000 ml (125L) su iç',
        emoji: '👑',
        kosul: '125000 ml toplam',
    },

    // Özel Rozetler
    {
        id: 'ilk_hedef',
        isim: 'İlk Başarı',
        aciklama: 'İlk kez günlük hedefini tamamla',
        emoji: '🎯',
        kosul: 'İlk hedef tamamlama',
    },
    {
        id: 'sabahci',
        isim: 'Erken Kuş',
        aciklama: 'Sabah 8\'den önce su iç',
        emoji: '🌅',
        kosul: 'Sabah erken su içme',
    },
    {
        id: 'gece_baykusu',
        isim: 'Gece Baykuşu',
        aciklama: 'Gece 11\'den sonra su iç',
        emoji: '🦉',
        kosul: 'Gece geç su içme',
    },
    {
        id: 'rekor_kirici',
        isim: 'Rekor Kırıcı',
        aciklama: 'Kişisel rekorunu kır',
        emoji: '🚀',
        kosul: 'Yeni rekor',
    },
];

// --- STORAGE KEY ---
const ROZET_KEY = '@rozetler';

// --- FONKSİYONLAR ---

/**
 * Rozet durumunu yükle
 */
export async function rozetleriYukle(): Promise<RozetDurumu> {
    try {
        const kayitli = await AsyncStorage.getItem(ROZET_KEY);
        if (kayitli) {
            const durum: RozetDurumu = JSON.parse(kayitli);

            // Tanımdan güncel bilgileri al, kayıtlıdan kazanılma durumunu al
            const guncelRozetler = ROZET_TANIMLARI.map(tanim => {
                const kayitliRozet = durum.rozetler.find(r => r.id === tanim.id);
                return {
                    ...tanim,
                    kazanildi: kayitliRozet ? kayitliRozet.kazanildi : false,
                    kazanilmaTarihi: kayitliRozet ? kayitliRozet.kazanilmaTarihi : undefined
                };
            });

            return {
                ...durum,
                rozetler: guncelRozetler
            };
        }
    } catch (hata) {
        console.error('Rozetler yüklenemedi:', hata);
    }

    // Varsayılan: Tüm rozetler kazanılmamış
    const varsayilanRozetler: Rozet[] = ROZET_TANIMLARI.map(r => ({
        ...r,
        kazanildi: false,
    }));

    return {
        rozetler: varsayilanRozetler,
        toplamKazanilan: 0,
    };
}

/**
 * Rozet durumunu kaydet
 */
export async function rozetleriKaydet(durum: RozetDurumu): Promise<void> {
    try {
        await AsyncStorage.setItem(ROZET_KEY, JSON.stringify(durum));
    } catch (hata) {
        console.error('Rozetler kaydedilemedi:', hata);
    }
}

/**
 * Belirli bir rozeti kazan
 */
export async function rozetKazan(rozetId: string): Promise<Rozet | null> {
    const durum = await rozetleriYukle();
    const rozetIndex = durum.rozetler.findIndex(r => r.id === rozetId);

    if (rozetIndex === -1) return null;

    // Zaten kazanılmışsa null dön
    if (durum.rozetler[rozetIndex].kazanildi) return null;

    // Rozeti kazanılmış olarak işaretle
    durum.rozetler[rozetIndex].kazanildi = true;
    durum.rozetler[rozetIndex].kazanilmaTarihi = new Date().toISOString();
    durum.toplamKazanilan += 1;

    await rozetleriKaydet(durum);

    return durum.rozetler[rozetIndex];
}

/**
 * Streak'e göre rozet kontrolü
 */
export async function streakRozetKontrol(streak: number): Promise<Rozet | null> {
    if (streak >= 30) return await rozetKazan('streak_30');
    if (streak >= 14) return await rozetKazan('streak_14');
    if (streak >= 7) return await rozetKazan('streak_7');
    if (streak >= 3) return await rozetKazan('streak_3');
    return null;
}

/**
 * Toplam ml'ye göre rozet kontrolü
 */
export async function toplamRozetKontrol(toplamMl: number): Promise<Rozet | null> {
    if (toplamMl >= 125000) return await rozetKazan('toplam_125000');
    if (toplamMl >= 25000) return await rozetKazan('toplam_25000');
    if (toplamMl >= 12500) return await rozetKazan('toplam_12500');
    if (toplamMl >= 2500) return await rozetKazan('toplam_2500');
    return null;
}

/**
 * Saat bazlı rozet kontrolü
 */
export async function saatRozetKontrol(): Promise<Rozet | null> {
    const saat = new Date().getHours();

    if (saat < 8) {
        return await rozetKazan('sabahci');
    }
    if (saat >= 23) {
        return await rozetKazan('gece_baykusu');
    }
    return null;
}

/**
 * İlk hedef tamamlama rozeti
 */
export async function ilkHedefRozetKontrol(): Promise<Rozet | null> {
    return await rozetKazan('ilk_hedef');
}

/**
 * Rekor kırma rozeti
 */
export async function rekorRozetKontrol(): Promise<Rozet | null> {
    return await rozetKazan('rekor_kirici');
}

/**
 * Kazanılan rozet sayısını getir
 */
export async function kazanilanRozetSayisi(): Promise<number> {
    const durum = await rozetleriYukle();
    return durum.toplamKazanilan;
}
