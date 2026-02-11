// ============================================
// AI UTILS - Akıllı Özellikler
// ============================================
// On-Device AI: Dinamik hedef, içgörü ve tahmin sistemi

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HavaDurumuVerisi } from './havaDurumu';
import i18n from './locales/i18n';

// --- SABİTLER ---
const AI_AYAR_KEY = '@ai_ayarlari';
const GECMIS_KEY = '@su_gecmisi';

// --- TİPLER ---
export interface AIHedefOnerisi {
    onerilenHedef: number;      // ml
    tabanaHedef: number;        // Kullanıcının manuel hedefi
    artisYuzdesi: number;       // %0-100
    sebepler: string[];         // Neden bu hedef önerildi
    mesaj: string;              // Kullanıcıya gösterilecek mesaj
    icon: string;               // Emoji
}

export interface AISuIcmeVerisi {
    tarih: string;
    miktar: number;
    ml: number;
    saat?: number;
}

export interface AIAyarlari {
    aktif: boolean;             // AI önerileri açık mı
    otomatikHedef: boolean;     // Hedefi otomatik güncelle
    bildirimleriGoster: boolean;
}

// --- VARSAYILAN AYARLAR ---
const VARSAYILAN_AI_AYAR: AIAyarlari = {
    aktif: true,
    otomatikHedef: false,   // Varsayılan: kullanıcıya sor
    bildirimleriGoster: true,
};

// --- AKILLI HEDEF MOTORU ---

/**
 * Sıcaklığa göre ekstra su ihtiyacını hesapla
 * 25°C üstü her 5°C için +250ml
 */
function sicaklikFaktoru(sicaklik: number): { ekstraMl: number; sebep: string | null } {
    if (sicaklik >= 35) {
        return { ekstraMl: 750, sebep: i18n.t('ai.reasons.hot', { temp: sicaklik, amount: 750 }) };
    } else if (sicaklik >= 30) {
        return { ekstraMl: 500, sebep: i18n.t('ai.reasons.warm', { temp: sicaklik, amount: 500 }) };
    } else if (sicaklik >= 25) {
        return { ekstraMl: 250, sebep: i18n.t('ai.reasons.mild', { temp: sicaklik, amount: 250 }) };
    }
    return { ekstraMl: 0, sebep: null };
}

/**
 * Aktiviteye göre ekstra su ihtiyacını hesapla
 * Her 5000 adım için +200ml
 */
function aktiviteFaktoru(adimSayisi: number): { ekstraMl: number; sebep: string | null } {
    if (adimSayisi >= 15000) {
        return { ekstraMl: 600, sebep: i18n.t('ai.reasons.active_very', { steps: adimSayisi.toLocaleString(), amount: 600 }) };
    } else if (adimSayisi >= 10000) {
        return { ekstraMl: 400, sebep: i18n.t('ai.reasons.active', { steps: adimSayisi.toLocaleString(), amount: 400 }) };
    } else if (adimSayisi >= 5000) {
        return { ekstraMl: 200, sebep: i18n.t('ai.reasons.active_moderate', { steps: adimSayisi.toLocaleString(), amount: 200 }) };
    }
    return { ekstraMl: 0, sebep: null };
}

/**
 * Geçmiş verilere göre ortalama içme miktarını hesapla
 */
async function gecmisOrtalama(): Promise<{ ortMl: number; gunSayisi: number }> {
    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (!gecmisStr) return { ortMl: 0, gunSayisi: 0 };

        const gecmis = JSON.parse(gecmisStr);
        const veriler: number[] = [];

        // Son 7 günün verilerini al
        const bugun = new Date();
        for (let i = 1; i <= 7; i++) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];

            const veri = gecmis[tarihStr];
            if (veri) {
                // Hem eski (number) hem yeni (object) formatı destekle
                const ml = typeof veri === 'object' ? veri.ml : veri * 250;
                veriler.push(ml);
            }
        }

        if (veriler.length === 0) return { ortMl: 0, gunSayisi: 0 };

        const toplam = veriler.reduce((a, b) => a + b, 0);
        return { ortMl: Math.round(toplam / veriler.length), gunSayisi: veriler.length };
    } catch {
        return { ortMl: 0, gunSayisi: 0 };
    }
}

/**
 * Hafta içi/sonu faktörü
 * Hafta sonları genellikle daha az hareket
 */
function haftaGunuFaktoru(): { carpan: number; sebep: string | null } {
    const gun = new Date().getDay();
    const haftaSonu = gun === 0 || gun === 6;

    if (haftaSonu) {
        return { carpan: 0.9, sebep: i18n.t('ai.reasons.weekend') };
    }
    return { carpan: 1, sebep: null };
}

/**
 * Ana fonksiyon: Akıllı hedef hesapla
 */
