// ============================================
// AYARLAR UTILS
// ============================================
// Kullanıcı ayarlarını yönetir (günlük hedef vb.)

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SABİTLER ---
const HEDEF_KEY = '@gunluk_hedef';
const VARSAYILAN_HEDEF = 2000; // ml cinsinden

// --- TİPLER ---
export interface KullaniciAyarlari {
    gunlukHedef: number;
}

// --- FONKSİYONLAR ---

/**
 * Günlük hedefi kaydet
 */
export async function hedefKaydet(hedef: number): Promise<void> {
    try {
        await AsyncStorage.setItem(HEDEF_KEY, hedef.toString());
    } catch (hata) {
        console.error('Hedef kaydedilemedi:', hata);
    }
}

/**
 * Günlük hedefi yükle
 */
export async function hedefYukle(): Promise<number> {
    try {
        const kayitliHedef = await AsyncStorage.getItem(HEDEF_KEY);
        if (kayitliHedef !== null) {
            return parseInt(kayitliHedef, 10);
        }
        return VARSAYILAN_HEDEF;
    } catch (hata) {
        console.error('Hedef yüklenemedi:', hata);
        return VARSAYILAN_HEDEF;
    }
}

// Hedef seçenekleri (ml cinsinden)
export const HEDEF_SECENEKLERI = [1500, 2000, 2500, 3000, 3500];

// --- BARDAK BOYUTU SİSTEMİ ---
const BARDAK_KEY = '@bardak_boyutu';
const VARSAYILAN_BARDAK = 250; // ml

export interface BardakSecenegi {
    ml: number;
    etiket: string;
}

export const BARDAK_SECENEKLERI: BardakSecenegi[] = [
    { ml: 200, etiket: '200 ml' },
    { ml: 250, etiket: '250 ml' },
    { ml: 330, etiket: '330 ml' },
    { ml: 500, etiket: '500 ml' },
];

/**
 * Bardak boyutunu kaydet
 */
export async function bardakBoyutuKaydet(boyut: number): Promise<void> {
    try {
        await AsyncStorage.setItem(BARDAK_KEY, boyut.toString());
    } catch (hata) {
        console.error('Bardak boyutu kaydedilemedi:', hata);
    }
}

/**
 * Bardak boyutunu yükle
 */
export async function bardakBoyutuYukle(): Promise<number> {
    try {
        const kayitliBoyut = await AsyncStorage.getItem(BARDAK_KEY);
        if (kayitliBoyut !== null) {
            return parseInt(kayitliBoyut, 10);
        }
        return VARSAYILAN_BARDAK;
    } catch (hata) {
        console.error('Bardak boyutu yüklenemedi:', hata);
        return VARSAYILAN_BARDAK;
    }
}

// --- ŞİŞE BOYUTU SİSTEMİ ---
const SISE_KEY = '@sise_boyutu';
const VARSAYILAN_SISE = 500; // ml

export interface SiseSecenegi {
    ml: number;
    etiket: string;
}

export const SISE_SECENEKLERI: SiseSecenegi[] = [
    { ml: 330, etiket: '330 ml' },
    { ml: 500, etiket: '500 ml' },
    { ml: 750, etiket: '750 ml' },
    { ml: 1000, etiket: '1 L' },
    { ml: 1500, etiket: '1.5 L' },
];

/**
 * Şişe boyutunu kaydet
 */
export async function siseBoyutuKaydet(boyut: number): Promise<void> {
    try {
        await AsyncStorage.setItem(SISE_KEY, boyut.toString());
    } catch (hata) {
        console.error('Şişe boyutu kaydedilemedi:', hata);
    }
}

/**
 * Şişe boyutunu yükle
 */
export async function siseBoyutuYukle(): Promise<number> {
    try {
        const kayitliBoyut = await AsyncStorage.getItem(SISE_KEY);
        if (kayitliBoyut !== null) {
            return parseInt(kayitliBoyut, 10);
        }
        return VARSAYILAN_SISE;
    } catch (hata) {
        console.error('Şişe boyutu yüklenemedi:', hata);
        return VARSAYILAN_SISE;
    }
}


// --- KİŞİSELLEŞTİRİLMİŞ HEDEF SİSTEMİ ---
const PROFIL_KEY = '@kullanici_profil';

export interface KullaniciProfil {
    kilo: number;      // kg
    yas: number;       // yıl
    aktifMi: boolean;  // aktif yaşam tarzı mı
}

