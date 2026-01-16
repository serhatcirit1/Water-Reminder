// ============================================
// EXPORT UTILS - Premium CSV & Excel Export
// ============================================
// Premium kullanıcılar için gelişmiş veri dışa aktarma

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

// Storage Keys
const GECMIS_KEY = '@su_gecmisi';

// --- TİPLER ---
interface GecmisKayit {
    ml: number;
    miktar: number;
}

interface GecmisVeri {
    [tarih: string]: GecmisKayit;
}

interface DetayliKayit {
    tarih: string;
    haftaninGunu: string;
    ml: number;
    bardakSayisi: number;
    hedef: number;
    basariYuzde: number;
    hedefinUstunde: boolean;
    haftalikOrtalama: number;
}

interface OzetIstatistik {
    toplamGun: number;
    toplamMl: number;
    ortalamaMl: number;
    enIyiGun: { tarih: string; ml: number } | null;
    enKotuGun: { tarih: string; ml: number } | null;
    basariliGunler: number;
    basariOrani: number;
}

// --- SABİTLER ---
const GUN_ADLARI_UZUN: Record<number, string> = {
    0: 'Pazar',
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    6: 'Cumartesi',
};

// --- FONKSİYONLAR ---

/**
 * AsyncStorage'dan tüm su geçmişini al
 */
