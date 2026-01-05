// ============================================
// GÜNLÜK GÖREVLER SİSTEMİ
// ============================================
// Her gün farklı görevler ve ödüller

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SABİTLER ---
const GOREVLER_KEY = '@gunluk_gorevler';

// --- TİPLER ---
export interface GunlukGorev {
    id: string;
    baslik: string;
    aciklama: string;
    emoji: string;
    hedef: number; // Hedef miktar
    ilerleme: number; // Mevcut ilerleme
    xpOdulu: number;
    tamamlandi: boolean;
}

export interface GunlukGorevDurumu {
    tarih: string; // YYYY-MM-DD
    gorevler: GunlukGorev[];
    toplamTamamlanan: number;
}

// --- GÖREV ŞABLONLARI ---
const GOREV_SABLONLARI: Omit<GunlukGorev, 'ilerleme' | 'tamamlandi'>[] = [
    {
        id: 'sabah_su',
        baslik: 'Güne Başlangıç',
        aciklama: 'Sabah 10:00\'dan önce 500 ml su iç',
        emoji: '🌅',
        hedef: 500,
        xpOdulu: 25,
    },
    {
        id: 'ogle_su',
        baslik: 'Öğle Molası',
        aciklama: 'Öğle 12:00-14:00 arası 500 ml su iç',
        emoji: '☀️',
        hedef: 500,
        xpOdulu: 20,
    },
    {
        id: 'aksam_su',
        baslik: 'Akşam Rutini',
        aciklama: 'Akşam 18:00-21:00 arası 500 ml su iç',
        emoji: '🌆',
        hedef: 500,
        xpOdulu: 20,
    },
    {
        id: 'toplam_1250',
        baslik: 'Yarıyıladık',
        aciklama: 'Bugün toplam 1250 ml (1.25L) su iç',
        emoji: '🖐️',
        hedef: 1250,
        xpOdulu: 15,
    },
    {
        id: 'toplam_2000',
        baslik: 'Sağlıklı Yaşam',
        aciklama: 'Bugün toplam 2000 ml (2L) su iç',
        emoji: '🎱',
        hedef: 2000,
        xpOdulu: 30,
    },
    {
        id: 'ust_uste_3',
        baslik: 'Hidrasyon Serisi',
        aciklama: '3 saat içinde 750 ml su iç',
        emoji: '⚡',
        hedef: 750,
        xpOdulu: 35,
    },
    {
        id: 'sabah_rutini',
        baslik: 'Sabah Rutini',
        aciklama: 'Uyandıktan sonra ilk 30 dakikada 250 ml su iç',
        emoji: '🌄',
        hedef: 250,
        xpOdulu: 25,
    },
    {
        id: 'hedef_asimi',
        baslik: 'Hedef Aşımı',
        aciklama: 'Bugün günlük hedefinin %120\'sini tamamla',
        emoji: '🚀',
        hedef: 0, // Dinamik hesaplanacak
        xpOdulu: 40,
    },
    {
        id: 'sicak_gun',
        baslik: 'Sıcak Gün Mücadelesi',
        aciklama: 'Hava sıcakken 3000 ml su iç',
        emoji: '🌡️',
        hedef: 3000,
        xpOdulu: 50,
    },
    {
        id: 'streak_koruma',
        baslik: 'Seriyi Koru',
        aciklama: 'Bugün hedefini tamamla ve seriini devam ettir',
        emoji: '🔥',
        hedef: 0, // Dinamik
        xpOdulu: 30,
    },
    {
        id: 'gece_oncesi',
        baslik: 'Gece Öncesi',
        aciklama: 'Uyumadan 1 saat önce 200 ml su iç',
        emoji: '🌙',
        hedef: 200,
        xpOdulu: 20,
    },
    {
        id: 'reguler_icim',
        baslik: 'Düzenli İçim',
        aciklama: 'Her 2 saatte bir su iç (5 kez)',
        emoji: '⏰',
        hedef: 5,
        xpOdulu: 35,
    },
];

// --- FONKSİYONLAR ---

/**
 * Bugünün tarihini al (YYYY-MM-DD)
 */
