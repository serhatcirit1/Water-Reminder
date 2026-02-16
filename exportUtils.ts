// ============================================
// EXPORT UTILS - Premium CSV & Data Export
// ============================================
// Premium kullanıcılar için profesyonel veri dışa aktarma

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import i18n from './locales/i18n';

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

// --- HELPER FUNCTIONS ---
function getDayName(index: number): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return i18n.t(`pdf.days.${days[index]}`);
}

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
        `| ${i18n.t('csv.title')}                                |`,
        '--------------------------------------------------------------------------------',
        `| ${i18n.t('csv.report_date')} : ${new Date().toLocaleString(i18n.t('common.locale'))}                   |`,
        `| ${i18n.t('csv.total_tracked_days')}     : ${ozet.toplamGun} ${i18n.t('csv.days')}                                     |`,
        `| ${i18n.t('csv.total_consumption')}     : ${(ozet.toplamMl / 1000).toFixed(2)} ${i18n.t('csv.liters')}                            |`,
        `| ${i18n.t('csv.daily_average')}        : ${ozet.ortalamaMl} ml                                     |`,
        `| ${i18n.t('csv.goal_success_rate')}     : %${ozet.basariOrani} (${i18n.t('csv.goal')}: ${hedef}ml)                        |`,
        '--------------------------------------------------------------------------------',
        '',
    ];

    // CSV Header (Column Names)
    const header = [
        i18n.t('csv.date'),
        i18n.t('csv.day'),
        i18n.t('csv.consumption_ml'),
        i18n.t('csv.glass_count'),
        i18n.t('csv.goal_ml'),
        i18n.t('csv.success_pct'),
        i18n.t('csv.status'),
        i18n.t('csv.moving_avg_7d'),
        i18n.t('csv.weekly_goal_diff')
    ].join(',');

    // Sort dates descending
    const tarihler = Object.keys(gecmis).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    // Data Row Generator
    const rows = tarihler.map(tarih => {
        const kayit = gecmis[tarih];
        const date = new Date(tarih);
        const gunAdi = getDayName(date.getDay());
        const basariYuzde = Math.round((kayit.ml / hedef) * 100);
        const durum = kayit.ml >= hedef ? i18n.t('csv.goal_completed') : i18n.t('csv.below_goal');
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
                i18n.t('csv.no_data_title'),
                i18n.t('csv.no_data_msg')
            );
            return false;
        }

        const csvIcerigi = premiumCsvOlustur(gecmis, hedef);
        const simdi = new Date();

        // Localized file prefix
        const filePrefixes: { [key: string]: string } = {
            'tr': 'SmartWater_Rapor',
            'en': 'WaterTracker_Report',
            'es': 'AguaTracker_Informe',
            'de': 'WasserTracker_Bericht'
        };
        const filePrefix = filePrefixes[i18n.language] || filePrefixes['en'];
        const dosyaAdi = `${filePrefix}_${simdi.getFullYear()}${String(simdi.getMonth() + 1).padStart(2, '0')}${String(simdi.getDate()).padStart(2, '0')}.csv`;

        const dosyaYolu = `${FileSystem.cacheDirectory}${dosyaAdi}`;
        await FileSystem.writeAsStringAsync(dosyaYolu, csvIcerigi);

        const paylasilabilir = await Sharing.isAvailableAsync();
        if (!paylasilabilir) {
            Alert.alert(i18n.t('csv.error_title'), i18n.t('csv.share_unsupported'));
            return false;
        }

        await Sharing.shareAsync(dosyaYolu, {
            mimeType: 'text/csv',
            dialogTitle: i18n.t('csv.share_title'),
            UTI: 'public.comma-separated-values-text',
        });

        return true;
    } catch (hata) {
        console.error('CSV Export Error:', hata);
        Alert.alert(i18n.t('csv.error_title'), i18n.t('csv.error_msg'));
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
