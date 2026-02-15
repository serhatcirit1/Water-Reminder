// ============================================
// BİLDİRİM SİSTEMİ - Yardımcı Modül
// ============================================
// Bu dosya bildirim işlemlerini yönetir.
// Ana App.tsx'den ayrı tutarak kodu düzenli tutuyoruz.
// Bu yaklaşıma "Separation of Concerns" (Görevlerin Ayrılması) denir.

import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bildirimGonderildiKaydet } from './aiUtils';
import i18n from './locales/i18n';
import { sessizSaatlerYukle, SessizSaatlerAyar, bioritimAyarYukle, BioritimAyar } from './ayarlarUtils';

// Belirli bir saatin sessiz saatlere düşüp düşmediğini kontrol et
function saatSessizMi(saat: number, ayar: SessizSaatlerAyar): boolean {
    if (!ayar.aktif) return false;
    // Gece yarısını geçen aralık (örn: 22:00 - 07:00)
    if (ayar.baslangic > ayar.bitis) {
        return saat >= ayar.baslangic || saat < ayar.bitis;
    }
    // Normal aralık (örn: 14:00 - 16:00)
    return saat >= ayar.baslangic && saat < ayar.bitis;
}

// Bioritim aktif mi ve saat uygun mu kontrol et
function bioritimUygunMu(saat: number, ayar: BioritimAyar): boolean {
    if (!ayar.aktif) return true; // Bioritim kapalıysa her saat uygun (sessiz saatler ayrıca kontrol edilir)

    const uyanmaSaat = parseInt(ayar.uyanmaSaati.split(':')[0], 10);
    const uyumaSaat = parseInt(ayar.uyumaSaati.split(':')[0], 10);

    // Normal döngü (örn: 08:00 - 23:00)
    if (uyanmaSaat < uyumaSaat) {
        return saat >= uyanmaSaat && saat < uyumaSaat;
    }
    // Gece yarısı geçişi (örn: 10:00 - 02:00)
    else {
        return saat >= uyanmaSaat || saat < uyumaSaat;
    }
}

// --- SABİTLER ---
const BILDIRIM_AYAR_KEY = '@bildirim_ayarlari';

// --- BİLDİRİM AYARLARI ---
// Bu ayarlar bildirimin nasıl görüneceğini belirler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,    // Bildirim göster
        shouldPlaySound: true,    // Ses çal
        shouldSetBadge: true,     // Uygulama ikonunda sayı göster
        shouldShowBanner: true,   // Banner göster (iOS)
        shouldShowList: true,     // Liste göster (iOS)
    }),
});

// --- BİLDİRİM İZNİ İSTEME ---
// iOS'ta bildirim göndermek için kullanıcı izni gerekir
// Android'de genelde otomatik verilir
export async function bildirimIzniIste(): Promise<boolean> {
    try {
        // Fiziksel cihaz mı kontrol et (emülatörde çalışmaz)
        if (!Device.isDevice) {

            return false;
        }

        // Mevcut izin durumunu kontrol et
        const { status: mevcutDurum } = await Notifications.getPermissionsAsync();

        let sonDurum = mevcutDurum;

        // Eğer izin verilmemişse, iste
        if (mevcutDurum !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            sonDurum = status;
        }

        // İzin verildi mi?
        if (sonDurum !== 'granted') {

            return false;
        }

        // Android için bildirim kanalı oluştur
        // (Android 8+ için gerekli)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('su-hatirlatma', {
                name: i18n.t('notif.channel_name'),
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250], // Titreşim paterni
                lightColor: '#4FC3F7', // LED rengi
            });
        }

        return true;
    } catch (hata) {
        console.error('Bildirim izni istenemedi:', hata);
        return false;
    }
}