export async function akilliHedefHesapla(
    tabanaHedef: number,
    havaDurumu: HavaDurumuVerisi | null,
    adimSayisi: number = 0
): Promise<AIHedefOnerisi> {
    const sebepler: string[] = [];
    let ekstraMl = 0;

    // 1. Sıcaklık faktörü
    if (havaDurumu) {
        const sicaklik = sicaklikFaktoru(havaDurumu.sicaklik);
        if (sicaklik.sebep) {
            ekstraMl += sicaklik.ekstraMl;
            sebepler.push(sicaklik.sebep);
        }
    }

    // 2. Aktivite faktörü
    const aktivite = aktiviteFaktoru(adimSayisi);
    if (aktivite.sebep) {
        ekstraMl += aktivite.ekstraMl;
        sebepler.push(aktivite.sebep);
    }

    // 3. Hafta günü faktörü
    const haftaGunu = haftaGunuFaktoru();
    if (haftaGunu.sebep) {
        sebepler.push(haftaGunu.sebep);
    }

    // 4. Geçmiş performans analizi
    const gecmis = await gecmisOrtalama();
    if (gecmis.gunSayisi >= 3 && gecmis.ortMl < tabanaHedef * 0.7) {
        // Kullanıcı hedefin %70'inden azını içiyorsa uyar
        sebepler.push(i18n.t('ai.reasons.low_intake', { days: gecmis.gunSayisi, avg: gecmis.ortMl }));
    }

    // Hesaplamalar
    let onerilenHedef = Math.round((tabanaHedef + ekstraMl) * haftaGunu.carpan);

    // Min-Max sınırları: %80 - %150 arası
    onerilenHedef = Math.max(tabanaHedef * 0.8, Math.min(tabanaHedef * 1.5, onerilenHedef));
    onerilenHedef = Math.round(onerilenHedef / 100) * 100; // 100'e yuvarla

    const artisYuzdesi = Math.round(((onerilenHedef - tabanaHedef) / tabanaHedef) * 100);

    // Mesaj oluştur
    let mesaj = '';
    let icon = '🤖';

    if (artisYuzdesi > 0) {
        mesaj = i18n.t('ai.suggestion.increase', { old: tabanaHedef, new: onerilenHedef, percent: artisYuzdesi });
        icon = '📈';
    } else if (artisYuzdesi < 0) {
        mesaj = i18n.t('ai.suggestion.decrease', { new: onerilenHedef });
        icon = '📉';
    } else {
        mesaj = i18n.t('ai.suggestion.ok', { target: tabanaHedef });
        icon = '✅';
    }

    if (sebepler.length === 0) {
        sebepler.push(i18n.t('ai.suggestion.standard'));
    }

    return {
        onerilenHedef,
        tabanaHedef,
        artisYuzdesi,
        sebepler,
        mesaj,
        icon,
    };
}

// --- AI AYARLARI ---

export async function aiAyarlariniYukle(): Promise<AIAyarlari> {
    try {
        const kayitli = await AsyncStorage.getItem(AI_AYAR_KEY);
        if (kayitli) {
            return { ...VARSAYILAN_AI_AYAR, ...JSON.parse(kayitli) };
        }
        return VARSAYILAN_AI_AYAR;
    } catch {
        return VARSAYILAN_AI_AYAR;
    }
}

export async function aiAyarlariniKaydet(ayarlar: Partial<AIAyarlari>): Promise<void> {
    try {
        const mevcut = await aiAyarlariniYukle();
        const yeni = { ...mevcut, ...ayarlar };
        await AsyncStorage.setItem(AI_AYAR_KEY, JSON.stringify(yeni));
    } catch (e) {
        console.error('AI ayarları kaydedilemedi:', e);
    }
}

// --- YARDIMCI FONKSİYONLAR ---

/**
 * Basit lineer regresyon ile trend hesapla
 * Pozitif = yukarı trend, Negatif = aşağı trend
 */
export function trendHesapla(veriler: number[]): { egim: number; yorum: string } {
    if (veriler.length < 2) {
        return { egim: 0, yorum: i18n.t('ai.trend.insufficient') };
    }

    const n = veriler.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += veriler[i];
        sumXY += i * veriler[i];
        sumX2 += i * i;
    }

    const egim = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    let yorum = '';
    if (egim > 50) {
        yorum = i18n.t('ai.trend.up_great');
    } else if (egim > 0) {
        yorum = i18n.t('ai.trend.up');
    } else if (egim < -50) {
        yorum = i18n.t('ai.trend.down_warning');
    } else if (egim < 0) {
        yorum = i18n.t('ai.trend.down');
    } else {
        yorum = i18n.t('ai.trend.steady');
    }

    return { egim: Math.round(egim), yorum };
}

// ============================================
// INSIGHT GENERATOR - Kişiselleştirilmiş İçgörü
// ============================================

export interface AIIcgoru {
    id: string;
    mesaj: string;
    icon: string;
    oncelik: 'yuksek' | 'orta' | 'dusuk';
    kategori: 'zaman' | 'gun' | 'performans' | 'oneri';
}

// AI İçgörü için AYRI key - ayarlarUtils.ts'deki ile çakışmasın
const AI_SU_ICME_SAATLERI_KEY = '@ai_su_icme_saatleri';

/**
 * Su içme saatlerini kaydet (her su içildiğinde çağrılır)
 */
export async function suIcmeSaatiKaydet(saat: number, gun: number): Promise<void> {
    try {
        const kayitliStr = await AsyncStorage.getItem(AI_SU_ICME_SAATLERI_KEY);
        let kayitlar: { saat: number; gun: number; tarih: string }[] = [];

        if (kayitliStr) {
            try {
                const parsed = JSON.parse(kayitliStr);
                // Tip kontrolü: dizi mi değil mi?
                if (Array.isArray(parsed)) {
                    kayitlar = parsed;
                } else {
                    // Eski format veya bozuk veri - sıfırdan başla

                    kayitlar = [];
                }
            } catch {
                // JSON parse hatası - sıfırdan başla
                kayitlar = [];
            }
        }

        // Son 30 günlük veriyi tut
        const simdi = Date.now();
        const otuzGunOnce = simdi - 30 * 24 * 60 * 60 * 1000;
        kayitlar = kayitlar.filter(k => k && k.tarih && new Date(k.tarih).getTime() > otuzGunOnce);

        // Yeni kayıt ekle
        kayitlar.push({
            saat,
            gun,
            tarih: new Date().toISOString()
        });

        await AsyncStorage.setItem(AI_SU_ICME_SAATLERI_KEY, JSON.stringify(kayitlar));
    } catch (e) {
        console.error('Su içme saati kaydedilemedi:', e);
    }
}

/**
 * En az su içilen saat aralığını bul
 */