const VARSAYILAN_PROFIL: KullaniciProfil = {
    kilo: 70,
    yas: 30,
    aktifMi: false,
};

export async function profilKaydet(profil: KullaniciProfil): Promise<void> {
    try {
        await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    } catch (hata) {
        console.error('Profil kaydedilemedi:', hata);
    }
}

export async function profilYukle(): Promise<KullaniciProfil> {
    try {
        const kayitli = await AsyncStorage.getItem(PROFIL_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
        return VARSAYILAN_PROFIL;
    } catch (hata) {
        console.error('Profil yüklenemedi:', hata);
        return VARSAYILAN_PROFIL;
    }
}

/**
 * Kilo ve yaşa göre önerilen günlük su miktarını hesapla
 * Formül: Kilo x 30-35ml = günlük ml
 * Aktif kişiler için +500ml
 */
export function onerilenSuHesapla(profil: KullaniciProfil, bardakBoyutu: number): number {
    // Temel: kilo x 33ml
    let gunlukMl = profil.kilo * 33;

    // Yaşa göre ayarlama (50+ yaş için biraz azalt)
    if (profil.yas >= 50) {
        gunlukMl = profil.kilo * 30;
    }

    // Aktif yaşam için ekstra
    if (profil.aktifMi) {
        gunlukMl += 500;
    }

    // Bardak sayısına çevir ve yuvarla
    const bardakSayisi = Math.round(gunlukMl / bardakBoyutu);

    // Min 4, max 15 bardak
    return Math.max(4, Math.min(15, bardakSayisi));
}

// --- REKOR SİSTEMİ ---
const REKOR_KEY = '@en_iyi_gun';

export interface RekorBilgisi {
    miktar: number;
    ml: number; // Toplam ml
    tarih: string;
}

/**
 * Rekor kaydet (eğer mevcut rekordan yüksekse - ml bazlı)
 */
export async function rekorKontrolEt(miktar: number, ml: number): Promise<boolean> {
    try {
        const mevcutRekor = await rekorYukle();
        // Ml bazında kontrol et (daha doğru), yoksa miktar bazında
        const mevcutMl = mevcutRekor.ml || (mevcutRekor.miktar * 250);

        if (ml > mevcutMl) {
            const yeniRekor: RekorBilgisi = {
                miktar,
                ml,
                tarih: new Date().toISOString().split('T')[0],
            };
            await AsyncStorage.setItem(REKOR_KEY, JSON.stringify(yeniRekor));
            return true; // Yeni rekor!
        }
        return false;
    } catch (hata) {
        console.error('Rekor kaydedilemedi:', hata);
        return false;
    }
}

/**
 * Rekor yükle
 */
export async function rekorYukle(): Promise<RekorBilgisi> {
    try {
        const kayitliRekor = await AsyncStorage.getItem(REKOR_KEY);
        if (kayitliRekor !== null) {
            const rekor = JSON.parse(kayitliRekor);
            // Eski veri uyumluluğu
            if (!rekor.ml) {
                rekor.ml = rekor.miktar * 250;
            }
            return rekor;
        }
        return { miktar: 0, ml: 0, tarih: '-' };
    } catch (hata) {
        console.error('Rekor yüklenemedi:', hata);
        return { miktar: 0, ml: 0, tarih: '-' };
    }
}

// --- STREAK SİSTEMİ ---
export interface StreakBilgisi {
    mevcutStreak: number;      // Şu anki art arda gün sayısı
    enUzunStreak: number;      // Tüm zamanların en uzun streak'i
    sonHedefTarih: string;     // Son hedefe ulaşılan tarih
}

const STREAK_KEY = '@streak_bilgisi';

/**
 * Streak hesapla - geçmiş verilere göre
 */
export async function streakHesapla(gunlukHedef: number): Promise<StreakBilgisi> {
    try {
        const gecmisKey = '@su_gecmisi';
        const kayitliVeri = await AsyncStorage.getItem(gecmisKey);

        if (!kayitliVeri) {
            return { mevcutStreak: 0, enUzunStreak: 0, sonHedefTarih: '-' };
        }

        const gecmis = JSON.parse(kayitliVeri);
        const bugun = new Date();

        let mevcutStreak = 0;
        let enUzunStreak = 0;
        let sonHedefTarih = '-';

        // Bugünden geriye doğru say - ilk hedefe ulaşılmayan günde dur
        for (let i = 0; i < 365; i++) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];

            const veri = gecmis[tarihStr];
            // Veri nesne olabilir (ml ve miktar içerir) veya sadece sayı olabilir
            const gunlukMiktar = typeof veri === 'object' && veri !== null
                ? (veri.ml || veri.toplamMl || 0)
                : (veri || 0);

            if (gunlukMiktar >= gunlukHedef) {
                mevcutStreak++;
                if (sonHedefTarih === '-') {
                    sonHedefTarih = tarihStr;
                }
            } else {
                // Hedefe ulaşılmadı - streak bit
                // Bugün hedefe ulaşılmadıysa streak = 0
                // Dün hedefe ulaşılmadıysa ama bugün de yoksa streak = 0
                break;
            }
        }

        // En uzun streak'i hesapla (ayrı döngü)
        let geciciStreak = 0;
        for (let i = 0; i < 365; i++) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];

            const veri = gecmis[tarihStr];
            const gunlukMiktar = typeof veri === 'object' && veri !== null
                ? (veri.ml || veri.toplamMl || 0)
                : (veri || 0);

            if (gunlukMiktar >= gunlukHedef) {
                geciciStreak++;
            } else {
                if (geciciStreak > enUzunStreak) {
                    enUzunStreak = geciciStreak;
                }
                geciciStreak = 0;
            }
        }
        if (geciciStreak > enUzunStreak) {
            enUzunStreak = geciciStreak;
        }

        // Kayıtlı en uzun streak'i kontrol et
        const kayitliStreak = await AsyncStorage.getItem(STREAK_KEY);
        if (kayitliStreak) {
            const eskiStreak = JSON.parse(kayitliStreak);
            if (eskiStreak.enUzunStreak > enUzunStreak) {
                enUzunStreak = eskiStreak.enUzunStreak;
            }
        }

        // Yeni en uzun streak'i kaydet
        const yeniStreakBilgi: StreakBilgisi = {
            mevcutStreak,
            enUzunStreak,
            sonHedefTarih,
        };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(yeniStreakBilgi));

        return yeniStreakBilgi;
    } catch (hata) {
        console.error('Streak hesaplanamadı:', hata);
        return { mevcutStreak: 0, enUzunStreak: 0, sonHedefTarih: '-' };
    }
}