// --- HATIRLATMA BİLDİRİMİ ZAMANLAMA ---
// Belirli aralıklarla bildirim gönder
export async function hatirlatmalariPlanla(aralikDakika: number = 120): Promise<void> {
    // Önce tüm mevcut bildirimleri iptal et
    await tumBildirimleriIptalEt();

    // Sessiz saatler ayarını yükle
    const sessizAyar = await sessizSaatlerYukle();

    // Yeni bildirimler planla
    // Günde kaç bildirim olacağını hesapla (sabah 8 - gece 22 arası)
    // 14 saatlik süre / aralık = bildirim sayısı
    const gunlukSaat = 14; // Aktif saat sayısı
    const bildirimSayisi = Math.floor((gunlukSaat * 60) / aralikDakika);

    const simdi = new Date();

    // Her bildirim için ayrı zamanlama yap
    for (let i = 1; i <= bildirimSayisi; i++) {
        const saniyeSonra = i * aralikDakika * 60; // Dakikayı saniyeye çevir

        // Bildirimin düşeceği saati hesapla
        const bildirimZamani = new Date(simdi.getTime() + saniyeSonra * 1000);
        const bildirimSaati = bildirimZamani.getHours();

        const sessizAyar = await sessizSaatlerYukle();
        const bioritimAyar = await bioritimAyarYukle();

        // Sessiz saate düşüyorsa bu bildirimi atla
        // Bioritim aktifse, bioritim saatleri dışındaysa atla
        if (bioritimAyar.aktif) {
            if (!bioritimUygunMu(bildirimSaati, bioritimAyar)) continue;
        }
        // Bioritim kapalıysa klasik sessiz saatleri kontrol et
        else if (saatSessizMi(bildirimSaati, sessizAyar)) {
            continue;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: i18n.t('notif.water_time_title'),
                body: getRandomMesaj(), // Her seferinde farklı mesaj
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: saniyeSonra,
                repeats: false, // Tek seferlik
            },
        });
    }
}

// --- TÜM BİLDİRİMLERİ İPTAL ET ---
export async function tumBildirimleriIptalEt(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();

}

// --- ANLIK BİLDİRİM GÖNDER (Test için) ---
export async function testBildirimiGonder(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: i18n.t('notif.test_title'),
            body: i18n.t('notif.test_body'),
            sound: true,
        },
        trigger: {
            type: SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3, // 3 saniye sonra
            repeats: false,
        },
    });
}

// --- GÜNLÜK ÖZET TEST BİLDİRİMİ ---
export async function gunlukOzetTestBildirimi(): Promise<void> {
    try {
        // Mevcut su verisini AsyncStorage'dan al
        let toplamMl = 0;
        let hedef = 2000;

        const suVerisi = await AsyncStorage.getItem('@gunluk_su');
        if (suVerisi) {
            const veri = JSON.parse(suVerisi);
            const bugun = new Date().toDateString();
            if (veri.tarih === bugun) {
                toplamMl = veri.toplamMl || 0;
            }
        }

        const hedefVerisi = await AsyncStorage.getItem('@gunluk_hedef');
        if (hedefVerisi) {
            hedef = parseInt(hedefVerisi, 10);
        }

        const yuzde = hedef > 0 ? Math.round((toplamMl / hedef) * 100) : 0;
        let mesaj = '';

        if (yuzde >= 100) {
            mesaj = i18n.t('notif.goal_reached', { current: toplamMl, goal: hedef });
        } else if (yuzde >= 75) {
            mesaj = i18n.t('notif.goal_almost', { current: toplamMl, goal: hedef, percent: yuzde });
        } else if (yuzde >= 50) {
            mesaj = i18n.t('notif.goal_half', { current: toplamMl, goal: hedef, percent: yuzde });
        } else {
            mesaj = i18n.t('notif.goal_low', { current: toplamMl, goal: hedef });
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: i18n.t('notif.daily_summary_test'),
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
                repeats: false,
            },
        });
    } catch (hata) {
        console.error('Günlük özet test bildirimi gönderilemedi:', hata);
    }
}