async function enAzIcilenSaatAraligi(): Promise<{ aralik: string; yuzdeFark: number } | null> {
    try {
        const kayitliStr = await AsyncStorage.getItem(AI_SU_ICME_SAATLERI_KEY);
        if (!kayitliStr) return null;

        const kayitlar: { saat: number; gun: number }[] = JSON.parse(kayitliStr);
        if (kayitlar.length < 20) return null; // Yeterli veri yok

        // Saatleri 4'lük bloklara ayır (00-04, 04-08, 08-12, 12-16, 16-20, 20-24)
        const bloklar: { [key: string]: number } = {
            '06:00-10:00': 0,
            '10:00-14:00': 0,
            '14:00-18:00': 0,
            '18:00-22:00': 0,
        };

        kayitlar.forEach(k => {
            if (k.saat >= 6 && k.saat < 10) bloklar['06:00-10:00']++;
            else if (k.saat >= 10 && k.saat < 14) bloklar['10:00-14:00']++;
            else if (k.saat >= 14 && k.saat < 18) bloklar['14:00-18:00']++;
            else if (k.saat >= 18 && k.saat < 22) bloklar['18:00-22:00']++;
        });

        const toplam = Object.values(bloklar).reduce((a, b) => a + b, 0);
        if (toplam === 0) return null;

        // En az içilen bloğu bul
        let minBlok = '';
        let minDeger = Infinity;
        Object.entries(bloklar).forEach(([blok, deger]) => {
            if (deger < minDeger) {
                minDeger = deger;
                minBlok = blok;
            }
        });

        const ortalama = toplam / Object.keys(bloklar).length;
        const yuzdeFark = Math.round(((ortalama - minDeger) / ortalama) * 100);

        if (yuzdeFark >= 30) {
            return { aralik: minBlok, yuzdeFark };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Hafta içi vs hafta sonu karşılaştırması
 */
async function haftaSonuKarsilastirmasi(): Promise<{ fark: number; dusukMu: boolean } | null> {
    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (!gecmisStr) return null;

        const gecmis = JSON.parse(gecmisStr);
        const haftaIciMl: number[] = [];
        const haftaSonuMl: number[] = [];

        // Son 30 günü analiz et
        const bugun = new Date();
        for (let i = 1; i <= 30; i++) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];
            const gun = tarih.getDay();

            const veri = gecmis[tarihStr];
            if (veri) {
                const ml = typeof veri === 'object' ? veri.ml : veri * 250;
                if (gun === 0 || gun === 6) {
                    haftaSonuMl.push(ml);
                } else {
                    haftaIciMl.push(ml);
                }
            }
        }

        if (haftaIciMl.length < 5 || haftaSonuMl.length < 2) return null;

        const haftaIciOrt = haftaIciMl.reduce((a, b) => a + b, 0) / haftaIciMl.length;
        const haftaSonuOrt = haftaSonuMl.reduce((a, b) => a + b, 0) / haftaSonuMl.length;

        const fark = Math.round(((haftaIciOrt - haftaSonuOrt) / haftaIciOrt) * 100);

        if (Math.abs(fark) >= 15) {
            return { fark: Math.abs(fark), dusukMu: fark > 0 };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * En verimli gün analizi
 */
async function enVerimliGun(): Promise<{ gun: string; ortalama: number } | null> {
    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (!gecmisStr) return null;

        const gecmis = JSON.parse(gecmisStr);
        const gunler: { [key: number]: number[] } = {
            0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };

        const gunAdlari = getLocalizedDayNames();

        // Son 60 günü analiz et
        const bugun = new Date();
        for (let i = 1; i <= 60; i++) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];
            const gun = tarih.getDay();

            const veri = gecmis[tarihStr];
            if (veri) {
                const ml = typeof veri === 'object' ? veri.ml : veri * 250;
                gunler[gun].push(ml);
            }
        }

        // En yüksek ortalamaya sahip günü bul
        let maxGun = -1;
        let maxOrt = 0;

        for (let i = 0; i < 7; i++) {
            if (gunler[i].length >= 3) {
                const ort = gunler[i].reduce((a, b) => a + b, 0) / gunler[i].length;
                if (ort > maxOrt) {
                    maxOrt = ort;
                    maxGun = i;
                }
            }
        }

        if (maxGun >= 0 && maxOrt > 0) {
            return { gun: gunAdlari[maxGun], ortalama: Math.round(maxOrt) };
        }
        return null;
    } catch {
        return null;
    }
}

// ============================================
// YENİ İÇGÖRÜ FONKSİYONLARI
// ============================================

/**
 * Event listener sistemi - gerçek zamanlı güncelleme için
 */
type InsightListener = () => void;
const insightListeners: InsightListener[] = [];

export function addInsightListener(listener: InsightListener): () => void {
    insightListeners.push(listener);
    return () => {
        const index = insightListeners.indexOf(listener);
        if (index > -1) insightListeners.splice(index, 1);
    };
}

export function notifyInsightListeners(): void {
    insightListeners.forEach(listener => listener());
}

/**
 * Streak Analizi - Mevcut seri vs rekor
 */