// --- SESSİZ SAATLER SİSTEMİ ---
const SESSIZ_SAATLER_KEY = '@sessiz_saatler';

export interface SessizSaatlerAyar {
    aktif: boolean;
    baslangic: number; // Saat (0-23)
    bitis: number;     // Saat (0-23)
}

const VARSAYILAN_SESSIZ: SessizSaatlerAyar = {
    aktif: false,
    baslangic: 22,  // 22:00
    bitis: 7,       // 07:00
};

export async function sessizSaatlerKaydet(ayar: SessizSaatlerAyar): Promise<void> {
    try {
        await AsyncStorage.setItem(SESSIZ_SAATLER_KEY, JSON.stringify(ayar));
    } catch (hata) {
        console.error('Sessiz saatler kaydedilemedi:', hata);
    }
}

export async function sessizSaatlerYukle(): Promise<SessizSaatlerAyar> {
    try {
        const kayitli = await AsyncStorage.getItem(SESSIZ_SAATLER_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
        return VARSAYILAN_SESSIZ;
    } catch (hata) {
        console.error('Sessiz saatler yüklenemedi:', hata);
        return VARSAYILAN_SESSIZ;
    }
}

export function sessizSaatteMiyiz(ayar: SessizSaatlerAyar): boolean {
    if (!ayar.aktif) return false;

    const simdi = new Date().getHours();

    // Gece yarısını geçen aralık (örn: 22:00 - 07:00)
    if (ayar.baslangic > ayar.bitis) {
        return simdi >= ayar.baslangic || simdi < ayar.bitis;
    }
    // Normal aralık (örn: 14:00 - 16:00)
    return simdi >= ayar.baslangic && simdi < ayar.bitis;
}

// --- SES AYARLARI ---
const SES_AYAR_KEY = '@ses_ayar';

export interface SesAyar {
    aktif: boolean;
}

export async function sesAyarKaydet(aktif: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(SES_AYAR_KEY, JSON.stringify({ aktif }));
    } catch (hata) {
        console.error('Ses ayarı kaydedilemedi:', hata);
    }
}

export async function sesAyarYukle(): Promise<boolean> {
    try {
        const kayitli = await AsyncStorage.getItem(SES_AYAR_KEY);
        if (kayitli) {
            const ayar = JSON.parse(kayitli);
            return ayar.aktif;
        }
        return true; // Varsayılan: açık
    } catch (hata) {
        console.error('Ses ayarı yüklenemedi:', hata);
        return true;
    }
}

