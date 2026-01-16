// ============================================
// EXPORT UTILS - Premium CSV & Data Export
// ============================================
// Premium kullanıcılar için profesyonel veri dışa aktarma

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
 * Premium Profesyonel CSV oluştur
 */
export function premiumCsvOlustur(gecmis: GecmisVeri, hedef: number = 2000): string {
    const ozet = ozetHesapla(gecmis, hedef);

    // Metadata & Executive Summary Section
    const metadata = [
        '--------------------------------------------------------------------------------',
        '| SU TAKİP PREMIUM - PROFESYONEL VERİ EKSPORTU                                |',
        '--------------------------------------------------------------------------------',
        `| RApor Oluşturma Tarihi : ${new Date().toLocaleString('tr-TR')}                   |`,
        `| Toplam İzlenen Gün     : ${ozet.toplamGun} gün                                     |`,
        `| Toplam Su Tüketimi     : ${(ozet.toplamMl / 1000).toFixed(2)} Litre                            |`,
        `| Günlük Ortalama        : ${ozet.ortalamaMl} ml                                     |`,
        `| Hedef Başarı Oranı     : %${ozet.basariOrani} (Hedef: ${hedef}ml)                        |`,
        '--------------------------------------------------------------------------------',
        '',
    ];

    // CSV Header (Column Names)
    const header = [
        'Tarih',
        'Gün',
        'Tüketim (ml)',
        'Bardak Sayısı',
        'Hedef (ml)',
        'Başarı (%)',
        'Durum',
        '7-Günlük Hareketli Ort.',
        'Haftalık Hedef Farkı (ml)'
    ].join(',');

    // Sort dates descending
    const tarihler = Object.keys(gecmis).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    // Data Row Generator
    const rows = tarihler.map(tarih => {
        const kayit = gecmis[tarih];
        const date = new Date(tarih);
        const gunAdi = GUN_ADLARI_UZUN[date.getDay()];
        const basariYuzde = Math.round((kayit.ml / hedef) * 100);
        const durum = kayit.ml >= hedef ? 'HEDEF TAMAMLANDI' : 'HEDEF ALTI';
        const hareketliOrt = haftalikOrtalamaHesapla(gecmis, tarih);
        const fark = kayit.ml - hedef;

        return [
            tarih,
            gunAdi,
            kayit.ml,
            kayit.miktar,
            hedef,
            basariYuzde,
            durum,
            hareketliOrt,
            fark
        ].join(',');
    });

    return metadata.join('\n') + header + '\n' + rows.join('\n');
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
                'İstatistiksel analiz için yeterli veri bulunmuyor. 💪'
            );
            return false;
        }

        const csvIcerigi = premiumCsvOlustur(gecmis, hedef);
        const simdi = new Date();
        const dosyaAdi = `SuTakip_Rapor_${simdi.getFullYear()}${String(simdi.getMonth() + 1).padStart(2, '0')}${String(simdi.getDate()).padStart(2, '0')}.csv`;

        const dosyaYolu = `${FileSystem.cacheDirectory}${dosyaAdi}`;
        await FileSystem.writeAsStringAsync(dosyaYolu, csvIcerigi);

        const paylasilabilir = await Sharing.isAvailableAsync();
        if (!paylasilabilir) {
            Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
            return false;
        }

        await Sharing.shareAsync(dosyaYolu, {
            mimeType: 'text/csv',
            dialogTitle: 'Profesyonel Su Tüketim Analizi',
            UTI: 'public.comma-separated-values-text',
        });

        return true;
    } catch (hata) {
        console.error('CSV Export Error:', hata);
        Alert.alert('Sistem Hatası', 'Rapor hazırlanırken bir hata oluştu.');
        return false;
    }
}

/**
 * Toplam veri sayısını al
 */
export async function toplamVeriSayisi(): Promise<number> {
    const gecmis = await suGecmisiniYukle();
    return Object.keys(gecmis).length;
}
