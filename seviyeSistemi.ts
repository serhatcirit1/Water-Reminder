// ============================================
// SEVİYE VE XP SİSTEMİ
// ============================================
// Kullanıcı XP kazanarak seviye atlar

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SABİTLER ---
const SEVIYE_KEY = '@seviye_sistemi';

// Her seviye için gereken XP (kümülatif değil, o seviye için gereken)
const SEVIYE_XP_GEREKSINIMLERI = [
    0,      // Seviye 1 (başlangıç)
    100,    // Seviye 2
    200,    // Seviye 3
    350,    // Seviye 4
    500,    // Seviye 5
    700,    // Seviye 6
    1000,   // Seviye 7
    1400,   // Seviye 8
    1900,   // Seviye 9
    2500,   // Seviye 10
    3200,   // Seviye 11
    4000,   // Seviye 12
    5000,   // Seviye 13
    6200,   // Seviye 14
    7600,   // Seviye 15
    9200,   // Seviye 16
    11000,  // Seviye 17
    13000,  // Seviye 18
    15500,  // Seviye 19
    18500,  // Seviye 20
];

// --- TİPLER ---
export interface SeviyeDurumu {
    seviye: number;
    toplamXP: number;
    mevcutSeviyeXP: number; // Bu seviyede kazanılan XP
    sonrakiSeviyeXP: number; // Sonraki seviye için gereken XP
    unvan: string;
}

// --- UNVANLAR ---
const UNVANLAR = [
    'levels.lvl_1',
    'levels.lvl_2',
    'levels.lvl_3',
    'levels.lvl_4',
    'levels.lvl_5',
    'levels.lvl_6',
    'levels.lvl_7',
    'levels.lvl_8',
    'levels.lvl_9',
    'levels.lvl_10',
    'levels.lvl_11',
    'levels.lvl_12',
    'levels.lvl_13',
    'levels.lvl_14',
    'levels.lvl_15',
    'levels.lvl_16',
    'levels.lvl_17',
    'levels.lvl_18',
    'levels.lvl_19',
    'levels.lvl_20',
];

// --- XP KAZANIM TABLOSU ---
export const XP_KAZANIMLARI = {
    SU_ICME: 10,              // Her su içmede
    HEDEF_TAMAMLAMA: 50,      // Günlük hedef tamamlama
    STREAK_3: 30,             // 3 günlük streak
    STREAK_7: 75,             // 7 günlük streak
    ROZET_KAZANMA: 25,        // Rozet kazanma
    SABAH_SU: 15,             // Sabah erken su içme
    REKOR_KIRMA: 100,         // Yeni rekor
};

// --- FONKSİYONLAR ---

/**
 * Seviye durumunu yükle
 */
export async function seviyeDurumuYukle(): Promise<SeviyeDurumu> {
    try {
        const kayitli = await AsyncStorage.getItem(SEVIYE_KEY);
        if (kayitli) {
            const durum = JSON.parse(kayitli);
            return hesaplaSeviyeDurumu(durum.toplamXP);
        }
    } catch (hata) {
        console.error('Seviye durumu yüklenemedi:', hata);
    }
    return hesaplaSeviyeDurumu(0);
}

/**
 * XP'ye göre seviye durumunu hesapla
 */
function hesaplaSeviyeDurumu(toplamXP: number): SeviyeDurumu {
    let seviye = 1;
    let kalanXP = toplamXP;

    // Seviye hesapla
    for (let i = 1; i < SEVIYE_XP_GEREKSINIMLERI.length; i++) {
        if (kalanXP >= SEVIYE_XP_GEREKSINIMLERI[i]) {
            kalanXP -= SEVIYE_XP_GEREKSINIMLERI[i];
            seviye++;
        } else {
            break;
        }
    }

    // Max seviye kontrolü
    if (seviye > 20) seviye = 20;

    const sonrakiSeviyeXP = seviye < 20
        ? SEVIYE_XP_GEREKSINIMLERI[seviye]
        : SEVIYE_XP_GEREKSINIMLERI[19];

    return {
        seviye,
        toplamXP,
        mevcutSeviyeXP: kalanXP,
        sonrakiSeviyeXP,
        unvan: UNVANLAR[seviye - 1] || UNVANLAR[19],
    };
}

/**
 * Seviye durumunu kaydet
 */
async function seviyeDurumuKaydet(toplamXP: number): Promise<void> {
    try {
        await AsyncStorage.setItem(SEVIYE_KEY, JSON.stringify({ toplamXP }));
    } catch (hata) {
        console.error('Seviye durumu kaydedilemedi:', hata);
    }
}

/**
 * XP ekle ve seviye atlama kontrolü yap
 */
export async function xpEkle(miktar: number): Promise<{ yeniDurum: SeviyeDurumu; seviyeAtladi: boolean; eskiSeviye: number }> {
    const eskiDurum = await seviyeDurumuYukle();
    const yeniToplamXP = eskiDurum.toplamXP + miktar;

    await seviyeDurumuKaydet(yeniToplamXP);

    const yeniDurum = await seviyeDurumuYukle();
    const seviyeAtladi = yeniDurum.seviye > eskiDurum.seviye;

    return {
        yeniDurum,
        seviyeAtladi,
        eskiSeviye: eskiDurum.seviye,
    };
}

/**
 * Su içme XP'si ekle
 */
export async function suIcmeXP(): Promise<{ yeniDurum: SeviyeDurumu; seviyeAtladi: boolean }> {
    const sonuc = await xpEkle(XP_KAZANIMLARI.SU_ICME);
    return { yeniDurum: sonuc.yeniDurum, seviyeAtladi: sonuc.seviyeAtladi };
}

/**
 * Hedef tamamlama XP'si ekle
 */
export async function hedefTamamlamaXP(): Promise<{ yeniDurum: SeviyeDurumu; seviyeAtladi: boolean }> {
    const sonuc = await xpEkle(XP_KAZANIMLARI.HEDEF_TAMAMLAMA);
    return { yeniDurum: sonuc.yeniDurum, seviyeAtladi: sonuc.seviyeAtladi };
}
