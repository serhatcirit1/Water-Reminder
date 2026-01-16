// ============================================
// PDF EXPORT - Aylık Rapor
// ============================================
// Premium kullanıcılar için aylık PDF raporu

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
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

interface AylikOzet {
    ay: string;
    yil: number;
    toplamMl: number;
    toplamGun: number;
    ortalamaMl: number;
    enIyiGun: { tarih: string; ml: number } | null;
    basariliGunler: number;
    gunlukHedef: number;
}

// --- FONKSİYONLAR ---

/**
 * AsyncStorage'dan su geçmişini al
 */
async function suGecmisiniYukle(): Promise<GecmisVeri> {
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
 * Belirli ay için istatistik hesapla
 */
function aylikIstatistikHesapla(gecmis: GecmisVeri, ay: number, yil: number, gunlukHedef: number): AylikOzet {
    const ayAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    let toplamMl = 0;
    let toplamGun = 0;
    let enIyiGun: { tarih: string; ml: number } | null = null;
    let basariliGunler = 0;

    // Bu aya ait günleri filtrele
    Object.entries(gecmis).forEach(([tarih, kayit]) => {
        const [t_yil, t_ay] = tarih.split('-').map(Number);
        if (t_yil === yil && t_ay === ay + 1) { // ay 0-indexed
            toplamMl += kayit.ml;
            toplamGun++;

            if (!enIyiGun || kayit.ml > enIyiGun.ml) {
                enIyiGun = { tarih, ml: kayit.ml };
            }

            if (kayit.ml >= gunlukHedef) {
                basariliGunler++;
            }
        }
    });

    return {
        ay: ayAdlari[ay],
        yil,
        toplamMl,
        toplamGun,
        ortalamaMl: toplamGun > 0 ? Math.round(toplamMl / toplamGun) : 0,
        enIyiGun,
        basariliGunler,
        gunlukHedef,
    };
}

/**
 * HTML rapor şablonu oluştur
 */
function htmlRaporOlustur(ozet: AylikOzet): string {
    const basariOrani = ozet.toplamGun > 0
        ? Math.round((ozet.basariliGunler / ozet.toplamGun) * 100)
        : 0;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 30px;
                }
                h1 {
                    text-align: center;
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                .subtitle {
                    text-align: center;
                    opacity: 0.8;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: rgba(255,255,255,0.15);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 15px;
                }
                .stat-label {
                    font-size: 14px;
                    opacity: 0.8;
                }
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    margin-top: 5px;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                }
                .stat-half {
                    width: 48%;
                    background: rgba(255,255,255,0.15);
                    border-radius: 15px;
                    padding: 15px;
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    opacity: 0.6;
                    font-size: 12px;
                }
                .emoji {
                    font-size: 40px;
                    text-align: center;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">💧</div>
                <h1>Su Tüketim Raporu</h1>
                <p class="subtitle">${ozet.ay} ${ozet.yil}</p>
                
                <div class="stat-card">
                    <div class="stat-label">Toplam Su Tüketimi</div>
                    <div class="stat-value">${(ozet.toplamMl / 1000).toFixed(1)} Litre</div>
                </div>
                
                <div class="stat-row">
                    <div class="stat-half">
                        <div class="stat-label">Günlük Ortalama</div>
                        <div class="stat-value" style="font-size: 24px">${ozet.ortalamaMl} ml</div>
                    </div>
                    <div class="stat-half">
                        <div class="stat-label">Aktif Gün</div>
                        <div class="stat-value" style="font-size: 24px">${ozet.toplamGun} gün</div>
                    </div>
                </div>
                
                <div class="stat-card" style="margin-top: 15px">
                    <div class="stat-label">Hedef Başarı Oranı</div>
                    <div class="stat-value">${basariOrani}%</div>
                    <div class="stat-label" style="margin-top: 5px">
                        ${ozet.basariliGunler} / ${ozet.toplamGun} gün hedefi tamamladın
                    </div>
                </div>
                
                ${ozet.enIyiGun ? `
                <div class="stat-card">
                    <div class="stat-label">🏆 En İyi Gün</div>
                    <div class="stat-value" style="font-size: 20px">${ozet.enIyiGun.tarih}</div>
                    <div class="stat-label">${ozet.enIyiGun.ml} ml</div>
                </div>
                ` : ''}
                
                <div class="footer">
                    Su İçme Takip Uygulaması • Premium Rapor
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Aylık PDF raporu oluştur ve paylaş
 */
export async function aylikPdfOlusturVePaylas(gunlukHedef: number = 2000): Promise<boolean> {
    try {
        const gecmis = await suGecmisiniYukle();

        if (Object.keys(gecmis).length === 0) {
            Alert.alert(
                'Veri Bulunamadı',
                'Rapor oluşturmak için yeterli veri yok. Önce biraz su içmeyi deneyin! 💧'
            );
            return false;
        }

        // Bu ayın istatistiklerini hesapla
        const simdi = new Date();
        const ozet = aylikIstatistikHesapla(gecmis, simdi.getMonth(), simdi.getFullYear(), gunlukHedef);

        if (ozet.toplamGun === 0) {
            Alert.alert(
                'Veri Bulunamadı',
                'Bu ay için kayıtlı veri yok.'
            );
            return false;
        }

        // HTML oluştur
        const html = htmlRaporOlustur(ozet);

        // PDF oluştur
        const { uri } = await Print.printToFileAsync({ html });

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
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Aylık Su Tüketim Raporu',
            UTI: 'com.adobe.pdf',
        });

        return true;
    } catch (hata) {
        console.error('PDF oluşturma hatası:', hata);
        Alert.alert(
            'Hata',
            'PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        );
        return false;
    }
}