function bugunTarih(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Günlük görevleri yükle (yoksa yeni oluştur)
 */
export async function gunlukGorevleriYukle(): Promise<GunlukGorevDurumu> {
    try {
        const kayitli = await AsyncStorage.getItem(GOREVLER_KEY);
        if (kayitli) {
            const durum: GunlukGorevDurumu = JSON.parse(kayitli);

            // Eğer bugünün görevleri değilse, yeni görevler oluştur
            if (durum.tarih !== bugunTarih()) {
                return await yeniGunlukGorevlerOlustur();
            }

            // Şablonlardan güncel bilgileri al ve durumu koru
            const guncelGorevler = durum.gorevler.map(k => {
                const sablon = GOREV_SABLONLARI.find(s => s.id === k.id);
                if (sablon) {
                    return {
                        ...sablon,
                        ilerleme: k.ilerleme,
                        tamamlandi: k.tamamlandi
                    };
                }
                return k;
            });

            return {
                ...durum,
                gorevler: guncelGorevler
            };
        }
    } catch (hata) {
        console.error('Günlük görevler yüklenemedi:', hata);
    }

    return await yeniGunlukGorevlerOlustur();
}

/**
 * Yeni günlük görevler oluştur (rastgele 3 görev seç)
 */
async function yeniGunlukGorevlerOlustur(): Promise<GunlukGorevDurumu> {
    // Rastgele 3 görev seç
    const karisik = [...GOREV_SABLONLARI].sort(() => Math.random() - 0.5);
    const secilenler = karisik.slice(0, 3);

    const gorevler: GunlukGorev[] = secilenler.map(sablon => ({
        ...sablon,
        ilerleme: 0,
        tamamlandi: false,
    }));

    const durum: GunlukGorevDurumu = {
        tarih: bugunTarih(),
        gorevler,
        toplamTamamlanan: 0,
    };

    await gunlukGorevleriKaydet(durum);
    return durum;
}

/**
 * Günlük görevleri kaydet
 */
async function gunlukGorevleriKaydet(durum: GunlukGorevDurumu): Promise<void> {
    try {
        await AsyncStorage.setItem(GOREVLER_KEY, JSON.stringify(durum));
    } catch (hata) {
        console.error('Günlük görevler kaydedilemedi:', hata);
    }
}

/**
 * Görev ilerlemesini güncelle
 */
async function gorevIlerlemesiGuncelle(
    gorevId: string,
    yeniIlerleme: number
): Promise<{ tamamlandi: boolean; xpOdulu: number } | null> {
    const durum = await gunlukGorevleriYukle();
    const gorevIndex = durum.gorevler.findIndex(g => g.id === gorevId);

    if (gorevIndex === -1) return null;

    const gorev = durum.gorevler[gorevIndex];

    // Zaten tamamlanmışsa
    if (gorev.tamamlandi) return null;

    gorev.ilerleme = yeniIlerleme;

    // Hedef tamamlandı mı?
    if (gorev.ilerleme >= gorev.hedef) {
        gorev.tamamlandi = true;
        durum.toplamTamamlanan += 1;

        await gunlukGorevleriKaydet(durum);

        return {
            tamamlandi: true,
            xpOdulu: gorev.xpOdulu,
        };
    }

    await gunlukGorevleriKaydet(durum);
    return { tamamlandi: false, xpOdulu: 0 };
}

/**
 * Su içme ile görev kontrolü
 */
export async function suIcmeGorevKontrol(
    toplamMl: number,
    saat: number,
    eklenenMl: number = 250
): Promise<GunlukGorev | null> {
    const durum = await gunlukGorevleriYukle();

    for (const gorev of durum.gorevler) {
        if (gorev.tamamlandi) continue;

        let yeniIlerleme = gorev.ilerleme;

        // Görev tipine göre ilerleme güncelle
        if (gorev.id === 'sabah_su' && saat < 10) {
            yeniIlerleme = Math.min(gorev.ilerleme + eklenenMl, gorev.hedef);
        } else if (gorev.id === 'ogle_su' && saat >= 12 && saat < 14) {
            yeniIlerleme = Math.min(gorev.ilerleme + eklenenMl, gorev.hedef);
        } else if (gorev.id === 'aksam_su' && saat >= 18 && saat < 21) {
            yeniIlerleme = Math.min(gorev.ilerleme + eklenenMl, gorev.hedef);
        } else if (gorev.id === 'toplam_1250' || gorev.id === 'toplam_2000') {
            yeniIlerleme = toplamMl;
        } else if (gorev.id === 'ust_uste_3') {
            // Bu görev için özel mantık gerekiyor - şimdilik basit artış
            yeniIlerleme = Math.min(gorev.ilerleme + eklenenMl, gorev.hedef);
        }

        if (yeniIlerleme !== gorev.ilerleme) {
            const sonuc = await gorevIlerlemesiGuncelle(gorev.id, yeniIlerleme);
            if (sonuc?.tamamlandi) {
                // Güncellenmiş görevi döndür
                const guncelDurum = await gunlukGorevleriYukle();
                return guncelDurum.gorevler.find(g => g.id === gorev.id) || null;
            }
        }
    }

    return null;
}