// --- SON İÇME ZAMANI (Akıllı Hatırlatma) ---
const SON_ICME_KEY = '@son_icme_zamani';
const AKILLI_HATIRLATMA_KEY = '@akilli_hatirlatma';

export interface AkilliHatirlatmaAyar {
    aktif: boolean;
    aralikDakika: number; // Kaç dakika su içilmezse hatırlat
}

/**
 * Son içme zamanını kaydet
 */
export async function sonIcmeZamaniKaydet(): Promise<void> {
    try {
        const simdi = new Date().toISOString();
        await AsyncStorage.setItem(SON_ICME_KEY, simdi);
    } catch (hata) {
        console.error('Son içme zamanı kaydedilemedi:', hata);
    }
}

/**
 * Son içme zamanını yükle
 */
export async function sonIcmeZamaniYukle(): Promise<Date | null> {
    try {
        const kayitli = await AsyncStorage.getItem(SON_ICME_KEY);
        if (kayitli) {
            return new Date(kayitli);
        }
        return null;
    } catch (hata) {
        console.error('Son içme zamanı yüklenemedi:', hata);
        return null;
    }
}

/**
 * Son içmeden bu yana geçen dakika
 */
export async function sonIcmedenGecenDakika(): Promise<number> {
    const sonIcme = await sonIcmeZamaniYukle();
    if (!sonIcme) return 0;

    const simdi = new Date();
    const farkMs = simdi.getTime() - sonIcme.getTime();
    return Math.floor(farkMs / (1000 * 60)); // Dakika cinsinden
}

/**
 * Akıllı hatırlatma ayarını kaydet
 */
export async function akilliHatirlatmaAyarKaydet(ayar: AkilliHatirlatmaAyar): Promise<void> {
    try {
        await AsyncStorage.setItem(AKILLI_HATIRLATMA_KEY, JSON.stringify(ayar));
    } catch (hata) {
        console.error('Akıllı hatırlatma ayarı kaydedilemedi:', hata);
    }
}

/**
 * Akıllı hatırlatma ayarını yükle
 */
export async function akilliHatirlatmaAyarYukle(): Promise<AkilliHatirlatmaAyar> {
    try {
        const kayitli = await AsyncStorage.getItem(AKILLI_HATIRLATMA_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Akıllı hatırlatma ayarı yüklenemedi:', hata);
    }
    return { aktif: false, aralikDakika: 90 }; // Varsayılan: 90 dakika
}

// ============================================
// FAVORİ SAATLER
// ============================================

const SU_ICME_SAATLERI_KEY = '@su_icme_saatleri';

export interface SaatIstatistik {
    saat: number;
    toplam: number;
}

/**
 * Su içme saatini kaydet
 */
export async function suIcmeSaatiKaydet(): Promise<void> {
    try {
        const saat = new Date().getHours();
        const kayitli = await AsyncStorage.getItem(SU_ICME_SAATLERI_KEY);

        let saatler: Record<string, number> = {};
        if (kayitli) {
            try {
                const parsed = JSON.parse(kayitli);
                // Tip kontrolü - obje mi array mi?
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    saatler = parsed;
                } else {
                    console.log('Su saatleri verisi sıfırlandı (yanlış format)');
                    saatler = {};
                }
            } catch {
                saatler = {};
            }
        }

        // Saati artır
        const saatKey = saat.toString();
        saatler[saatKey] = (saatler[saatKey] || 0) + 1;

        console.log('Su saati kaydedildi:', saat, 'Toplam:', saatler[saatKey]);
        await AsyncStorage.setItem(SU_ICME_SAATLERI_KEY, JSON.stringify(saatler));
    } catch (hata) {
        console.error('Su içme saati kaydedilemedi:', hata);
    }
}

/**
 * Saatlere göre su içme istatistiklerini yükle
 */
