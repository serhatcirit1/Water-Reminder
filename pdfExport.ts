// ============================================
// PDF EXPORT - Premium Aylık Rapor
// ============================================
// Premium kullanıcılar için detaylı PDF raporu

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
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

function getGunAdi(index: number, short: boolean = true): string {
    const days = short ?
        ['short_sun', 'short_mon', 'short_tue', 'short_wed', 'short_thu', 'short_fri', 'short_sat'] :
        ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return i18n.t(`pdf.days.${days[index]}`);
}

function getAyAdi(index: number): string {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return i18n.t(`pdf.months.${months[index]}`);
}

/**
 * AsyncStorage'dan su geçmişini al
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
 * Streak hesapla
 */
export function streakHesapla(gecmis: GecmisVeri, gunlukHedef: number): number {
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
export function detayliAylikIstatistikHesapla(
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
                gun: getGunAdi(date.getDay()),
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
    const enAktifZamanDilimi = i18n.t('pdf.active_time_val', { defaultValue: 'Öğle (12:00-18:00)' });

    return {
        ay: getAyAdi(ay),
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
 * Modern Bar Chart SVG
 */
function modernBarChartSvg(degerler: number[]): string {
    const maxDeger = Math.max(...degerler, 1);
    const height = 120;
    const width = 400;
    const barWidth = 40;
    const gap = 20;
    const borderRadius = 6;

    const bars = degerler.map((deger, i) => {
        const barHeight = (deger / maxDeger) * height;
        const x = i * (barWidth + gap) + 30;
        const y = height - barHeight;

        return `
            <g>
                <rect x="${x}" y="0" width="${barWidth}" height="${height}" rx="${borderRadius}" fill="rgba(255,255,255,0.05)" />
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${borderRadius}" fill="url(#barGradient)" />
                <text x="${x + barWidth / 2}" y="${height + 20}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10" font-weight="600">${i18n.t('pdf.week')} ${i + 1}</text>
                <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" fill="#4FC3F7" font-size="10" font-weight="700">${deger}</text>
            </g>
        `;
    }).join('');

    return `
        <svg width="${width}" height="${height + 40}" viewBox="0 0 ${width} ${height + 40}" style="display: block; margin: 20px auto;">
            <defs>
                <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#4FC3F7;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2196F3;stop-opacity:1" />
                </linearGradient>
            </defs>
            ${bars}
        </svg>
    `;
}

/**
 * Modern Progress Ring SVG
 */
function progressRingSvg(yuzde: number): string {
    const radius = 45;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const offset = circumference - (yuzde / 100) * circumference;

    return `
        <svg height="120" width="120" style="display: block; margin: 0 auto;">
            <circle stroke="rgba(255,255,255,0.1)" stroke-width="${stroke}" fill="transparent" r="${normalizedRadius}" cx="60" cy="60"/>
            <circle stroke="#4FC3F7" stroke-dasharray="${circumference} ${circumference}" style="stroke-dashoffset: ${offset}; transition: stroke-dashoffset 0.35s; transform: rotate(-90deg); transform-origin: 50% 50%;" stroke-width="${stroke}" stroke-linecap="round" fill="transparent" r="${normalizedRadius}" cx="60" cy="60"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="20" font-weight="bold">${yuzde}%</text>
        </svg>
    `;
}

/**
 * Premium HTML rapor şablonu (Aylık)
 */
function premiumHtmlRaporOlustur(ozet: AylikOzet): string {
    const basariOrani = ozet.toplamGun > 0
        ? Math.round((ozet.basariliGunler / ozet.toplamGun) * 100)
        : 0;

    const karsilastirmaRenk = ozet.oncekiAyKarsilastirma >= 0 ? '#4CAF50' : '#FF5252';
    const karsilastirmaIcon = ozet.oncekiAyKarsilastirma >= 0 ? '↗' : '↘';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                    background-color: #050B18;
                    color: #FFFFFF;
                    width: 100%;
                    padding: 40px;
                }
                
                .wrapper {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-square {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #4FC3F7, #2196F3);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
                }

                .brand-name {
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }

                .report-title {
                    text-align: right;
                }

                .report-title h1 {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #4FC3F7;
                    margin-bottom: 4px;
                }

                .report-title p {
                    font-size: 20px;
                    font-weight: 700;
                    opacity: 0.9;
                }

                .hero-card {
                    background: linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(13, 71, 161, 0.05));
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    padding: 40px;
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }

                .hero-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(79, 195, 247, 0.1) 0%, transparent 70%);
                    z-index: 0;
                }

                .hero-content { position: relative; z-index: 1; }
                .hero-label { font-size: 14px; font-weight: 600; opacity: 0.6; margin-bottom: 8px; }
                .hero-value { font-size: 56px; font-weight: 800; line-height: 1; }
                .hero-unit { font-size: 24px; font-weight: 600; color: #4FC3F7; margin-left: 8px; }
                
                .comparison-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 14px;
                    background: ${karsilastirmaRenk}20;
                    color: ${karsilastirmaRenk};
                    border-radius: 100px;
                    font-size: 14px;
                    font-weight: 700;
                    margin-top: 16px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 24px;
                    text-align: center;
                }

                .stat-icon { font-size: 24px; margin-bottom: 12px; }
                .stat-label { font-size: 12px; font-weight: 600; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .stat-value { font-size: 28px; font-weight: 700; }
                .stat-sub { font-size: 12px; opacity: 0.4; margin-top: 4px; }

                .section {
                    margin-bottom: 40px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding: 0 8px;
                }

                .section-title { font-size: 18px; font-weight: 700; }

                .chart-container {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 32px;
                }

                .detail-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 8px;
                }

                .detail-table th {
                    text-align: left;
                    padding: 12px 20px;
                    font-size: 12px;
                    font-weight: 600;
                    opacity: 0.5;
                    text-transform: uppercase;
                }

                .detail-table td {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 16px 20px;
                    font-size: 14px;
                }

                .detail-table tr td:first-child { border-radius: 12px 0 0 12px; font-weight: 700; }
                .detail-table tr td:last-child { border-radius: 0 12px 12px 0; text-align: right; }

                .status-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 8px;
                }

                .status-success { background: #4CAF50; box-shadow: 0 0 8px #4CAF50; }
                .status-fail { background: #FF5252; }

                .footer {
                    margin-top: 60px;
                    text-align: center;
                    padding: 40px 0;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .footer p { font-size: 14px; opacity: 0.4; margin-bottom: 8px; }
                .premium-shield {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 16px;
                    background: linear-gradient(135deg, #FFD700, #FFA000);
                    color: #000;
                    border-radius: 100px;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <header class="header">
                    <div class="brand">
                        <div class="logo-square">💧</div>
                        <div class="brand-name">SU TAKİP</div>
                    </div>
                    <div class="report-title">
                        <h1>${i18n.t('pdf.monthly_report')}</h1>
                        <p>${ozet.ay} ${ozet.yil}</p>
                    </div>
                </header>

                <div class="hero-card">
                    <div class="hero-content">
                        <p class="hero-label">${i18n.t('pdf.total_consumption')}</p>
                        <div class="hero-value">${(ozet.toplamMl / 1000).toFixed(1)}<span class="hero-unit">${i18n.t('pdf.liter')}</span></div>
                        ${ozet.oncekiAyKarsilastirma !== 0 ? `
                        <div class="comparison-badge">
                            ${karsilastirmaIcon} %${Math.abs(ozet.oncekiAyKarsilastirma)} ${i18n.t('pdf.development')}
                        </div>
                        ` : ''}
                    </div>
                    <div class="hero-chart">
                        ${progressRingSvg(basariOrani)}
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <p class="stat-label">${i18n.t('pdf.avg')}</p>
                        <p class="stat-value">${ozet.ortalamaMl}</p>
                        <p class="stat-sub">${i18n.t('pdf.daily_avg_ml')}</p>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <p class="stat-label">Streak</p>
                        <p class="stat-value">${ozet.streak}</p>
                        <p class="stat-sub">${i18n.t('pdf.streak_daily')}</p>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <p class="stat-label">${i18n.t('pdf.target')}</p>
                        <p class="stat-value">${ozet.gunlukHedef}</p>
                        <p class="stat-sub">${i18n.t('pdf.target_desc')}</p>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2 class="section-title">${i18n.t('pdf.weekly_trend')}</h2>
                    </div>
                    <div class="chart-container">
                        ${modernBarChartSvg(ozet.haftalikOrtalamalar)}
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2 class="section-title">${i18n.t('pdf.month_highlights')}</h2>
                    </div>
                    <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="stat-card" style="text-align: left; display: flex; align-items: center; gap: 20px;">
                            <div style="font-size: 32px;">🏆</div>
                            <div>
                                <p class="stat-label">${i18n.t('pdf.best_day')}</p>
                                <p class="stat-value" style="font-size: 20px;">${ozet.enIyiGun ? ozet.enIyiGun.ml + ' ml' : '-'}</p>
                                <p class="stat-sub">${ozet.enIyiGun ? ozet.enIyiGun.tarih : ''}</p>
                            </div>
                        </div>
                        <div class="stat-card" style="text-align: left; display: flex; align-items: center; gap: 20px;">
                            <div style="font-size: 32px;">🕒</div>
                            <div>
                                <p class="stat-label">${i18n.t('pdf.active_time')}</p>
                                <p class="stat-value" style="font-size: 20px;">${ozet.enAktifZamanDilimi}</p>
                                <p class="stat-sub">${i18n.t('pdf.based_on_avg')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <footer class="footer">
                    <p>${i18n.t('pdf.generated_by')}</p>
                    <div class="premium-shield">${i18n.t('pdf.premium_certified')}</div>
                    <p style="margin-top: 20px; opacity: 0.2; font-size: 10px;">${i18n.t('pdf.created_at')}: ${new Date().toLocaleString(i18n.language === 'en' ? 'en-US' : 'tr-TR')}</p>
                </footer>
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
                i18n.t('pdf.no_data_title'),
                i18n.t('pdf.no_data_msg')
            );
            return false;
        }

        const simdi = new Date();
        const ozet = detayliAylikIstatistikHesapla(gecmis, simdi.getMonth(), simdi.getFullYear(), gunlukHedef);

        if (ozet.toplamGun === 0) {
            Alert.alert(
                i18n.t('pdf.no_data_title'),
                i18n.t('pdf.no_data_msg')
            );
            return false;
        }

        const html = premiumHtmlRaporOlustur(ozet);
        const { uri } = await Print.printToFileAsync({ html });

        const paylasilabilir = await Sharing.isAvailableAsync();

        if (!paylasilabilir) {
            Alert.alert(
                i18n.t('pdf.share_unsupported'),
                i18n.t('pdf.share_unsupported')
            );
            return false;
        }

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: i18n.t('pdf.monthly_report'),
            UTI: 'com.adobe.pdf',
        });

        return true;
    } catch (hata) {
        console.error('PDF oluşturma hatası:', hata);
        Alert.alert(
            i18n.t('pdf.error_title'),
            i18n.t('pdf.error_msg')
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
            Alert.alert(i18n.t('pdf.no_data_title'), i18n.t('pdf.no_data_msg'));
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
                gun: getGunAdi(tarih.getDay(), true),
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
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: #050B18;
                        color: white;
                        padding: 40px;
                        min-height: 100vh;
                    }
                    .header { margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
                    .header h1 { font-size: 24px; font-weight: 800; color: #4FC3F7; }
                    
                    .hero-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        margin-bottom: 32px;
                    }

                    .card {
                        background: rgba(255,255,255,0.04);
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 20px;
                        padding: 20px;
                    }

                    .stat-value { font-size: 24px; font-weight: 800; color: #FFFFFF; }
                    .stat-label { font-size: 11px; font-weight: 600; opacity: 0.5; text-transform: uppercase; margin-top: 4px; }
                    
                    .day-list { margin-top: 32px; }
                    .day-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        background: rgba(255,255,255,0.02);
                        margin-bottom: 8px;
                        border-radius: 12px;
                    }
                    .day-info { display: flex; align-items: center; gap: 12px; }
                    .day-name { font-weight: 700; }
                    .day-ml { font-weight: 800; color: #4FC3F7; }
                    
                    .status-tag {
                        padding: 4px 10px;
                        border-radius: 6px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                    }
                    .status-complete { background: #4CAF5020; color: #4CAF50; }
                    .status-incomplete { background: #FF525220; color: #FF5252; }

                    .footer { text-align: center; margin-top: 60px; opacity: 0.3; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${i18n.t('pdf.weekly_report')}</h1>
                    <p style="opacity: 0.5; font-size: 14px;">${gunler[0].tarih} - ${gunler[6].tarih}</p>
                </div>

                <div class="hero-grid">
                    <div class="card">
                        <p class="stat-value">${(toplam / 1000).toFixed(1)}L</p>
                        <p class="stat-label">${i18n.t('pdf.total_consumption')}</p>
                    </div>
                    <div class="card">
                        <p class="stat-value">${ortalama}</p>
                        <p class="stat-label">${i18n.t('pdf.daily_avg_ml')}</p>
                    </div>
                    <div class="card">
                        <p class="stat-value">${basariOrani}%</p>
                        <p class="stat-label">${i18n.t('pdf.goal_success')}</p>
                    </div>
                </div>

                <div class="day-list">
                    ${gunler.map(g => `
                        <div class="day-row">
                            <div class="day-info">
                                <span class="day-name">${g.gun}</span>
                                <span style="opacity: 0.3; font-size: 12px;">${g.tarih}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <span class="day-ml">${g.ml} ml</span>
                                <span class="status-tag ${g.ml >= gunlukHedef ? 'status-complete' : 'status-incomplete'}">
                                    ${g.ml >= gunlukHedef ? i18n.t('pdf.completed') : i18n.t('pdf.incomplete')}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="footer">
                    WATER PREMIUM • PROFESSIONAL REPORTING SYSTEM
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: i18n.t('pdf.weekly_report'),
            UTI: 'com.adobe.pdf',
        });

        return true;
    } catch (hata) {
        console.error('Haftalık PDF hatası:', hata);
        Alert.alert(i18n.t('pdf.error_title'), i18n.t('pdf.error_msg'));
        return false;
    }
}
