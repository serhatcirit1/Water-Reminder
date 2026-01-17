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
        isim: 'badges.streak_3',
        aciklama: 'badges.streak_3_desc',
        emoji: '🌱',
        kosul: 'badges.streak_3_condition',
    },
    {
        id: 'streak_7',
        isim: 'badges.streak_7',
        aciklama: 'badges.streak_7_desc',
        emoji: '🔥',
        kosul: 'badges.streak_7_condition',
    },
    {
        id: 'streak_14',
        isim: 'badges.streak_14',
        aciklama: 'badges.streak_14_desc',
        emoji: '⭐',
        kosul: 'badges.streak_14_condition',
    },
    {
        id: 'streak_30',
        isim: 'badges.streak_30',
        aciklama: 'badges.streak_30_desc',
        emoji: '🏆',
        kosul: 'badges.streak_30_condition',
    },
    {
        id: 'streak_60',
        isim: 'badges.streak_60',
        aciklama: 'badges.streak_60_desc',
        emoji: '💎',
        kosul: 'badges.streak_60_condition',
    },
    {
        id: 'streak_100',
        isim: 'badges.streak_100',
        aciklama: 'badges.streak_100_desc',
        emoji: '👑',
        kosul: 'badges.streak_100_condition',
    },

    // Toplam Su Rozetleri
    {
        id: 'toplam_2500',
        isim: 'badges.toplam_2500',
        aciklama: 'badges.toplam_2500_desc',
        emoji: '💧',
        kosul: 'badges.toplam_2500_condition',
    },
    {
        id: 'toplam_12500',
        isim: 'badges.toplam_12500',
        aciklama: 'badges.toplam_12500_desc',
        emoji: '🌊',
        kosul: 'badges.toplam_12500_condition',
    },
    {
        id: 'toplam_25000',
        isim: 'badges.toplam_25000',
        aciklama: 'badges.toplam_25000_desc',
        emoji: '🐳',
        kosul: 'badges.toplam_25000_condition',
    },
    {
        id: 'toplam_100000',
        isim: 'badges.toplam_100000',
        aciklama: 'badges.toplam_100000_desc',
        emoji: '🌟',
        kosul: 'badges.toplam_100000_condition',
    },
    {
        id: 'toplam_200000',
        isim: 'badges.toplam_200000',
        aciklama: 'badges.toplam_200000_desc',
        emoji: '⚡',
        kosul: 'badges.toplam_200000_condition',
    },
    {
        id: 'toplam_500000',
        isim: 'badges.toplam_500000',
        aciklama: 'badges.toplam_500000_desc',
        emoji: '💸',
        kosul: 'badges.toplam_500000_condition',
    },
    {
        id: 'toplam_1000000',
        isim: 'badges.toplam_1000000',
        aciklama: 'badges.toplam_1000000_desc',
        emoji: '🌈',
        kosul: 'badges.toplam_1000000_condition',
    },

    // Özel Rozetler
    {
        id: 'ilk_hedef',
        isim: 'badges.ilk_hedef',
        aciklama: 'badges.ilk_hedef_desc',
        emoji: '🎯',
        kosul: 'badges.ilk_hedef_condition',
    },
    {
        id: 'sabahci',
        isim: 'badges.sabahci',
        aciklama: 'badges.sabahci_desc',
        emoji: '🌅',
        kosul: 'badges.sabahci_condition',
    },
    {
        id: 'gece_baykusu',
        isim: 'badges.gece_baykusu',
        aciklama: 'badges.gece_baykusu_desc',
        emoji: '🦉',
        kosul: 'badges.gece_baykusu_condition',
    },
    {
        id: 'rekor_kirici',
        isim: 'badges.rekor_kirici',
        aciklama: 'badges.rekor_kirici_desc',
        emoji: '🚀',
        kosul: 'badges.rekor_kirici_condition',
    },
    {
        id: 'gece_kusu',
        isim: 'badges.gece_kusu',
        aciklama: 'badges.gece_kusu_desc',
        emoji: '🌙',
        kosul: 'badges.gece_kusu_condition',
    },
    {
        id: 'ogle_sansi',
        isim: 'badges.ogle_sansi',
        aciklama: 'badges.ogle_sansi_desc',
        emoji: '☀️',
        kosul: 'badges.ogle_sansi_condition',
    },
    {
        id: 'mukemmeliyetci',
        isim: 'badges.mukemmeliyetci',
        aciklama: 'badges.mukemmeliyetci_desc',
        emoji: '💯',
        kosul: 'badges.mukemmeliyetci_condition',
    },
    {
        id: 'maraton',
        isim: 'badges.maraton',
        aciklama: 'badges.maraton_desc',
        emoji: '🏃',
        kosul: 'badges.maraton_condition',
    },
    {
        id: 'hafta_sonu_savascisi',
        isim: 'badges.hafta_sonu_savascisi',
        aciklama: 'badges.hafta_sonu_savascisi_desc',
        emoji: '🎖️',
        kosul: 'badges.hafta_sonu_savascisi_condition',
    },
    {
        id: 'saglik_sampiyonu',
        isim: 'badges.saglik_sampiyonu',
        aciklama: 'badges.saglik_sampiyonu_desc',
        emoji: '🥇',
        kosul: 'badges.saglik_sampiyonu_condition',
    },
    {
        id: 'hiz_icici',
        isim: 'badges.hiz_icici',
        aciklama: 'badges.hiz_icici_desc',
        emoji: '⚡',
        kosul: 'badges.hiz_icici_condition',
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
    if (streak >= 100) return await rozetKazan('streak_100');
    if (streak >= 60) return await rozetKazan('streak_60');
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
    if (toplamMl >= 1000000) return await rozetKazan('toplam_1000000');
    if (toplamMl >= 500000) return await rozetKazan('toplam_500000');
    if (toplamMl >= 200000) return await rozetKazan('toplam_200000');
    if (toplamMl >= 100000) return await rozetKazan('toplam_100000');
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
 * Tüm rozetleri genel bir şekilde kontrol et (Su eklendiğinde çağrılır)
 */
export async function tumRozetleriKontrolEt(
    mevcutStreak: number,
    gunlukToplamMl: number,
    yeniRekorMu: boolean
): Promise<Rozet[]> {
    const kazanilanlar: Rozet[] = [];

    // 1. Streak Kontrol
    const sRozet = await streakRozetKontrol(mevcutStreak);
    if (sRozet) kazanilanlar.push(sRozet);

    // 2. Toplam Su Kontrol
    try {
        const gecmisStr = await AsyncStorage.getItem('@su_gecmisi');
        if (gecmisStr) {
            const gecmis = JSON.parse(gecmisStr);
            let toplamMl = 0;
            Object.values(gecmis).forEach((v: any) => {
                toplamMl += v.ml || (v.miktar * 250) || (typeof v === 'number' ? v * 250 : 0);
            });
            const tRozet = await toplamRozetKontrol(toplamMl);
            if (tRozet) kazanilanlar.push(tRozet);
        }
    } catch (e) { }

    // 3. Saat Kontrol
    const saRozet = await saatRozetKontrol();
    if (saRozet) kazanilanlar.push(saRozet);

    // 4. Rekor Kontrol
    if (yeniRekorMu) {
        const rRozet = await rekorRozetKontrol();
        if (rRozet) kazanilanlar.push(rRozet);
    }

    // 5. İlk Hedef Kontrol
    if (gunlukToplamMl >= 2000) { // Varsayılan hedef eşiği
        const iRozet = await ilkHedefRozetKontrol();
        if (iRozet) kazanilanlar.push(iRozet);
    }

    return kazanilanlar;
}

/**
 * Kazanılan rozet sayısını getir
 */
export async function kazanilanRozetSayisi(): Promise<number> {
    const durum = await rozetleriYukle();
    return durum.toplamKazanilan;
}
