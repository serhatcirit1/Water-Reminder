// ============================================
// EXPORT UTILS
// ============================================
// Premium kullanıcılar için CSV dışa aktarma

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

interface CsvSatir {
    tarih: string;
    ml: number;
    miktar: number;
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
 * Su verilerini CSV formatına dönüştür
 */
export function veridenCsvOlustur(gecmis: GecmisVeri): string {
    // Header satırı
    const header = 'Tarih,İçilen (ml),Bardak Sayısı';

    // Tarihleri sırala (en yeniden en eskiye)
    const tarihler = Object.keys(gecmis).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    // Satırları oluştur
    const satirlar = tarihler.map(tarih => {
        const kayit = gecmis[tarih];
        return `${tarih},${kayit.ml},${kayit.miktar}`;
    });

    // Tüm CSV içeriğini birleştir
    return [header, ...satirlar].join('\n');
}

/**
 * CSV dosyasını oluştur ve paylaş
 */
export async function csvOlusturVePaylas(): Promise<boolean> {
    try {
        // Veriyi al
        const gecmis = await suGecmisiniYukle();

        if (Object.keys(gecmis).length === 0) {
            Alert.alert(
                'Veri Bulunamadı',
                'Dışa aktarılacak su tüketim verisi bulunmuyor. Önce biraz su içmeyi deneyin! 💧'
            );
            return false;
        }

        // CSV oluştur
        const csvIcerigi = veridenCsvOlustur(gecmis);

        // Dosya adı oluştur (tarih damgalı)
        const simdi = new Date();
        const dosyaAdi = `su_tuketimi_${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, '0')}-${String(simdi.getDate()).padStart(2, '0')}.csv`;

        // Dosya yolu
        const dosyaYolu = `${FileSystem.cacheDirectory}${dosyaAdi}`;

        // Dosyayı yaz (encoding parametresiz - varsayılan UTF-8)
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
            dialogTitle: 'Su Tüketim Verilerini Paylaş',
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