export async function suIcmeSaatleriYukle(): Promise<SaatIstatistik[]> {
    try {
        const kayitli = await AsyncStorage.getItem(SU_ICME_SAATLERI_KEY);

        if (kayitli) {
            const parsed = JSON.parse(kayitli);

            // Tip kontrolü - obje olmalı, dizi değil
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const saatler: Record<string, number> = parsed;

                // Tüm 24 saati oluştur
                const sonuc: SaatIstatistik[] = [];
                for (let i = 0; i < 24; i++) {
                    sonuc.push({
                        saat: i,
                        toplam: saatler[i.toString()] || 0,
                    });
                }

                console.log('Su saatleri yüklendi:', Object.keys(saatler).length, 'kayıt');
                return sonuc;
            } else {
                console.log('Su saatleri verisi yanlış formatta, sıfırlanıyor');
                // Yanlış format varsa temizle
                await AsyncStorage.removeItem(SU_ICME_SAATLERI_KEY);
            }
        }
    } catch (hata) {
        console.error('Su içme saatleri yüklenemedi:', hata);
    }

    // Boş 24 saat döndür
    return Array.from({ length: 24 }, (_, i) => ({ saat: i, toplam: 0 }));
}

/**
 * Favori saati hesapla (en çok su içilen saat)
 */
export async function favoriSaatHesapla(): Promise<{ saat: number; toplam: number } | null> {
    const saatler = await suIcmeSaatleriYukle();

    let favori: SaatIstatistik | null = null;
    for (const s of saatler) {
        if (s.toplam > 0 && (!favori || s.toplam > favori.toplam)) {
            favori = s;
        }
    }

    return favori;
}

/**
 * En aktif zaman dilimini hesapla (sabah/öğle/akşam/gece)
 */
export async function enAktifZamanDilimi(): Promise<{ dilim: string; emoji: string; toplam: number }> {
    const saatler = await suIcmeSaatleriYukle();

    // Zaman dilimlerine böl
    const dilimler = {
        sabah: { toplam: 0, emoji: '🌅', ad: 'Sabah (6-12)' },      // 6-11
        ogle: { toplam: 0, emoji: '☀️', ad: 'Öğle (12-18)' },       // 12-17
        aksam: { toplam: 0, emoji: '🌆', ad: 'Akşam (18-22)' },     // 18-21
        gece: { toplam: 0, emoji: '🌙', ad: 'Gece (22-6)' },        // 22-5
    };

    for (const s of saatler) {
        if (s.saat >= 6 && s.saat < 12) {
            dilimler.sabah.toplam += s.toplam;
        } else if (s.saat >= 12 && s.saat < 18) {
            dilimler.ogle.toplam += s.toplam;
        } else if (s.saat >= 18 && s.saat < 22) {
            dilimler.aksam.toplam += s.toplam;
        } else {
            dilimler.gece.toplam += s.toplam;
        }
    }

    // En aktif dilimi bul
    let enAktif = dilimler.sabah;
    if (dilimler.ogle.toplam > enAktif.toplam) enAktif = dilimler.ogle;
    if (dilimler.aksam.toplam > enAktif.toplam) enAktif = dilimler.aksam;
    if (dilimler.gece.toplam > enAktif.toplam) enAktif = dilimler.gece;

    return { dilim: enAktif.ad, emoji: enAktif.emoji, toplam: enAktif.toplam };
}

// --- BIORITIM AYARLARI ---
const BIORITIM_KEY = '@bioritim_ayar';

export interface BioritimAyar {
    aktif: boolean;
    uyanmaSaati: string; // "08:00"
    uyumaSaati: string;  // "23:00"
}

export async function bioritimAyarKaydet(ayar: BioritimAyar): Promise<void> {
    try {
        await AsyncStorage.setItem(BIORITIM_KEY, JSON.stringify(ayar));
    } catch (hata) {
        console.error('Bioritim ayarı kaydedilemedi:', hata);
    }
}

export async function bioritimAyarYukle(): Promise<BioritimAyar> {
    try {
        const kayitli = await AsyncStorage.getItem(BIORITIM_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Bioritim ayarı yüklenemedi:', hata);
    }
    return { aktif: false, uyanmaSaati: '08:00', uyumaSaati: '23:00' };
}

// --- DETOKS MODU ---
const DETOKS_KEY = '@detoks_ayar';

export interface DetoksAyar {
    aktif: boolean;
}

export async function detoksAyarKaydet(ayar: DetoksAyar): Promise<void> {
    try {
        await AsyncStorage.setItem(DETOKS_KEY, JSON.stringify(ayar));
    } catch (hata) {
        console.error('Detoks ayarı kaydedilemedi:', hata);
    }
}

export async function detoksAyarYukle(): Promise<DetoksAyar> {
    try {
        const kayitli = await AsyncStorage.getItem(DETOKS_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Detoks ayarı yüklenemedi:', hata);
    }
    return { aktif: false };
}