async function streakAnalizi(): Promise<{ mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null> {
    try {
        const streakStr = await AsyncStorage.getItem('@streak');
        const enUzunStreakStr = await AsyncStorage.getItem('@en_uzun_streak');

        const streak = streakStr ? parseInt(streakStr, 10) : 0;
        const enUzunStreak = enUzunStreakStr ? parseInt(enUzunStreakStr, 10) : 0;

        if (streak <= 0) return null;

        // Rekora yaklaşıyor mu?
        if (enUzunStreak > 0 && streak >= enUzunStreak - 2 && streak < enUzunStreak) {
            return {
                mesaj: i18n.t('ai.insights.streak_close', { current: streak, record: enUzunStreak, remaining: enUzunStreak - streak }),
                icon: '🔥',
                oncelik: 'yuksek'
            };
        }

        // Yeni rekor kırdı mı?
        if (streak > enUzunStreak && streak > 3) {
            return {
                mesaj: i18n.t('ai.insights.streak_new_record', { streak }),
                icon: '🏆',
                oncelik: 'yuksek'
            };
        }

        // Milestone'lara yakın mı?
        const milestones = [7, 14, 30, 60, 100];
        for (const milestone of milestones) {
            if (streak >= milestone - 2 && streak < milestone) {
                return {
                    mesaj: i18n.t('ai.insights.streak_milestone', { current: streak, target: milestone, remaining: milestone - streak }),
                    icon: '🎯',
                    oncelik: 'orta'
                };
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Sabah Rutini Analizi
 */
async function sabahRutiniAnalizi(): Promise<{ mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null> {
    try {
        const kayitliStr = await AsyncStorage.getItem(AI_SU_ICME_SAATLERI_KEY);
        if (!kayitliStr) return null;

        const kayitlar: { saat: number; gun: number; tarih: string }[] = JSON.parse(kayitliStr);
        if (!Array.isArray(kayitlar) || kayitlar.length < 14) return null;

        // Son 7 günü analiz et
        const simdi = Date.now();
        const yediGunOnce = simdi - 7 * 24 * 60 * 60 * 1000;
        const sonYediGun = kayitlar.filter(k => k.tarih && new Date(k.tarih).getTime() > yediGunOnce);

        // Her gün için sabah 9'dan önce su içilip içilmediğini kontrol et
        const gunler = new Set<string>();
        const sabahIcilenGunler = new Set<string>();

        sonYediGun.forEach(k => {
            const tarih = k.tarih.split('T')[0];
            gunler.add(tarih);
            if (k.saat < 9) {
                sabahIcilenGunler.add(tarih);
            }
        });

        if (gunler.size < 5) return null;

        const sabahOrani = (sabahIcilenGunler.size / gunler.size) * 100;

        if (sabahOrani < 30) {
            return {
                mesaj: i18n.t('ai.insights.morning_low', { percent: Math.round(sabahOrani) }),
                icon: '🌅',
                oncelik: 'orta'
            };
        } else if (sabahOrani >= 80) {
            return {
                mesaj: i18n.t('ai.insights.morning_great', { percent: Math.round(sabahOrani) }),
                icon: '☀️',
                oncelik: 'dusuk'
            };
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * En Aktif Saat Analizi
 */
async function enAktifSaatAnalizi(): Promise<{ mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null> {
    try {
        const kayitliStr = await AsyncStorage.getItem(AI_SU_ICME_SAATLERI_KEY);
        if (!kayitliStr) return null;

        const kayitlar: { saat: number; gun: number }[] = JSON.parse(kayitliStr);
        if (!Array.isArray(kayitlar) || kayitlar.length < 30) return null;

        // Saat bazında sayım
        const saatSayim: { [key: number]: number } = {};
        for (let i = 6; i <= 22; i++) saatSayim[i] = 0;

        kayitlar.forEach(k => {
            if (k.saat >= 6 && k.saat <= 22) {
                saatSayim[k.saat]++;
            }
        });

        // En aktif saati bul
        let maxSaat = 0;
        let maxDeger = 0;
        Object.entries(saatSayim).forEach(([saat, deger]) => {
            if (deger > maxDeger) {
                maxDeger = deger;
                maxSaat = parseInt(saat);
            }
        });

        if (maxDeger < 5) return null;

        return {
            mesaj: i18n.t('ai.insights.active_hour', { hour: maxSaat }),
            icon: '⏰',
            oncelik: 'dusuk'
        };
    } catch {
        return null;
    }
}

/**
 * Haftalık Hedef İlerlemesi
 */
async function haftalikHedefIlerlemesi(gunlukHedef: number): Promise<{ mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null> {
    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (!gecmisStr) return null;

        const gecmis = JSON.parse(gecmisStr);
        const bugun = new Date();
        const haftaninGunu = bugun.getDay(); // 0=Pazar

        // Bu haftaki tüketimi hesapla
        let haftaToplam = 0;
        let gunSayisi = 0;

        for (let i = 0; i <= haftaninGunu; i++) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];

            const veri = gecmis[tarihStr];
            if (veri) {
                const ml = typeof veri === 'object' ? veri.ml : veri * 250;
                haftaToplam += ml;
                gunSayisi++;
            }
        }

        if (gunSayisi < 1) return null;

        const haftalikHedef = gunlukHedef * 7;
        const ilerlemeYuzde = Math.round((haftaToplam / haftalikHedef) * 100);
        const kalanGun = 7 - haftaninGunu;

        // Final sprint - Cuma, Cumartesi, Pazar
        if (haftaninGunu >= 5 && ilerlemeYuzde < 70) {
            const kalanMl = haftalikHedef - haftaToplam;
            return {
                mesaj: i18n.t('ai.insights.weekly_sprint', { percent: ilerlemeYuzde, remaining: Math.round(kalanMl / 1000) }),
                icon: '🏃',
                oncelik: 'yuksek'
            };
        }

        // İyi gidiyor
        if (ilerlemeYuzde >= 80 && haftaninGunu >= 4) {
            return {
                mesaj: i18n.t('ai.insights.weekly_great', { percent: ilerlemeYuzde }),
                icon: '🌟',
                oncelik: 'dusuk'
            };
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Kişisel Rekor Yakınlığı
 */
async function kisiselRekorYakinligi(bugunIcilen: number): Promise<{ mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null> {
    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (!gecmisStr) return null;

        const gecmis = JSON.parse(gecmisStr);
        let maxMl = 0;

        // Tüm geçmişte en yüksek günü bul
        Object.values(gecmis).forEach((veri: any) => {
            const ml = typeof veri === 'object' ? veri.ml : veri * 250;
            if (ml > maxMl) maxMl = ml;
        });

        if (maxMl < 1000) return null;

        // Bugün rekora yakın mı?
        const fark = maxMl - bugunIcilen;

        if (fark > 0 && fark <= 500 && bugunIcilen >= maxMl * 0.8) {
            return {
                mesaj: i18n.t('ai.insights.record_close', { remaining: fark, record: maxMl }),
                icon: '🎖️',
                oncelik: 'yuksek'
            };
        }

        // Bugün yeni rekor kırdı mı?
        if (bugunIcilen > maxMl && bugunIcilen > 1500) {
            return {
                mesaj: i18n.t('ai.insights.record_broken', { amount: bugunIcilen }),
                icon: '🏆',
                oncelik: 'yuksek'
            };
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Ay Karşılaştırması
 */
async function ayKarsilastirmasi(): Promise<{ mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null> {
    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (!gecmisStr) return null;

        const gecmis = JSON.parse(gecmisStr);
        const bugun = new Date();
        const buAy = bugun.getMonth();
        const buYil = bugun.getFullYear();

        let buAyToplam = 0;
        let buAyGun = 0;
        let gecenAyToplam = 0;
        let gecenAyGun = 0;

        Object.entries(gecmis).forEach(([tarihStr, veri]: [string, any]) => {
            const tarih = new Date(tarihStr);
            const ml = typeof veri === 'object' ? veri.ml : veri * 250;

            if (tarih.getMonth() === buAy && tarih.getFullYear() === buYil) {
                buAyToplam += ml;
                buAyGun++;
            } else if (
                (tarih.getMonth() === buAy - 1 && tarih.getFullYear() === buYil) ||
                (buAy === 0 && tarih.getMonth() === 11 && tarih.getFullYear() === buYil - 1)
            ) {
                gecenAyToplam += ml;
                gecenAyGun++;
            }
        });

        if (buAyGun < 5 || gecenAyGun < 10) return null;

        const buAyOrt = buAyToplam / buAyGun;
        const gecenAyOrt = gecenAyToplam / gecenAyGun;
        const farkYuzde = Math.round(((buAyOrt - gecenAyOrt) / gecenAyOrt) * 100);

        if (farkYuzde >= 10) {
            return {
                mesaj: i18n.t('ai.insights.month_better', { percent: farkYuzde }),
                icon: '📈',
                oncelik: 'dusuk'
            };
        } else if (farkYuzde <= -15) {
            return {
                mesaj: i18n.t('ai.insights.month_worse', { percent: Math.abs(farkYuzde) }),
                icon: '📉',
                oncelik: 'orta'
            };
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Bugünkü İlerleme Durumu
 */
function bugunIlerleme(bugunIcilen: number, gunlukHedef: number): { mesaj: string; icon: string; oncelik: 'yuksek' | 'orta' | 'dusuk' } | null {
    const saat = new Date().getHours();
    const yuzde = Math.round((bugunIcilen / gunlukHedef) * 100);

    // Öğlenden sonra ve hedefin yarısına ulaşılmamış
    if (saat >= 14 && saat < 18 && yuzde < 40) {
        return {
            mesaj: i18n.t('ai.insights.today_behind', { percent: yuzde }),
            icon: '⚠️',
            oncelik: 'yuksek'
        };
    }

    // Akşam ve hedef tamamlanmak üzere
    if (saat >= 18 && yuzde >= 80 && yuzde < 100) {
        const kalanMl = gunlukHedef - bugunIcilen;
        return {
            mesaj: i18n.t('ai.insights.today_almost', { remaining: kalanMl }),
            icon: '💪',
            oncelik: 'orta'
        };
    }

    // Hedef aşıldı
    if (yuzde >= 120) {
        return {
            mesaj: i18n.t('ai.insights.today_exceeded', { percent: yuzde }),
            icon: '🎉',
            oncelik: 'dusuk'
        };
    }

    return null;
}

/**
 * Ana fonksiyon: Tüm içgörüleri üret
 * @param bugunIcilen - Bugün içilen su miktarı (ml) - gerçek zamanlı için
 * @param gunlukHedef - Günlük hedef (ml) - gerçek zamanlı için
 */
export async function icgorulerUret(bugunIcilen: number = 0, gunlukHedef: number = 2500): Promise<AIIcgoru[]> {
    const icgoruler: AIIcgoru[] = [];

    // ============================================
    // YÜKSEK ÖNCELİKLİ İÇGÖRÜLER (Aksiyon gerektirenler)
    // ============================================

    // 1. Bugünkü ilerleme durumu (gerçek zamanlı)
    const bugunDurum = bugunIlerleme(bugunIcilen, gunlukHedef);
    if (bugunDurum) {
        icgoruler.push({
            id: 'bugun_ilerleme',
            mesaj: bugunDurum.mesaj,
            icon: bugunDurum.icon,
            oncelik: bugunDurum.oncelik,
            kategori: 'performans'
        });
    }

    // 2. Kişisel rekor yakınlığı (gerçek zamanlı)
    const rekor = await kisiselRekorYakinligi(bugunIcilen);
    if (rekor) {
        icgoruler.push({
            id: 'rekor_yakinlik',
            mesaj: rekor.mesaj,
            icon: rekor.icon,
            oncelik: rekor.oncelik,
            kategori: 'performans'
        });
    }

    // 3. Streak analizi
    const streak = await streakAnalizi();
    if (streak) {
        icgoruler.push({
            id: 'streak_analiz',
            mesaj: streak.mesaj,
            icon: streak.icon,
            oncelik: streak.oncelik,
            kategori: 'performans'
        });
    }

    // 4. Haftalık hedef ilerlemesi
    const haftalik = await haftalikHedefIlerlemesi(gunlukHedef);
    if (haftalik) {
        icgoruler.push({
            id: 'haftalik_ilerleme',
            mesaj: haftalik.mesaj,
            icon: haftalik.icon,
            oncelik: haftalik.oncelik,
            kategori: 'performans'
        });
    }

    // ============================================
    // ORTA ÖNCELİKLİ İÇGÖRÜLER (Farkındalık)
    // ============================================

    // 5. En az içilen saat aralığı
    const saatAnalizi = await enAzIcilenSaatAraligi();
    if (saatAnalizi) {
        icgoruler.push({
            id: 'saat_analizi',
            mesaj: i18n.t('ai.insights.time_analysis', { range: saatAnalizi.aralik, percent: saatAnalizi.yuzdeFark }),
            icon: '⏰',
            oncelik: 'yuksek',
            kategori: 'zaman'
        });
    }

    // 6. Hafta sonu karşılaştırması
    const haftaSonu = await haftaSonuKarsilastirmasi();
    if (haftaSonu && haftaSonu.dusukMu) {
        icgoruler.push({
            id: 'hafta_sonu',
            mesaj: i18n.t('ai.insights.weekend_analysis', { percent: haftaSonu.fark }),
            icon: '📅',
            oncelik: 'orta',
            kategori: 'gun'
        });
    }

    // 7. Sabah rutini analizi
    const sabah = await sabahRutiniAnalizi();
    if (sabah) {
        icgoruler.push({
            id: 'sabah_rutini',
            mesaj: sabah.mesaj,
            icon: sabah.icon,
            oncelik: sabah.oncelik,
            kategori: 'zaman'
        });
    }

    // 8. Ay karşılaştırması
    const ay = await ayKarsilastirmasi();
    if (ay) {
        icgoruler.push({
            id: 'ay_karsilastirma',
            mesaj: ay.mesaj,
            icon: ay.icon,
            oncelik: ay.oncelik,
            kategori: 'performans'
        });
    }

    // ============================================
    // DÜŞÜK ÖNCELİKLİ İÇGÖRÜLER (Bilgi)
    // ============================================

    // 9. En verimli gün
    const verimliGun = await enVerimliGun();
    if (verimliGun) {
        icgoruler.push({
            id: 'verimli_gun',
            mesaj: i18n.t('ai.insights.productive_day', { day: verimliGun.gun, avg: verimliGun.ortalama }),
            icon: '🏆',
            oncelik: 'dusuk',
            kategori: 'performans'
        });
    }

    // 10. En aktif saat
    const aktifSaat = await enAktifSaatAnalizi();
    if (aktifSaat) {
        icgoruler.push({
            id: 'aktif_saat',
            mesaj: aktifSaat.mesaj,
            icon: aktifSaat.icon,
            oncelik: aktifSaat.oncelik,
            kategori: 'zaman'
        });
    }

    // 11. Trend analizi
    const gecmis = await gecmisOrtalama();
    if (gecmis.gunSayisi >= 5) {
        try {
            const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
            if (gecmisStr) {
                const gecmisData = JSON.parse(gecmisStr);
                const veriler: number[] = [];
                const bugun = new Date();

                for (let i = 7; i >= 1; i--) {
                    const tarih = new Date(bugun);
                    tarih.setDate(tarih.getDate() - i);
                    const tarihStr = tarih.toISOString().split('T')[0];
                    const veri = gecmisData[tarihStr];
                    if (veri) {
                        const ml = typeof veri === 'object' ? veri.ml : veri * 250;
                        veriler.push(ml);
                    }
                }

                if (veriler.length >= 4) {
                    const trend = trendHesapla(veriler);
                    if (trend.egim !== 0) {
                        icgoruler.push({
                            id: 'trend',
                            mesaj: trend.yorum,
                            icon: trend.egim > 0 ? '📈' : '📉',
                            oncelik: Math.abs(trend.egim) > 50 ? 'yuksek' : 'orta',
                            kategori: 'performans'
                        });
                    }
                }
            }
        } catch { }
    }

    // Önceliğe göre sırala
    icgoruler.sort((a, b) => {
        const oncelikSira = { yuksek: 0, orta: 1, dusuk: 2 };
        return oncelikSira[a.oncelik] - oncelikSira[b.oncelik];
    });

    // En fazla 5 içgörü döndür (çok fazla olmasın)
    return icgoruler.slice(0, 5);
}

// ============================================
// TREND TAHMİNİ (FORECASTING)
// ============================================

export interface AITahmin {
    tamamlanmaGunu: string | null;      // "Cuma" veya null
    tamamlanmaOlasiligi: number;        // 0-100
    mesaj: string;
    icon: string;
    gunlukOrtalama: number;
    haftalikHedef: number;
    mevcutToplam: number;
}

// Helper fonksiyon: Lokalize gün isimleri
function getLocalizedDayNames(): string[] {
    return [
        i18n.t('common.days.sunday'),
        i18n.t('common.days.monday'),
        i18n.t('common.days.tuesday'),
        i18n.t('common.days.wednesday'),
        i18n.t('common.days.thursday'),
        i18n.t('common.days.friday'),
        i18n.t('common.days.saturday')
    ];
}

/**
 * Haftalık hedef tamamlama tahmini hesapla
 * "Bu hızla gidersen, haftalık hedefini X günü tamamlayacaksın!"
 */
export async function haftalikTahminHesapla(
    gunlukHedef: number,
    bugunIcilen: number
): Promise<AITahmin> {
    const bugun = new Date();
    const bugunGun = bugun.getDay(); // 0=Pazar, 6=Cumartesi

    // Haftalık hedef = günlük hedef * 7
    const haftalikHedef = gunlukHedef * 7;

    // Bu haftanın başından itibaren toplam içilen
    let haftaBasiToplam = bugunIcilen;

    try {
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        if (gecmisStr) {
            const gecmis = JSON.parse(gecmisStr);

            // Bu haftanın önceki günlerinin verilerini al
            for (let i = 1; i <= bugunGun; i++) {
                const tarih = new Date(bugun);
                tarih.setDate(tarih.getDate() - i);
                const tarihStr = tarih.toISOString().split('T')[0];

                const veri = gecmis[tarihStr];
                if (veri) {
                    const ml = typeof veri === 'object' ? veri.ml : veri * 250;
                    haftaBasiToplam += ml;
                }
            }
        }
    } catch {
        // Hata durumunda sadece bugünün verisini kullan
    }

    // Kaç gün geçti (bugün dahil)
    const gecenGunSayisi = bugunGun + 1; // Pazar=1, Pazartesi=2, ...

    // Günlük ortalama (bu hafta)
    const gunlukOrtalama = gecenGunSayisi > 0 ? Math.round(haftaBasiToplam / gecenGunSayisi) : 0;

    // Kalan gün sayısı (bugün hariç)
    const kalanGun = 7 - gecenGunSayisi;

    // Tahmini hafta sonu toplamı
    const tahminiToplam = haftaBasiToplam + (gunlukOrtalama * kalanGun);

    // Tamamlanma olasılığı
    const tamamlanmaOlasiligi = Math.min(100, Math.round((tahminiToplam / haftalikHedef) * 100));

    // Hedefi hangi gün tamamlayacak?
    let tamamlanmaGunu: string | null = null;
    let mesaj = '';
    let icon = '📊';

    const GUN_ADLARI = getLocalizedDayNames();

    if (haftaBasiToplam >= haftalikHedef) {
        // Zaten tamamlandı
        tamamlanmaGunu = GUN_ADLARI[bugunGun];
        mesaj = i18n.t('ai.forecast.complete_already');
        icon = '🏆';
    } else if (gunlukOrtalama > 0) {
        // Kaç gün sonra tamamlanacak hesapla
        const kalanMl = haftalikHedef - haftaBasiToplam;
        const kalanGunTahmini = Math.ceil(kalanMl / gunlukOrtalama);

        if (kalanGunTahmini <= kalanGun) {
            // Bu hafta içinde tamamlanabilir
            const tamamlanmaGunIndex = (bugunGun + kalanGunTahmini) % 7;
            tamamlanmaGunu = GUN_ADLARI[tamamlanmaGunIndex];
            mesaj = i18n.t('ai.forecast.on_track', { day: tamamlanmaGunu });
            icon = '📈';
        } else {
            // Bu hafta tamamlanamayacak
            mesaj = i18n.t('ai.forecast.behind');
            icon = '⚠️';
        }
    } else {
        mesaj = i18n.t('ai.forecast.insufficient');
        icon = '💧';
    }

    return {
        tamamlanmaGunu,
        tamamlanmaOlasiligi,
        mesaj,
        icon,
        gunlukOrtalama,
        haftalikHedef,
        mevcutToplam: haftaBasiToplam
    };
}

/**
 * Gelecek hafta tahmini
 */
export async function gelecekHaftaTahmini(gunlukHedef: number): Promise<string> {
    const gecmis = await gecmisOrtalama();

    if (gecmis.gunSayisi < 5) {
        return i18n.t('ai.forecast.next_week_insufficient');
    }

    const haftalikHedef = gunlukHedef * 7;
    const tahminiHaftalik = gecmis.ortMl * 7;

    const basariOrani = Math.round((tahminiHaftalik / haftalikHedef) * 100);

    if (basariOrani >= 100) {
        return i18n.t('ai.forecast.next_week_great', { amount: Math.round(tahminiHaftalik) });
    } else if (basariOrani >= 80) {
        return i18n.t('ai.forecast.next_week_good', { percent: basariOrani });
    } else {
        return i18n.t('ai.forecast.next_week_hard', { amount: gunlukHedef - gecmis.ortMl });
    }
}

// ============================================
// AKILLI HATIRLATMA (ADAPTIVE REMINDERS)
// ============================================

const BILDIRIM_TEPKI_KEY = '@bildirim_tepkileri';
const OPTIMAL_SAATLER_KEY = '@optimal_hatirlatma_saatleri';

export interface BildirimTepkisi {
    saat: number;           // Bildirimin gönderildiği saat
    tepkiVerildi: boolean;  // Kullanıcı 30 dakika içinde su içti mi
    tarih: string;
}

export interface OptimalSaatler {
    enIyiSaatler: number[];     // En etkili bildirim saatleri
    kacinilacakSaatler: number[]; // Tepki alınmayan saatler
    sonGuncelleme: string;
}

/**
 * Bildirim tepkisini kaydet
 * Bildirim gönderildiğinde çağrılır
 */
export async function bildirimGonderildiKaydet(saat: number): Promise<void> {
    try {
        const kayitliStr = await AsyncStorage.getItem(BILDIRIM_TEPKI_KEY);
        let tepkiler: BildirimTepkisi[] = [];

        if (kayitliStr) {
            try {
                const parsed = JSON.parse(kayitliStr);
                if (Array.isArray(parsed)) {
                    tepkiler = parsed;
                }
            } catch { }
        }

        // Son 30 günün verisini tut
        const simdi = Date.now();
        const otuzGunOnce = simdi - 30 * 24 * 60 * 60 * 1000;
        tepkiler = tepkiler.filter(t => t.tarih && new Date(t.tarih).getTime() > otuzGunOnce);

        // Yeni bildirim kaydı (henüz tepki yok)
        tepkiler.push({
            saat,
            tepkiVerildi: false,
            tarih: new Date().toISOString()
        });

        await AsyncStorage.setItem(BILDIRIM_TEPKI_KEY, JSON.stringify(tepkiler));

    } catch (e) {
        console.error('Bildirim tepki kaydı başarısız:', e);
    }
}

/**
 * Su içildiğinde son bildirimi "tepki verildi" olarak işaretle
 * 30 dakika içindeki son bildirimi günceller
 */
export async function bildirimTepkisiKaydet(): Promise<void> {
    try {
        const kayitliStr = await AsyncStorage.getItem(BILDIRIM_TEPKI_KEY);
        if (!kayitliStr) return;

        let tepkiler: BildirimTepkisi[] = JSON.parse(kayitliStr);
        if (!Array.isArray(tepkiler)) return;

        const simdi = Date.now();
        const otuzDakikaOnce = simdi - 30 * 60 * 1000;

        // Son 30 dakika içindeki bildirimleri "tepki verildi" olarak işaretle
        let guncellendi = false;
        tepkiler = tepkiler.map(t => {
            const tepkiZamani = new Date(t.tarih).getTime();
            if (!t.tepkiVerildi && tepkiZamani > otuzDakikaOnce) {
                guncellendi = true;
                return { ...t, tepkiVerildi: true };
            }
            return t;
        });

        if (guncellendi) {
            await AsyncStorage.setItem(BILDIRIM_TEPKI_KEY, JSON.stringify(tepkiler));

        }
    } catch (e) {
        console.error('Bildirim tepkisi kaydedilemedi:', e);
    }
}

/**
 * Optimal bildirim saatlerini hesapla
 * En çok tepki alınan saatleri bulur
 */
export async function optimalSaatleriHesapla(): Promise<OptimalSaatler> {
    const varsayilan: OptimalSaatler = {
        enIyiSaatler: [9, 12, 15, 18], // Varsayılan saatler
        kacinilacakSaatler: [],
        sonGuncelleme: new Date().toISOString()
    };

    try {
        const kayitliStr = await AsyncStorage.getItem(BILDIRIM_TEPKI_KEY);
        if (!kayitliStr) return varsayilan;

        const tepkiler: BildirimTepkisi[] = JSON.parse(kayitliStr);
        if (!Array.isArray(tepkiler) || tepkiler.length < 10) {
            return varsayilan; // Yeterli veri yok
        }

        // Saatlere göre tepki oranlarını hesapla
        const saatIstatistik: { [saat: number]: { toplam: number; tepkili: number } } = {};

        for (let i = 6; i <= 22; i++) {
            saatIstatistik[i] = { toplam: 0, tepkili: 0 };
        }

        tepkiler.forEach(t => {
            if (t.saat >= 6 && t.saat <= 22) {
                saatIstatistik[t.saat].toplam++;
                if (t.tepkiVerildi) {
                    saatIstatistik[t.saat].tepkili++;
                }
            }
        });

        // Tepki oranına göre sırala
        const saatListesi: { saat: number; oran: number }[] = [];
        for (let saat = 6; saat <= 22; saat++) {
            const stat = saatIstatistik[saat];
            if (stat.toplam >= 3) { // En az 3 bildirim gönderilmiş olmalı
                const oran = stat.tepkili / stat.toplam;
                saatListesi.push({ saat, oran });
            }
        }

        saatListesi.sort((a, b) => b.oran - a.oran);

        // En iyi 4 saat
        const enIyiSaatler = saatListesi
            .filter(s => s.oran >= 0.3) // En az %30 tepki oranı
            .slice(0, 4)
            .map(s => s.saat);

        // Kaçınılacak saatler (%10 altında tepki)
        const kacinilacakSaatler = saatListesi
            .filter(s => s.oran < 0.1)
            .map(s => s.saat);

        const sonuc: OptimalSaatler = {
            enIyiSaatler: enIyiSaatler.length >= 2 ? enIyiSaatler : varsayilan.enIyiSaatler,
            kacinilacakSaatler,
            sonGuncelleme: new Date().toISOString()
        };

        // Kaydet
        await AsyncStorage.setItem(OPTIMAL_SAATLER_KEY, JSON.stringify(sonuc));
        return sonuc;
    } catch {
        return varsayilan;
    }
}

/**
 * Kayıtlı optimal saatleri yükle
 */
export async function optimalSaatleriYukle(): Promise<OptimalSaatler> {
    try {
        const kayitliStr = await AsyncStorage.getItem(OPTIMAL_SAATLER_KEY);
        if (kayitliStr) {
            return JSON.parse(kayitliStr);
        }
    } catch { }

    return {
        enIyiSaatler: [9, 12, 15, 18],
        kacinilacakSaatler: [],
        sonGuncelleme: new Date().toISOString()
    };
}

/**
 * Bir sonraki optimal bildirim saatini hesapla
 */
export async function sonrakiOptimalSaat(): Promise<{ saat: number; aciklama: string }> {
    const optSaatler = await optimalSaatleriYukle();
    const simdi = new Date();
    const suankiSaat = simdi.getHours();

    // Bugün için bir sonraki optimal saat
    for (const saat of optSaatler.enIyiSaatler.sort((a, b) => a - b)) {
        if (saat > suankiSaat && !optSaatler.kacinilacakSaatler.includes(saat)) {
            return {
                saat,
                aciklama: i18n.t('ai.adaptive.best_hour', { hour: saat })
            };
        }
    }

    // Bugün için uygun saat kalmadı, yarın ilk optimal saat
    const yarinIlkSaat = optSaatler.enIyiSaatler.sort((a, b) => a - b)[0] || 9;
    return {
        saat: yarinIlkSaat,
        aciklama: i18n.t('ai.adaptive.tomorrow_optimal', { hour: yarinIlkSaat })
    };
}

/**
 * AI öğrenme durumunu al
 */
export async function adaptifOgrenimDurumu(): Promise<{
    toplamTepki: number;
    tepkiOrani: number;
    ogrenmeYuzdesi: number;
    mesaj: string;
}> {
    try {
        const kayitliStr = await AsyncStorage.getItem(BILDIRIM_TEPKI_KEY);
        if (!kayitliStr) {
            return {
                toplamTepki: 0,
                tepkiOrani: 0,
                ogrenmeYuzdesi: 0,
                mesaj: '🎯 Henüz veri toplanıyor...'
            };
        }

        const tepkiler: BildirimTepkisi[] = JSON.parse(kayitliStr);
        if (!Array.isArray(tepkiler)) {
            return {
                toplamTepki: 0,
                tepkiOrani: 0,
                ogrenmeYuzdesi: 0,
                mesaj: '🎯 Henüz veri toplanıyor...'
            };
        }

        const toplamTepki = tepkiler.length;
        const pozitifTepki = tepkiler.filter(t => t.tepkiVerildi).length;
        const tepkiOrani = toplamTepki > 0 ? Math.round((pozitifTepki / toplamTepki) * 100) : 0;

        // Öğrenme yüzdesi: 30+ veri için %100
        const ogrenmeYuzdesi = Math.min(100, Math.round((toplamTepki / 30) * 100));

        let mesaj = '';
        if (ogrenmeYuzdesi < 30) {
            mesaj = i18n.t('ai.adaptive.learning');
        } else if (tepkiOrani >= 70) {
            mesaj = i18n.t('ai.adaptive.great');
        } else if (tepkiOrani >= 40) {
            mesaj = i18n.t('ai.adaptive.finding');
        } else {
            mesaj = i18n.t('ai.adaptive.optimizing');
        }

        return { toplamTepki, tepkiOrani, ogrenmeYuzdesi, mesaj };
    } catch {
        return {
            toplamTepki: 0,
            tepkiOrani: 0,
            ogrenmeYuzdesi: 0,
            mesaj: '🎯 Henüz veri toplanıyor...'
        };
    }
}

