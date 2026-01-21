// ============================================
// SU FAYDALARI - Sağlık Bilgileri Sistemi
// ============================================
// Her su içme sonrası gösterilecek bilimsel temelli motivasyonel mesajlar
// Kaynaklar: NIH, CDC, Mayo Clinic, Harvard Health, Healthline

import i18n from './locales/i18n';

// Fayda türleri - bilimsel kategorilere göre
type FaydaTuru =
    // Beyin ve Zihin
    | 'beyin_konsantrasyon'
    | 'beyin_hafiza'
    | 'beyin_mood'
    // Fiziksel Performans
    | 'enerji_yorgunluk'
    | 'enerji_performans'
    | 'kas_oksijen'
    // Cilt ve Güzellik
    | 'cilt_nem'
    | 'cilt_elastikiyet'
    | 'cilt_toksin'
    // Sindirim Sistemi
    | 'sindirim_metabolizma'
    | 'sindirim_kabizlik'
    | 'sindirim_besin'
    // Böbrekler ve Detoks
    | 'bobrek_tas'
    | 'bobrek_toksin'
    | 'bobrek_idrar'
    // Kalp ve Dolaşım
    | 'kalp_kan'
    | 'kalp_basinc'
    | 'kalp_oksijen'
    // Eklemler ve Kemikler
    | 'eklem_yag'
    | 'eklem_kikirdag'
    // Kilo Kontrolü
    | 'kilo_tokluk'
    | 'kilo_metabolizma'
    // Bağışıklık
    | 'bagisiklik_mukoza'
    | 'bagisiklik_lenf'
    // Vücut Isısı
    | 'sicaklik_ter'
    | 'sicaklik_duzenleme'
    // Baş Ağrısı
    | 'basagrisi_onleme'
    | 'basagrisi_migren';

interface SuFaydasi {
    tur: FaydaTuru;
    icon: string;
    minMl: number;
    maxMl: number;
}

// Su miktarına göre bilimsel faydalar
const FAYDALAR: SuFaydasi[] = [
    // 0-300ml (İlk bardak - sabah)
    { tur: 'beyin_konsantrasyon', icon: '🧠', minMl: 0, maxMl: 300 },
    { tur: 'enerji_yorgunluk', icon: '⚡', minMl: 0, maxMl: 300 },
    { tur: 'sindirim_metabolizma', icon: '🔥', minMl: 0, maxMl: 300 },

    // 300-600ml
    { tur: 'beyin_hafiza', icon: '💡', minMl: 300, maxMl: 600 },
    { tur: 'cilt_nem', icon: '💧', minMl: 300, maxMl: 600 },
    { tur: 'sindirim_besin', icon: '🍃', minMl: 300, maxMl: 600 },

    // 600-1000ml
    { tur: 'beyin_mood', icon: '😊', minMl: 600, maxMl: 1000 },
    { tur: 'cilt_elastikiyet', icon: '✨', minMl: 600, maxMl: 1000 },
    { tur: 'bobrek_toksin', icon: '🧹', minMl: 600, maxMl: 1000 },
    { tur: 'kilo_tokluk', icon: '�', minMl: 600, maxMl: 1000 },

    // 1000-1500ml
    { tur: 'kas_oksijen', icon: '💪', minMl: 1000, maxMl: 1500 },
    { tur: 'cilt_toksin', icon: '🌟', minMl: 1000, maxMl: 1500 },
    { tur: 'bobrek_tas', icon: '�️', minMl: 1000, maxMl: 1500 },
    { tur: 'kalp_kan', icon: '❤️', minMl: 1000, maxMl: 1500 },
    { tur: 'sindirim_kabizlik', icon: '🌿', minMl: 1000, maxMl: 1500 },

    // 1500-2000ml
    { tur: 'enerji_performans', icon: '🏃', minMl: 1500, maxMl: 2000 },
    { tur: 'eklem_yag', icon: '🦴', minMl: 1500, maxMl: 2000 },
    { tur: 'bagisiklik_mukoza', icon: '🛡️', minMl: 1500, maxMl: 2000 },
    { tur: 'kalp_oksijen', icon: '🫀', minMl: 1500, maxMl: 2000 },
    { tur: 'basagrisi_onleme', icon: '😌', minMl: 1500, maxMl: 2000 },

    // 2000-2500ml
    { tur: 'bobrek_idrar', icon: '💎', minMl: 2000, maxMl: 2500 },
    { tur: 'kalp_basinc', icon: '💓', minMl: 2000, maxMl: 2500 },
    { tur: 'eklem_kikirdag', icon: '🔗', minMl: 2000, maxMl: 2500 },
    { tur: 'bagisiklik_lenf', icon: '🌊', minMl: 2000, maxMl: 2500 },
    { tur: 'kilo_metabolizma', icon: '⚡', minMl: 2000, maxMl: 2500 },

    // 2500ml+ (Üst düzey hidrasyon)
    { tur: 'sicaklik_duzenleme', icon: '�️', minMl: 2500, maxMl: 4000 },
    { tur: 'basagrisi_migren', icon: '🧘', minMl: 2500, maxMl: 4000 },
];

/**
 * Su miktarına göre bilimsel sağlık faydası mesajı döndür
 * @param toplamMl - Bugün içilen toplam su (ml)
 * @returns Fayda mesajı ve icon
 */
export function suFaydasiAl(toplamMl: number): { mesaj: string; icon: string } {
    // Miktara uygun faydaları filtrele
    const uygunFaydalar = FAYDALAR.filter(
        f => toplamMl >= f.minMl && toplamMl <= f.maxMl
    );

    // Eğer uygun fayda yoksa, alt aralıklardan seç
    const secilecekFaydalar = uygunFaydalar.length > 0
        ? uygunFaydalar
        : FAYDALAR.filter(f => toplamMl >= f.minMl);

    if (secilecekFaydalar.length === 0) {
        return {
            icon: '💧',
            mesaj: i18n.t('benefits.default', { amount: formatMiktar(toplamMl) })
        };
    }

    // Rastgele bir fayda seç
    const secilen = secilecekFaydalar[Math.floor(Math.random() * secilecekFaydalar.length)];

    // Miktar formatla
    const miktarStr = formatMiktar(toplamMl);

    // Çeviri anahtarını al
    const mesaj = i18n.t(`benefits.${secilen.tur}`, { amount: miktarStr });

    return {
        icon: secilen.icon,
        mesaj: mesaj
    };
}

/**
 * ml'yi okunabilir formata çevir
 */
function formatMiktar(ml: number): string {
    if (ml >= 1000) {
        const litre = (ml / 1000).toFixed(1);
        return litre.endsWith('.0') ? litre.slice(0, -2) + 'L' : litre + 'L';
    }
    return ml + 'ml';
}

/**
 * Hedef tamamlandığında özel mesaj
 */
export function hedefTamamlandiMesaji(): { mesaj: string; icon: string } {
    return {
        icon: '🏆',
        mesaj: i18n.t('benefits.goalComplete')
    };
}

/**
 * Streak özel mesajı
 */
export function streakMesaji(gunSayisi: number): { mesaj: string; icon: string } {
    return {
        icon: '🔥',
        mesaj: i18n.t('benefits.streak', { days: gunSayisi })
    };
}
