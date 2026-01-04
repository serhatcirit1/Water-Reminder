// ============================================
// SES UTILS - Su Damlası Ses Efekti
// ============================================

import { Audio } from 'expo-av';
import { sesAyarYukle } from './ayarlarUtils';

let sound: Audio.Sound | null = null;

/**
 * Su damlası sesi çal
 */
export async function suSesiCal(): Promise<void> {
    try {
        // Ses ayarı kontrol
        const sesAktif = await sesAyarYukle();
        if (!sesAktif) return;

        // Önceki sesi temizle
        if (sound) {
            await sound.unloadAsync();
        }

        // Yeni ses yükle ve çal
        const { sound: newSound } = await Audio.Sound.createAsync(
            require('./assets/drop.mp3'),
            { shouldPlay: true, volume: 0.5 }
        );
        sound = newSound;

        // Ses bitince temizle
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound?.unloadAsync();
                sound = null;
            }
        });
    } catch (hata) {
        console.log('Ses çalınamadı:', hata);
        // Ses dosyası yoksa sessizce devam et
    }
}

/**
 * Sesi durdur ve temizle
 */
export async function sesiTemizle(): Promise<void> {
    if (sound) {
        await sound.unloadAsync();
        sound = null;
    }
}
