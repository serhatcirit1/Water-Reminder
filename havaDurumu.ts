// ============================================
// HAVA DURUMU ENTEGRASYONu
// ============================================
// Sıcaklık bazlı hatırlatma sistemi

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SABİTLER ---
const HAVA_DURUMU_KEY = '@hava_durumu';
const CACHE_SURESI = 30 * 60 * 1000; // 30 dakika (milisaniye)

// --- TİPLER ---
export interface HavaDurumuVerisi {
    sicaklik: number; // Celsius
    aciklama: string;
    icon: string;
    sehir: string;
    timestamp: number;
}

// --- FONKSİYONLAR ---

/**
 * Konum izni al ve konumu getir
 */
async function konumAl(): Promise<{ lat: number; lon: number } | null> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Konum izni verilmedi');
            return null;
        }

        const konum = await Location.getCurrentPositionAsync({});
        return {
            lat: konum.coords.latitude,
            lon: konum.coords.longitude,
        };
    } catch (hata) {
        console.error('Konum alınamadı:', hata);
        return null;
    }
}

/**
 * Hava durumu verisi al (Open-Meteo API - Ücretsiz, API key gerektirmez)
 * https://open-meteo.com/ - Açık kaynak, Avrupa hava servisleri tarafından destekleniyor
 */
export async function havaDurumuAl(): Promise<HavaDurumuVerisi | null> {
    try {
        // Önce cache'i kontrol et
        const cachedData = await AsyncStorage.getItem(HAVA_DURUMU_KEY);
        if (cachedData) {
            const cached: HavaDurumuVerisi = JSON.parse(cachedData);
            const simdi = Date.now();
            if (simdi - cached.timestamp < CACHE_SURESI) {
                return cached; // Cache geçerli
            }
        }

        // Konum al
        const konum = await konumAl();
        if (!konum) {
            return getVarsayilanDeger();
        }

        // Open-Meteo API (Ücretsiz, API key gerektirmez)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${konum.lat}&longitude=${konum.lon}&current=temperature_2m,weather_code&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error('Open-Meteo API hatası:', response.status);
            return getVarsayilanDeger();
        }

        const data = await response.json();

        // Weather code'dan açıklama ve icon al
        const weatherCode = data.current?.weather_code || 0;
        const sicaklik = Math.round(data.current?.temperature_2m || 20);
        const { aciklama, icon } = weatherCodeToInfo(weatherCode, sicaklik);

        const havaDurumu: HavaDurumuVerisi = {
            sicaklik,
            aciklama,
            icon,
            sehir: 'Konum',
            timestamp: Date.now(),
        };

        // Cache'e kaydet
        await AsyncStorage.setItem(HAVA_DURUMU_KEY, JSON.stringify(havaDurumu));

        return havaDurumu;
    } catch (hata) {
        console.error('Hava durumu alınamadı:', hata);
        return getVarsayilanDeger();
    }
}

/**
 * Open-Meteo weather code'unu açıklama ve icon'a çevir
 * https://open-meteo.com/en/docs - WMO Weather interpretation codes
 */
function weatherCodeToInfo(code: number, sicaklik: number): { aciklama: string; icon: string } {
    // WMO Weather interpretation codes
    const weatherCodes: { [key: number]: { aciklama: string; icon: string } } = {
        0: { aciklama: 'Açık', icon: '☀️' },
        1: { aciklama: 'Az bulutlu', icon: '🌤️' },
        2: { aciklama: 'Parçalı bulutlu', icon: '⛅' },
        3: { aciklama: 'Bulutlu', icon: '☁️' },
        45: { aciklama: 'Sisli', icon: '🌫️' },
        48: { aciklama: 'Sisli', icon: '🌫️' },
        51: { aciklama: 'Hafif yağmur', icon: '🌧️' },
        53: { aciklama: 'Yağmur', icon: '🌧️' },
        55: { aciklama: 'Yoğun yağmur', icon: '🌧️' },
        61: { aciklama: 'Hafif yağmur', icon: '🌧️' },
        63: { aciklama: 'Yağmur', icon: '🌧️' },
        65: { aciklama: 'Yoğun yağmur', icon: '🌧️' },
        71: { aciklama: 'Hafif kar', icon: '🌨️' },
        73: { aciklama: 'Kar', icon: '❄️' },
        75: { aciklama: 'Yoğun kar', icon: '❄️' },
        77: { aciklama: 'Kar taneleri', icon: '❄️' },
        80: { aciklama: 'Sağanak', icon: '🌦️' },
        81: { aciklama: 'Sağanak', icon: '🌦️' },
        82: { aciklama: 'Şiddetli sağanak', icon: '⛈️' },
        85: { aciklama: 'Kar sağanağı', icon: '🌨️' },
        86: { aciklama: 'Kar sağanağı', icon: '🌨️' },
        95: { aciklama: 'Gök gürültülü', icon: '⛈️' },
        96: { aciklama: 'Dolu ile fırtına', icon: '⛈️' },
        99: { aciklama: 'Şiddetli fırtına', icon: '⛈️' },
    };

    const info = weatherCodes[code] || {
        aciklama: sicaklik > 25 ? 'Sıcak' : sicaklik > 15 ? 'Ilık' : 'Serin',
        icon: sicaklik > 25 ? '☀️' : sicaklik > 15 ? '🌤️' : '🌥️'
    };

    return info;
}

function getVarsayilanDeger(): HavaDurumuVerisi {
    return {
        sicaklik: 20,
        aciklama: 'Veri yok',
        icon: '🌡️',
        sehir: '-',
        timestamp: Date.now(),
    };
}

/**
 * Sıcaklığa göre önerilen hatırlatma aralığı (dakika)
 * Sıcak havalarda daha sık hatırlatma
 */
export function sicakligaGoreAralik(sicaklik: number): number {
    if (sicaklik >= 35) return 30;  // Çok sıcak: 30 dk
    if (sicaklik >= 30) return 45;  // Sıcak: 45 dk
    if (sicaklik >= 25) return 60;  // Ilık: 60 dk
    if (sicaklik >= 15) return 90;  // Normal: 90 dk
    return 120; // Serin: 120 dk
}

/**
 * Sıcaklığa göre motivasyon mesajı
 */
export function sicaklikMesaji(sicaklik: number): string {
    if (sicaklik >= 35) return '🔥 Bugün çok sıcak! Bol su içmeyi unutma!';
    if (sicaklik >= 30) return '☀️ Sıcak bir gün! Su içmeyi ihmal etme!';
    if (sicaklik >= 25) return '🌡️ Ilık bir hava var, su içmeye devam!';
    if (sicaklik >= 15) return '🌤️ Güzel bir hava, sağlıklı kal!';
    return '🌥️ Serin hava olsa da su içmeyi unutma!';
}