// --- HAFTALIK RAPOR TEST BİLDİRİMİ ---
// --- HAFTALIK RAPOR TEST BİLDİRİMİ ---
export async function haftalikRaporTestBildirimi(): Promise<void> {
    try {
        let toplamMl = 0;
        let basari = 0;
        let hedef = 2000;
        const varsayilanBoyut = 250;

        const gecmisVeri = await AsyncStorage.getItem('@su_gecmisi');
        const hedefVeri = await AsyncStorage.getItem('@gunluk_hedef');

        if (hedefVeri) {
            hedef = parseInt(hedefVeri, 10);
        }

        if (gecmisVeri) {
            const gecmis = JSON.parse(gecmisVeri);
            const bugun = new Date();

            // Son 7 günü hesapla
            for (let i = 0; i < 7; i++) {
                const tarih = new Date(bugun);
                tarih.setDate(tarih.getDate() - i);
                const tarihStr = tarih.toISOString().split('T')[0];

                const gunData = gecmis[tarihStr];
                let gunlukMl = 0;

                if (gunData !== undefined) {
                    if (typeof gunData === 'number') {
                        // Eski veri
                        gunlukMl = gunData * varsayilanBoyut;
                    } else if (typeof gunData === 'object') {
                        // Yeni veri { miktar, ml }
                        gunlukMl = gunData.ml || (gunData.miktar * varsayilanBoyut) || 0;
                    }
                }

                toplamMl += gunlukMl;

                // Hedefi karşılaştır
                if (gunlukMl >= hedef) {
                    basari++;
                }
            }
        }

        const ortMl = Math.round(toplamMl / 7);
        let emoji = '📊';
        let mesaj = '';

        if (basari >= 6) {
            emoji = '🏆';
            mesaj = i18n.t('notif.weekly_amazing', { success: basari, total: (toplamMl / 1000).toFixed(1) });
        } else if (basari >= 4) {
            emoji = '💪';
            mesaj = i18n.t('notif.weekly_good', { success: basari, avg: ortMl });
        } else if (basari >= 2) {
            emoji = '🌱';
            mesaj = i18n.t('notif.weekly_growing', { success: basari });
        } else {
            emoji = '💧';
            mesaj = i18n.t('notif.weekly_low', { total: (toplamMl / 1000).toFixed(1) });
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${emoji} ${i18n.t('notif.weekly_report_test')}`,
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
                repeats: false,
            },
        });
    } catch (hata) {
        console.error('Haftalık rapor test bildirimi gönderilemedi:', hata);
    }
}

// --- AKILLI HATIRLATMA BİLDİRİMİ ---
/**
 * Son içme zamanına göre dinamik hatırlatma planla
 * @param sonIcmeDakika Son su içmeden bu yana geçen dakika
 * @param aralikDakika Kaç dakika sonra hatırlatma yapılacak
 */
export async function akilliHatirlatmaPlanla(
    sonIcmeDakika: number,
    aralikDakika: number
): Promise<void> {
    try {
        // Önceki akıllı hatırlatmayı iptal et
        await Notifications.cancelScheduledNotificationAsync('akilli-hatirlatma');

        // Sessiz saatler ayarını yükle
        const sessizAyar = await sessizSaatlerYukle();

        // Kalan süreyi hesapla
        const kalanDakika = Math.max(aralikDakika - sonIcmeDakika, 1);

        // Bildirimin gönderileceği saati hesapla
        const simdi = new Date();
        const bildirimSaati = new Date(simdi.getTime() + kalanDakika * 60 * 1000);
        const saat = bildirimSaati.getHours();

        // Sessiz saate düşüyorsa bildirim gönderme
        const bioritimAyar = await bioritimAyarYukle();

        if (bioritimAyar.aktif) {
            if (!bioritimUygunMu(saat, bioritimAyar)) return;
        } else if (saatSessizMi(saat, sessizAyar)) {
            return;
        }

        // Dinamik mesaj oluştur
        let mesaj = '';
        if (sonIcmeDakika >= aralikDakika) {
            mesaj = i18n.t('notif.time_passed', { minutes: sonIcmeDakika });
        } else {
            mesaj = i18n.t('notif.water_time_general');
        }

        // Adaptif öğrenme için bildirim kaydı
        await bildirimGonderildiKaydet(saat);

        await Notifications.scheduleNotificationAsync({
            identifier: 'akilli-hatirlatma',
            content: {
                title: i18n.t('notif.smart_reminder_title'),
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: kalanDakika * 60,
                repeats: false,
            },
        });

    } catch (hata) {
        console.error('Akıllı hatırlatma planlanamadı:', hata);
    }
}

// --- AKILLI HATIRLATMA TEST ---
export async function akilliHatirlatmaTestBildirimi(): Promise<void> {
    try {
        // Son içme zamanını AsyncStorage'dan al
        let gecenDakika = 0;

        const sonIcmeVeri = await AsyncStorage.getItem('@son_icme_zamani');
        if (sonIcmeVeri) {
            const sonIcme = new Date(sonIcmeVeri);
            const simdi = new Date();
            gecenDakika = Math.floor((simdi.getTime() - sonIcme.getTime()) / (1000 * 60));
        }

        let mesaj = '';
        if (gecenDakika > 0) {
            mesaj = i18n.t('notif.time_passed', { minutes: gecenDakika });
        } else {
            mesaj = i18n.t('notif.no_record_today');
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: i18n.t('notif.smart_reminder_test'),
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
                repeats: false,
            },
        });
    } catch (hata) {
        console.error('Akıllı hatırlatma test bildirimi gönderilemedi:', hata);
    }
}
// --- RASTGELE MOTİVASYON MESAJI ---
// Her bildirimde farklı mesaj göster
export function getRandomMesaj(): string {
    const mesajKeys = ['msg1', 'msg2', 'msg3', 'msg4', 'msg5', 'msg6', 'msg7', 'msg8', 'msg9', 'msg10'];
    const rastgeleIndex = Math.floor(Math.random() * mesajKeys.length);
    return i18n.t(`notif.messages.${mesajKeys[rastgeleIndex]}`);
}

// --- BİLDİRİM AYARLARINI KAYDET ---
export async function bildirimAyarlariniKaydet(
    aktif: boolean,
    aralikDakika: number
): Promise<void> {
    const ayarlar = { aktif, aralikDakika };
    await AsyncStorage.setItem(BILDIRIM_AYAR_KEY, JSON.stringify(ayarlar));

    if (aktif) {
        await hatirlatmalariPlanla(aralikDakika);
    } else {
        await tumBildirimleriIptalEt();
    }
}

// --- BİLDİRİM AYARLARINI YÜKLE ---
export async function bildirimAyarlariniYukle(): Promise<{
    aktif: boolean;
    aralikDakika: number;
}> {
    try {
        const kayitliAyarlar = await AsyncStorage.getItem(BILDIRIM_AYAR_KEY);
        if (kayitliAyarlar) {
            return JSON.parse(kayitliAyarlar);
        }
    } catch (hata) {
        console.error('Bildirim ayarları yüklenemedi:', hata);
    }

    // Varsayılan ayarlar
    return { aktif: true, aralikDakika: 120 };
}

// --- GÜNLÜK ÖZET BİLDİRİMİ ---
const OZET_AYAR_KEY = '@gunluk_ozet_ayar';

export interface GunlukOzetAyar {
    aktif: boolean;
    saat: number; // 0-23 arası saat
}

/**
 * Günlük özet bildirimi ayarını kaydet
 */
export async function gunlukOzetAyarKaydet(ayar: GunlukOzetAyar): Promise<void> {
    try {
        await AsyncStorage.setItem(OZET_AYAR_KEY, JSON.stringify(ayar));
    } catch (hata) {
        console.error('Günlük özet ayarı kaydedilemedi:', hata);
    }
}

/**
 * Günlük özet bildirimi ayarını yükle
 */
export async function gunlukOzetAyarYukle(): Promise<GunlukOzetAyar> {
    try {
        const kayitli = await AsyncStorage.getItem(OZET_AYAR_KEY);
        if (kayitli) {
            return JSON.parse(kayitli);
        }
    } catch (hata) {
        console.error('Günlük özet ayarı yüklenemedi:', hata);
    }
    return { aktif: true, saat: 21 }; // Varsayılan: 21:00
}

/**
 * Günlük özet bildirimini planla
 * Otomatik olarak mevcut su verisini AsyncStorage'dan alır
 */
export async function gunlukOzetPlanla(suMl?: number, hedefMl?: number, saat?: number): Promise<void> {
    try {
        // Önceki özet bildirimlerini iptal et
        await Notifications.cancelScheduledNotificationAsync('gunluk-ozet');

        // Ayarları yükle
        const ozetAyar = await gunlukOzetAyarYukle();
        if (!ozetAyar.aktif && saat === undefined) return;

        const kullanilacakSaat = saat ?? ozetAyar.saat;

        // Mevcut su verisini al
        let toplamMl = suMl;
        let hedef = hedefMl;

        // Eğer değerler dışarıdan gelmediyse Storage'dan çek
        if (toplamMl === undefined || hedef === undefined) {
            try {
                if (toplamMl === undefined) {
                    const suVerisi = await AsyncStorage.getItem('@gunluk_su');
                    if (suVerisi) {
                        const veri = JSON.parse(suVerisi);
                        const bugun = new Date().toDateString();
                        if (veri.tarih === bugun) {
                            toplamMl = veri.toplamMl || 0;
                        } else {
                            toplamMl = 0;
                        }
                    } else {
                        toplamMl = 0;
                    }
                }

                if (hedef === undefined) {
                    const hedefVerisi = await AsyncStorage.getItem('@gunluk_hedef');
                    if (hedefVerisi) {
                        hedef = parseInt(hedefVerisi, 10);
                    } else {
                        hedef = 2500;
                    }
                }
            } catch (e) {
                toplamMl = toplamMl ?? 0;
                hedef = hedef ?? 2500;
            }
        }

        // Bildirim zamanını hesapla
        const simdi = new Date();
        const bildirimZamani = new Date();
        bildirimZamani.setHours(kullanilacakSaat, 0, 0, 0);

        // Eğer belirlenen saat geçtiyse veya çok yakınsa, yarına planla
        // (Gelecek günün verisi henüz bilinmediği için 0 olarak planlanmalı)
        if (simdi >= bildirimZamani) {
            bildirimZamani.setDate(bildirimZamani.getDate() + 1);
            toplamMl = 0; // Yarın için özet 0'dan başlar
        }

        const yuzde = (hedef || 2500) > 0 ? Math.round(((toplamMl || 0) / (hedef || 2500)) * 100) : 0;
        let mesaj = '';

        if (yuzde >= 100) {
            mesaj = i18n.t('notif.goal_reached', { current: toplamMl || 0, goal: hedef });
        } else if (yuzde >= 75) {
            mesaj = i18n.t('notif.goal_almost', { current: toplamMl || 0, goal: hedef, percent: yuzde });
        } else if (yuzde >= 50) {
            mesaj = i18n.t('notif.goal_half', { current: toplamMl || 0, goal: hedef, percent: yuzde });
        } else if ((toplamMl || 0) > 0) {
            mesaj = i18n.t('notif.goal_low', { current: toplamMl || 0, goal: hedef });
        } else {
            // Eğer su hiç içilmediyse (veya yarın için planlanıyorsa)
            mesaj = i18n.t('notif.daily_summary_desc');
        }

        await Notifications.scheduleNotificationAsync({
            identifier: 'gunluk-ozet',
            content: {
                title: i18n.t('notif.daily_summary_title'),
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: bildirimZamani,
            },
        });
    } catch (hata) {
        console.error('Günlük özet planlanamadı:', hata);
    }
}


// --- HAFTALIK RAPOR BİLDİRİMİ ---
const HAFTALIK_RAPOR_KEY = '@haftalik_rapor_ayar';

export interface HaftalikRaporAyar {
    aktif: boolean;
    gun: number; // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    saat: number; // 0-23 arası
}

/**
 * Haftalık rapor ayarını kaydet
 */
export async function haftalikRaporAyarKaydet(ayar: HaftalikRaporAyar): Promise<void> {
    try {
        await AsyncStorage.setItem(HAFTALIK_RAPOR_KEY, JSON.stringify(ayar));
    } catch (hata) {
        console.error('Haftalık rapor ayarı kaydedilemedi:', hata);
    }
}

/**
 * Haftalık rapor ayarını yükle
 */
export async function haftalikRaporAyarYukle(): Promise<HaftalikRaporAyar> {
    try {
        const kayitliAyar = await AsyncStorage.getItem(HAFTALIK_RAPOR_KEY);
        if (kayitliAyar) {
            return JSON.parse(kayitliAyar);
        }
    } catch (hata) {
        console.error('Haftalık rapor ayarı yüklenemedi:', hata);
    }
    return { aktif: true, gun: 0, saat: 20 }; // Varsayılan: Pazar 20:00
}

/**
 * Haftalık rapor bildirimini planla
 * Otomatik olarak haftalık verileri AsyncStorage'dan hesaplar
 */
export async function haftalikRaporPlanla(
    haftalikToplam?: number,
    basariGun?: number,
    ortalama?: number,
    ayar?: HaftalikRaporAyar
): Promise<void> {
    try {
        // Önce mevcut haftalık rapor bildirimini iptal et
        await Notifications.cancelScheduledNotificationAsync('haftalik-rapor');

        // Ayarları yükle (parametre verilmemişse)
        const kullanilacakAyar = ayar || await haftalikRaporAyarYukle();
        if (!kullanilacakAyar.aktif) return;

        // Haftalık verileri hesapla (parametreler verilmemişse)
        let toplam = haftalikToplam ?? 0;
        let basari = basariGun ?? 0;
        let ort = ortalama ?? 0;

        // Eğer parametreler 0 ise, geçmiş verilerden hesapla
        if (toplam === 0 && basari === 0) {
            try {
                const gecmisKey = '@su_gecmisi';
                const hedefKey = '@gunluk_hedef';

                const gecmisVeri = await AsyncStorage.getItem(gecmisKey);
                const hedefVeri = await AsyncStorage.getItem(hedefKey);

                const hedef = hedefVeri ? parseInt(hedefVeri, 10) : 2000;

                if (gecmisVeri) {
                    const gecmis = JSON.parse(gecmisVeri);
                    const bugun = new Date();

                    // Son 7 günü hesapla
                    for (let i = 0; i < 7; i++) {
                        const tarih = new Date(bugun);
                        tarih.setDate(tarih.getDate() - i);
                        const tarihStr = tarih.toISOString().split('T')[0];

                        const gunData = gecmis[tarihStr];
                        let gunlukMl = 0;

                        if (gunData !== undefined) {
                            if (typeof gunData === 'number') {
                                gunlukMl = gunData * 250; // Eski veri
                            } else if (typeof gunData === 'object') {
                                gunlukMl = gunData.ml || (gunData.miktar * 250) || 0;
                            }
                        }

                        toplam += gunlukMl;

                        if (gunlukMl >= hedef) {
                            basari++;
                        }
                    }

                    ort = Math.round(toplam / 7);
                }
            } catch (e) {

            }
        }

        // Mesaj oluştur
        let emoji = '📊';
        let mesaj = '';

        if (basari >= 6) {
            emoji = '🏆';
            mesaj = i18n.t('notif.weekly_amazing', { success: basari, total: toplam });
        } else if (basari >= 4) {
            emoji = '💪';
            mesaj = i18n.t('notif.weekly_good', { success: basari, avg: ort });
        } else if (basari >= 2) {
            emoji = '🌱';
            mesaj = i18n.t('notif.weekly_growing', { success: basari });
        } else {
            emoji = '💧';
            mesaj = i18n.t('notif.weekly_low', { total: toplam });
        }

        // Bir sonraki belirlenen güne planla
        const simdi = new Date();
        const bildirimZamani = new Date();

        // Belirlenen güne git
        const bugunGun = simdi.getDay();
        let gunFarki = kullanilacakAyar.gun - bugunGun;
        if (gunFarki < 0) gunFarki += 7;
        if (gunFarki === 0) {
            // Bugün aynı gün, saat geçtiyse gelecek haftaya
            bildirimZamani.setHours(kullanilacakAyar.saat, 0, 0, 0);
            if (simdi >= bildirimZamani) {
                gunFarki = 7;
            }
        }

        bildirimZamani.setDate(simdi.getDate() + gunFarki);
        bildirimZamani.setHours(kullanilacakAyar.saat, 0, 0, 0);

        await Notifications.scheduleNotificationAsync({
            identifier: 'haftalik-rapor',
            content: {
                title: `${emoji} ${i18n.t('notif.weekly_report_title')}`,
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: bildirimZamani,
            },
        });


    } catch (hata) {
        console.error('Haftalık rapor planlanamadı:', hata);
    }
}