export async function suGecmisiniYukle(): Promise<GecmisVeri> {
    try {
        const kayitli = await AsyncStorage.getItem(GECMIS_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Su geçmişi yüklenemedi:', hata);
    }
    return {};
}

/**
 * Haftalık ortalama hesapla (son 7 gün)
 */
function haftalikOrtalamaHesapla(gecmis: GecmisVeri, tarih: string): number {
    const buTarih = new Date(tarih);
    let toplam = 0;
    let gunSayisi = 0;

    for (let i = 0; i < 7; i++) {
        const gecmisTarih = new Date(buTarih);
        gecmisTarih.setDate(gecmisTarih.getDate() - i);
        const tarihStr = gecmisTarih.toISOString().split('T')[0];

        if (gecmis[tarihStr]) {
            toplam += gecmis[tarihStr].ml;
            gunSayisi++;
        }
    }

    return gunSayisi > 0 ? Math.round(toplam / gunSayisi) : 0;
}

/**
 * Özet istatistikleri hesapla
 */
function ozetHesapla(gecmis: GecmisVeri, hedef: number): OzetIstatistik {
    const kayitlar = Object.entries(gecmis);

    if (kayitlar.length === 0) {
        return {
            toplamGun: 0,
            toplamMl: 0,
            ortalamaMl: 0,
            enIyiGun: null,
            enKotuGun: null,
            basariliGunler: 0,
            basariOrani: 0,
        };
    }

    let toplamMl = 0;
    let enIyiGun: { tarih: string; ml: number } | null = null;
    let enKotuGun: { tarih: string; ml: number } | null = null;
    let basariliGunler = 0;

    kayitlar.forEach(([tarih, kayit]) => {
        toplamMl += kayit.ml;

        if (!enIyiGun || kayit.ml > enIyiGun.ml) {
            enIyiGun = { tarih, ml: kayit.ml };
        }

        if (!enKotuGun || kayit.ml < enKotuGun.ml) {
            enKotuGun = { tarih, ml: kayit.ml };
        }

        if (kayit.ml >= hedef) {
            basariliGunler++;
        }
    });

    return {
        toplamGun: kayitlar.length,
        toplamMl,
        ortalamaMl: Math.round(toplamMl / kayitlar.length),
        enIyiGun,
        enKotuGun,
        basariliGunler,
        basariOrani: Math.round((basariliGunler / kayitlar.length) * 100),
    };
}

/**
 * Premium CSV oluştur (özet + detaylı satırlar)
 */
export function premiumCsvOlustur(gecmis: GecmisVeri, hedef: number = 2000): string {
    const ozet = ozetHesapla(gecmis, hedef);

    // Özet bölümü
    const ozetBolumu = [
        '# SU TÜKETİM RAPORU',
        `# Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
        '#',
        `# ÖZET İSTATİSTİKLER`,
        `# Toplam Gün Sayısı: ${ozet.toplamGun}`,
        `# Toplam Tüketim: ${(ozet.toplamMl / 1000).toFixed(2)} Litre`,
        `# Günlük Ortalama: ${ozet.ortalamaMl} ml`,
        `# Günlük Hedef: ${hedef} ml`,
        `# Başarılı Günler: ${ozet.basariliGunler} (${ozet.basariOrani}%)`,
        ozet.enIyiGun ? `# En İyi Gün: ${ozet.enIyiGun.tarih} (${ozet.enIyiGun.ml} ml)` : '',
        ozet.enKotuGun ? `# En Düşük: ${ozet.enKotuGun.tarih} (${ozet.enKotuGun.ml} ml)` : '',
        '#',
        '# DETAYLI VERİLER',
        '',
    ].filter(line => line !== '').join('\n');

    // Header satırı
    const header = 'Tarih,Gün,İçilen (ml),Bardak,Hedef (ml),Başarı (%),Hedef Durumu,7 Günlük Ort.';

    // Tarihleri sırala (en yeniden en eskiye)
    const tarihler = Object.keys(gecmis).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    // Satırları oluştur
    const satirlar = tarihler.map(tarih => {
        const kayit = gecmis[tarih];
        const date = new Date(tarih);
        const gunAdi = GUN_ADLARI_UZUN[date.getDay()];
        const basariYuzde = Math.round((kayit.ml / hedef) * 100);
        const hedefinUstunde = kayit.ml >= hedef ? 'Başarılı' : 'Eksik';
        const haftalikOrt = haftalikOrtalamaHesapla(gecmis, tarih);

        return `${tarih},${gunAdi},${kayit.ml},${kayit.miktar},${hedef},${basariYuzde}%,${hedefinUstunde},${haftalikOrt}`;
    });

    return ozetBolumu + [header, ...satirlar].join('\n');
}

/**
 * Premium CSV dosyasını oluştur ve paylaş
 */
export async function csvOlusturVePaylas(hedef: number = 2000): Promise<boolean> {
    try {
        const gecmis = await suGecmisiniYukle();

        if (Object.keys(gecmis).length === 0) {
            Alert.alert(
                'Veri Bulunamadı',
                'Dışa aktarılacak su tüketim verisi bulunmuyor. Önce biraz su içmeyi deneyin! 💧'
            );
            return false;
        }

        // Premium CSV oluştur
        const csvIcerigi = premiumCsvOlustur(gecmis, hedef);

        // Dosya adı oluştur (tarih damgalı)
        const simdi = new Date();
        const dosyaAdi = `su_tuketimi_rapor_${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, '0')}-${String(simdi.getDate()).padStart(2, '0')}.csv`;

        // Dosya yolu
        const dosyaYolu = `${FileSystem.cacheDirectory}${dosyaAdi}`;

        // Dosyayı yaz
        await FileSystem.writeAsStringAsync(dosyaYolu, csvIcerigi);

        // Paylaşım mümkün mü kontrol et
        const paylasilabilir = await Sharing.isAvailableAsync();

        if (!paylasilabilir) {
            Alert.alert(
                'Paylaşım Desteklenmiyor',
                'Bu cihazda dosya paylaşımı desteklenmiyor.'
            );
            return false;
        }

        // Paylaş
        await Sharing.shareAsync(dosyaYolu, {
            mimeType: 'text/csv',
            dialogTitle: 'Su Tüketim Raporu Paylaş',
            UTI: 'public.comma-separated-values-text',
        });

        return true;
    } catch (hata) {
        console.error('CSV dışa aktarma hatası:', hata);
        Alert.alert(
            'Hata',
            'Veriler dışa aktarılırken bir hata oluştu. Lütfen tekrar deneyin.'
        );
        return false;
    }
}

/**
 * Toplam veri sayısını al (istatistik için)
 */
export async function toplamVeriSayisi(): Promise<number> {
    const gecmis = await suGecmisiniYukle();
    return Object.keys(gecmis).length;
}

/**
 * JSON olarak tüm veriyi dışa aktar (yedekleme için)
 */
export async function jsonOlusturVePaylas(): Promise<boolean> {
    try {
        const gecmis = await suGecmisiniYukle();

        if (Object.keys(gecmis).length === 0) {
            Alert.alert('Veri Bulunamadı', 'Yedeklenecek veri yok.');
            return false;
        }

        const yedek = {
            uygulamaAdi: 'Su Takip Premium',
            olusturmaTarihi: new Date().toISOString(),
            versiyon: '1.0',
            veri: gecmis,
        };

        const jsonIcerigi = JSON.stringify(yedek, null, 2);
        const simdi = new Date();
        const dosyaAdi = `su_takip_yedek_${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, '0')}-${String(simdi.getDate()).padStart(2, '0')}.json`;

        const dosyaYolu = `${FileSystem.cacheDirectory}${dosyaAdi}`;
        await FileSystem.writeAsStringAsync(dosyaYolu, jsonIcerigi);

        const paylasilabilir = await Sharing.isAvailableAsync();
        if (!paylasilabilir) {
            Alert.alert('Hata', 'Paylaşım desteklenmiyor.');
            return false;
        }

        await Sharing.shareAsync(dosyaYolu, {
            mimeType: 'application/json',
            dialogTitle: 'Yedekleme Dosyası',
            UTI: 'public.json',
        });

        return true;
    } catch (hata) {
        console.error('JSON yedekleme hatası:', hata);
        Alert.alert('Hata', 'Yedekleme oluşturulamadı.');
        return false;
    }
}
