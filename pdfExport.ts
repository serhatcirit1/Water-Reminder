// ============================================
// PDF EXPORT - Premium Aylık Rapor
// ============================================
// Premium kullanıcılar için detaylı PDF raporu

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

interface GunlukVeri {
    tarih: string;
    ml: number;
    gun: string;
}

interface AylikOzet {
    ay: string;
    yil: number;
    toplamMl: number;
    toplamGun: number;
    ortalamaMl: number;
    enIyiGun: { tarih: string; ml: number } | null;
    enKotuGun: { tarih: string; ml: number } | null;
    basariliGunler: number;
    gunlukHedef: number;
    streak: number;
    haftalikOrtalamalar: number[];
    gunlukVeriler: GunlukVeri[];
    oncekiAyKarsilastirma: number; // yüzde değişim
    enAktifZamanDilimi: string;
}

// --- YARDIMCI FONKSİYONLAR ---

const GUN_ADLARI = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

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
 * Streak hesapla
 */
function streakHesapla(gecmis: GecmisVeri, gunlukHedef: number): number {
    const bugun = new Date();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
        const tarih = new Date(bugun);
        tarih.setDate(tarih.getDate() - i);
        const tarihStr = tarih.toISOString().split('T')[0];

        const veri = gecmis[tarihStr];
        const ml = veri?.ml || 0;

        if (ml >= gunlukHedef) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Detaylı aylık istatistik hesapla
 */
function detayliAylikIstatistikHesapla(
    gecmis: GecmisVeri,
    ay: number,
    yil: number,
    gunlukHedef: number
): AylikOzet {
    let toplamMl = 0;
    let toplamGun = 0;
    let enIyiGun: { tarih: string; ml: number } | null = null;
    let enKotuGun: { tarih: string; ml: number } | null = null;
    let basariliGunler = 0;
    const gunlukVeriler: GunlukVeri[] = [];
    const haftalikToplamlar: number[] = [0, 0, 0, 0, 0];

    // Bu aya ait günleri filtrele
    Object.entries(gecmis).forEach(([tarih, kayit]) => {
        const [t_yil, t_ay, t_gun] = tarih.split('-').map(Number);
        if (t_yil === yil && t_ay === ay + 1) {
            toplamMl += kayit.ml;
            toplamGun++;

            const date = new Date(t_yil, t_ay - 1, t_gun);
            const haftaIndeks = Math.floor((t_gun - 1) / 7);

            gunlukVeriler.push({
                tarih,
                ml: kayit.ml,
                gun: GUN_ADLARI[date.getDay()],
            });

            if (haftaIndeks < 5) {
                haftalikToplamlar[haftaIndeks] += kayit.ml;
            }

            if (!enIyiGun || kayit.ml > enIyiGun.ml) {
                enIyiGun = { tarih, ml: kayit.ml };
            }

            if (!enKotuGun || kayit.ml < enKotuGun.ml) {
                enKotuGun = { tarih, ml: kayit.ml };
            }

            if (kayit.ml >= gunlukHedef) {
                basariliGunler++;
            }
        }
    });

    // Önceki ay karşılaştırması
    let oncekiAyToplam = 0;
    let oncekiAyGun = 0;
    const oncekiAy = ay === 0 ? 11 : ay - 1;
    const oncekiYil = ay === 0 ? yil - 1 : yil;

    Object.entries(gecmis).forEach(([tarih, kayit]) => {
        const [t_yil, t_ay] = tarih.split('-').map(Number);
        if (t_yil === oncekiYil && t_ay === oncekiAy + 1) {
            oncekiAyToplam += kayit.ml;
            oncekiAyGun++;
        }
    });

    const buAyOrtalama = toplamGun > 0 ? toplamMl / toplamGun : 0;
    const oncekiAyOrtalama = oncekiAyGun > 0 ? oncekiAyToplam / oncekiAyGun : 0;
    const oncekiAyKarsilastirma = oncekiAyOrtalama > 0
        ? Math.round(((buAyOrtalama - oncekiAyOrtalama) / oncekiAyOrtalama) * 100)
        : 0;

    // Haftalık ortalamalar
    const haftalikOrtalamalar = haftalikToplamlar.map((toplam, i) => {
        const gunSayisi = Math.min(7, gunlukVeriler.filter(v => {
            const gun = parseInt(v.tarih.split('-')[2]);
            return Math.floor((gun - 1) / 7) === i;
        }).length);
        return gunSayisi > 0 ? Math.round(toplam / gunSayisi) : 0;
    });

    // En aktif zaman dilimi (varsayılan)
    const enAktifZamanDilimi = 'Öğle (12:00-18:00)';

    return {
        ay: AY_ADLARI[ay],
        yil,
        toplamMl,
        toplamGun,
        ortalamaMl: toplamGun > 0 ? Math.round(toplamMl / toplamGun) : 0,
        enIyiGun,
        enKotuGun,
        basariliGunler,
        gunlukHedef,
        streak: streakHesapla(gecmis, gunlukHedef),
        haftalikOrtalamalar,
        gunlukVeriler: gunlukVeriler.sort((a, b) => a.tarih.localeCompare(b.tarih)),
        oncekiAyKarsilastirma,
        enAktifZamanDilimi,
    };
}

/**
 * İlerleme çubuğu SVG oluştur
 */
function progressBarSvg(yuzde: number, renk: string = '#4FC3F7'): string {
    const genislik = 200;
    const doluluk = Math.min(100, Math.max(0, yuzde));
    return `
        <svg width="${genislik}" height="12" style="display: block; margin: 10px auto;">
            <rect x="0" y="0" width="${genislik}" height="12" rx="6" fill="rgba(255,255,255,0.2)"/>
            <rect x="0" y="0" width="${(genislik * doluluk) / 100}" height="12" rx="6" fill="${renk}"/>
        </svg>
    `;
}

/**
 * Mini bar chart SVG oluştur
 */
function miniBarChartSvg(degerler: number[]): string {
    const maxDeger = Math.max(...degerler, 1);
    const barWidth = 30;
    const barGap = 8;
    const height = 60;
    const totalWidth = degerler.length * (barWidth + barGap);

    const bars = degerler.map((deger, i) => {
        const barHeight = (deger / maxDeger) * height;
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="rgba(79, 195, 247, 0.8)"/>
                <text x="${x + barWidth / 2}" y="${height + 15}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="10">H${i + 1}</text>`;
    }).join('');

    return `<svg width="${totalWidth}" height="${height + 20}" style="display: block; margin: 15px auto;">${bars}</svg>`;
}

/**
 * Premium HTML rapor şablonu
 */
function premiumHtmlRaporOlustur(ozet: AylikOzet): string {
    const basariOrani = ozet.toplamGun > 0
        ? Math.round((ozet.basariliGunler / ozet.toplamGun) * 100)
        : 0;

    const karsilastirmaRenk = ozet.oncekiAyKarsilastirma >= 0 ? '#4CAF50' : '#F44336';
    const karsilastirmaIcon = ozet.oncekiAyKarsilastirma >= 0 ? '↑' : '↓';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(180deg, #0A1628 0%, #1A237E 50%, #0D47A1 100%);
                    color: white;
                    min-height: 100vh;
                    padding: 30px 20px;
                }
                .header {
                    text-align: center;
                    padding: 20px 0 30px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 25px;
                }
                .header-icon {
                    font-size: 50px;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    margin-bottom: 5px;
                }
                .header .subtitle {
                    font-size: 16px;
                    opacity: 0.7;
                }
                .card {
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                }
                .card-title {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.6;
                    margin-bottom: 8px;
                }
                .card-value {
                    font-size: 36px;
                    font-weight: 700;
                }
                .card-value.small {
                    font-size: 24px;
                }
                .card-subtitle {
                    font-size: 13px;
                    opacity: 0.6;
                    margin-top: 5px;
                }
                .grid {
                    display: flex;
                    gap: 12px;
                }
                .grid .card {
                    flex: 1;
                    text-align: center;
                }
                .streak-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 14px;
                }
                .comparison {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    margin-top: 8px;
                }
                .highlight-card {
                    background: linear-gradient(135deg, rgba(79,195,247,0.3), rgba(33,150,243,0.2));
                    border: 1px solid rgba(79,195,247,0.3);
                }
                .chart-section {
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    padding: 25px 0 10px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    margin-top: 20px;
                }
                .footer-text {
                    font-size: 11px;
                    opacity: 0.5;
                }
                .footer-logo {
                    font-size: 14px;
                    font-weight: 600;
                    opacity: 0.7;
                    margin-bottom: 5px;
                }
                .trophy { color: #FFD700; }
                .water { color: #4FC3F7; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-icon">💧</div>
                <h1>Aylık Performans Raporu</h1>
                <div class="subtitle">${ozet.ay} ${ozet.yil}</div>
            </div>

            <!-- Ana İstatistik -->
            <div class="card highlight-card">
                <div class="card-title">Toplam Su Tüketimi</div>
                <div class="card-value">${(ozet.toplamMl / 1000).toFixed(1)} <span style="font-size: 20px;">Litre</span></div>
                <div class="card-subtitle">${ozet.toplamGun} gün boyunca</div>
                ${ozet.oncekiAyKarsilastirma !== 0 ? `
                <div class="comparison" style="background: ${karsilastirmaRenk}20; color: ${karsilastirmaRenk}">
                    ${karsilastirmaIcon} Önceki aya göre %${Math.abs(ozet.oncekiAyKarsilastirma)}
                </div>
                ` : ''}
            </div>

            <!-- Grid: Ortalama ve Streak -->
            <div class="grid">
                <div class="card">
                    <div class="card-title">Günlük Ortalama</div>
                    <div class="card-value small">${ozet.ortalamaMl}</div>
                    <div class="card-subtitle">ml/gün</div>
                </div>
                <div class="card">
                    <div class="card-title">🔥 Streak</div>
                    <div class="card-value small">${ozet.streak}</div>
                    <div class="card-subtitle">gün üst üste</div>
                </div>
            </div>

            <!-- Hedef Başarısı -->
            <div class="card">
                <div class="card-title">Hedef Başarı Oranı</div>
                <div class="card-value">${basariOrani}%</div>
                ${progressBarSvg(basariOrani)}
                <div class="card-subtitle">${ozet.basariliGunler} / ${ozet.toplamGun} gün hedefe ulaştın</div>
            </div>

            <!-- Haftalık Trend -->
            <div class="card chart-section">
                <div class="card-title">Haftalık Trend</div>
                ${miniBarChartSvg(ozet.haftalikOrtalamalar)}
                <div class="card-subtitle">Haftalık ortalama tüketim (ml)</div>
            </div>

            <!-- En İyi ve En Kötü Gün -->
            <div class="grid">
                ${ozet.enIyiGun ? `
                <div class="card">
                    <div class="card-title"><span class="trophy">🏆</span> En İyi Gün</div>
                    <div class="card-value small">${ozet.enIyiGun.ml}</div>
                    <div class="card-subtitle">${ozet.enIyiGun.tarih}</div>
                </div>
                ` : ''}
                ${ozet.enKotuGun && ozet.toplamGun > 1 ? `
                <div class="card">
                    <div class="card-title">📉 En Düşük</div>
                    <div class="card-value small">${ozet.enKotuGun.ml}</div>
                    <div class="card-subtitle">${ozet.enKotuGun.tarih}</div>
                </div>
                ` : ''}
            </div>

            <!-- Hedef Bilgisi -->
            <div class="card">
                <div class="card-title">🎯 Günlük Hedefin</div>
                <div class="card-value small">${ozet.gunlukHedef} <span style="font-size: 14px;">ml</span></div>
            </div>

            <div class="footer">
                <div class="footer-logo">💧 Su Takip Premium</div>
                <div class="footer-text">Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturuldu</div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Premium aylık PDF raporu oluştur ve paylaş
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

        const simdi = new Date();
        const ozet = detayliAylikIstatistikHesapla(gecmis, simdi.getMonth(), simdi.getFullYear(), gunlukHedef);

        if (ozet.toplamGun === 0) {
            Alert.alert(
                'Veri Bulunamadı',
                'Bu ay için kayıtlı veri yok.'
            );
            return false;
        }

        const html = premiumHtmlRaporOlustur(ozet);
        const { uri } = await Print.printToFileAsync({ html });

        const paylasilabilir = await Sharing.isAvailableAsync();

        if (!paylasilabilir) {
            Alert.alert(
                'Paylaşım Desteklenmiyor',
                'Bu cihazda dosya paylaşımı desteklenmiyor.'
            );
            return false;
        }

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

/**
 * Haftalık PDF raporu oluştur
 */
export async function haftalikPdfOlusturVePaylas(gunlukHedef: number = 2000): Promise<boolean> {
    try {
        const gecmis = await suGecmisiniYukle();

        if (Object.keys(gecmis).length === 0) {
            Alert.alert('Veri Bulunamadı', 'Rapor için veri yok.');
            return false;
        }

        // Son 7 günü al
        const bugun = new Date();
        const gunler: { tarih: string; ml: number; gun: string }[] = [];
        let toplam = 0;
        let basarili = 0;

        for (let i = 6; i >= 0; i--) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];
            const veri = gecmis[tarihStr];
            const ml = veri?.ml || 0;

            gunler.push({
                tarih: tarihStr,
                ml,
                gun: GUN_ADLARI[tarih.getDay()],
            });

            toplam += ml;
            if (ml >= gunlukHedef) basarili++;
        }

        const ortalama = Math.round(toplam / 7);
        const basariOrani = Math.round((basarili / 7) * 100);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                        background: linear-gradient(180deg, #1A237E, #0D47A1);
                        color: white;
                        padding: 30px;
                        min-height: 100vh;
                    }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { font-size: 24px; }
                    .card {
                        background: rgba(255,255,255,0.1);
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 12px;
                    }
                    .day-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .day-name { font-weight: 600; }
                    .day-ml { color: #4FC3F7; font-weight: 700; }
                    .stat { text-align: center; }
                    .stat-value { font-size: 28px; font-weight: 700; }
                    .stat-label { opacity: 0.7; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="font-size: 40px;">📊</div>
                    <h1>Haftalık Rapor</h1>
                    <p style="opacity: 0.7;">Son 7 Gün</p>
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                    <div class="card stat" style="flex: 1;">
                        <div class="stat-value">${(toplam / 1000).toFixed(1)}L</div>
                        <div class="stat-label">Toplam</div>
                    </div>
                    <div class="card stat" style="flex: 1;">
                        <div class="stat-value">${ortalama}</div>
                        <div class="stat-label">Ortalama (ml)</div>
                    </div>
                    <div class="card stat" style="flex: 1;">
                        <div class="stat-value">${basariOrani}%</div>
                        <div class="stat-label">Başarı</div>
                    </div>
                </div>

                <div class="card">
                    ${gunler.map(g => `
                        <div class="day-row">
                            <span class="day-name">${g.gun} (${g.tarih.slice(5)})</span>
                            <span class="day-ml">${g.ml} ml ${g.ml >= gunlukHedef ? '✓' : ''}</span>
                        </div>
                    `).join('')}
                </div>

                <div style="text-align: center; margin-top: 30px; opacity: 0.5; font-size: 11px;">
                    Su Takip Premium • ${new Date().toLocaleDateString('tr-TR')}
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Haftalık Rapor',
            UTI: 'com.adobe.pdf',
        });

        return true;
    } catch (hata) {
        console.error('Haftalık PDF hatası:', hata);
        Alert.alert('Hata', 'Rapor oluşturulamadı.');
        return false;
    }
}
