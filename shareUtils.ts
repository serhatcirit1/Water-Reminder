// ============================================
// SOSYAL PAYLAŞIM UTILS
// ============================================
// Instagram, Twitter vb. için paylaşım görseli oluşturma

import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import i18n from './locales/i18n';

/**
 * Streak paylaşım verisi
 */
export interface StreakPaylasimiVerisi {
    streak: number;          // Mevcut seri
    gunlukHedef: number;     // ml
    bugunIcilen: number;     // ml
    seviye: number;          // Kullanıcı seviyesi
    rozetSayisi: number;     // Kazanılan rozet sayısı
}

/**
 * Metin tabanlı paylaşım (fallback)
 */
export async function metinPaylas(veri: StreakPaylasimiVerisi): Promise<void> {
    const t = i18n.t;

    const mesaj = `💧 ${t('share.title')}

🔥 ${veri.streak} ${t('share.dayStreak')}
🎯 ${veri.bugunIcilen}/${veri.gunlukHedef} ml
⭐ ${t('share.level')} ${veri.seviye}
🏅 ${veri.rozetSayisi} ${t('share.badges')}

${t('share.downloadApp')} 📱`;

    try {
        await Share.share({
            message: mesaj,
            title: t('share.title'),
        });
    } catch (error) {
        console.error('Paylaşım hatası:', error);
    }
}

/**
 * Görsel paylaşım (Instagram Story için)
 * @param viewRef - Yakalanacak view'ın ref'i
 */
export async function gorselPaylas(viewRef: any): Promise<boolean> {
    try {
        // View'ı PNG olarak yakala
        const uri = await captureRef(viewRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
        });

        // Paylaşım mümkün mü kontrol et
        const paylasimiAcik = await Sharing.isAvailableAsync();

        if (paylasimiAcik) {
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Seri Paylaş',
                UTI: 'public.png',
            });
            return true;
        } else {
            console.log('Paylaşım bu cihazda desteklenmiyor');
            return false;
        }
    } catch (error) {
        console.error('Görsel paylaşım hatası:', error);
        return false;
    }
}

/**
 * Paylaşım için motivasyonel mesaj üret
 */
export function motivasyonelMesajUret(streak: number): string {
    const t = i18n.t;

    if (streak >= 100) {
        return t('share.messages.legendary');
    } else if (streak >= 30) {
        return t('share.messages.monthly');
    } else if (streak >= 14) {
        return t('share.messages.twoWeeks');
    } else if (streak >= 7) {
        return t('share.messages.weekly');
    } else if (streak >= 3) {
        return t('share.messages.started');
    } else {
        return t('share.messages.beginning');
    }
}
