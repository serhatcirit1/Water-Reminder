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
    // Fiziksel cihaz mı kontrol et (emülatörde çalışmaz)
    if (!Device.isDevice) {
        console.log('Bildirimler sadece fiziksel cihazda çalışır');
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
        console.log('Bildirim izni reddedildi');
        return false;
    }

    // Android için bildirim kanalı oluştur
    // (Android 8+ için gerekli)
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('su-hatirlatma', {
            name: 'Su Hatırlatma',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250], // Titreşim paterni
            lightColor: '#4FC3F7', // LED rengi
        });
    }

    return true;
}

// --- HATIRLATMA BİLDİRİMİ ZAMANLAMA ---
// Belirli aralıklarla bildirim gönder
export async function hatirlatmalariPlanla(aralikDakika: number = 120): Promise<void> {
    // Önce tüm mevcut bildirimleri iptal et
    await tumBildirimleriIptalEt();

    // Yeni bildirimler planla
    // Günde kaç bildirim olacağını hesapla (sabah 8 - gece 22 arası)
    // 14 saatlik süre / aralık = bildirim sayısı
    const gunlukSaat = 14; // Aktif saat sayısı
    const bildirimSayisi = Math.floor((gunlukSaat * 60) / aralikDakika);

    // Her bildirim için ayrı zamanlama yap
    for (let i = 1; i <= bildirimSayisi; i++) {
        const saniyeSonra = i * aralikDakika * 60; // Dakikayı saniyeye çevir

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '💧 Su İçme Zamanı!',
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

    console.log(`${bildirimSayisi} bildirim planlandı (${aralikDakika} dakika aralıkla)`);
}

// --- TÜM BİLDİRİMLERİ İPTAL ET ---
export async function tumBildirimleriIptalEt(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Tüm planlanmış bildirimler iptal edildi');
}

// --- ANLIK BİLDİRİM GÖNDER (Test için) ---
export async function testBildirimiGonder(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '💧 Test Bildirimi',
            body: 'Bildirimler çalışıyor! Su içmeyi unutma 💪',
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

        const suVerisi = await AsyncStorage.getItem('@su_sayaci');
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
            mesaj = `🎉 Bugün hedefine ulaştın! ${toplamMl}/${hedef} ml içtin. Harikasın!`;
        } else if (yuzde >= 75) {
            mesaj = `💪 Bugün ${toplamMl}/${hedef} ml içtin (%${yuzde}). Neredeyse hedefe ulaştın!`;
        } else if (yuzde >= 50) {
            mesaj = `💧 Bugün ${toplamMl}/${hedef} ml içtin (%${yuzde}). Devam et!`;
        } else {
            mesaj = `🌊 Bugün ${toplamMl}/${hedef} ml içtin (%${yuzde}). Daha fazla su iç!`;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📊 Günlük Özet (Test)',
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
            mesaj = `Muhteşem! ${basari}/7 gün hedefe ulaştın. Toplam ${(toplamMl / 1000).toFixed(1)}L su içtin.`;
        } else if (basari >= 4) {
            emoji = '💪';
            mesaj = `İyi iş! ${basari}/7 gün hedefe ulaştın. Ortalama ${ortMl} ml/gün.`;
        } else if (basari >= 2) {
            emoji = '🌱';
            mesaj = `${basari}/7 gün hedefe ulaştın. Gelecek hafta daha iyi!`;
        } else {
            emoji = '💧';
            mesaj = `Bu hafta toplam ${(toplamMl / 1000).toFixed(1)}L içtin. Düzenli içmeye çalış!`;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${emoji} Haftalık Rapor (Test)`,
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

        // Kalan süreyi hesapla
        const kalanDakika = Math.max(aralikDakika - sonIcmeDakika, 1);

        // Dinamik mesaj oluştur
        let mesaj = '';
        if (sonIcmeDakika >= aralikDakika) {
            mesaj = `⏰ ${sonIcmeDakika} dakikadır su içmedin! Şimdi bir bardak su iç 💧`;
        } else {
            mesaj = `💧 Su içme zamanı geldi! Sağlığın için bir bardak su iç 💪`;
        }

        // Bildirimin gönderileceği saati hesapla
        const simdi = new Date();
        const bildirimSaati = new Date(simdi.getTime() + kalanDakika * 60 * 1000);
        const saat = bildirimSaati.getHours();

        // Adaptif öğrenme için bildirim kaydı
        await bildirimGonderildiKaydet(saat);

        await Notifications.scheduleNotificationAsync({
            identifier: 'akilli-hatirlatma',
            content: {
                title: '🧠 Akıllı Hatırlatma',
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: kalanDakika * 60,
                repeats: false,
            },
        });

        console.log(`Akıllı hatırlatma planlandı: ${kalanDakika} dakika sonra (saat ${saat})`);
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
            mesaj = `⏰ ${gecenDakika} dakikadır su içmedin! Şimdi bir bardak su iç 💧`;
        } else {
            mesaj = `💧 Henüz bugün su içme kaydın yok. Hadi başla! 💪`;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🧠 Akıllı Hatırlatma (Test)',
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
function getRandomMesaj(): string {
    const mesajlar = [
        'Sağlıklı kalmak için bir bardak su iç! 💪',
        'Vücudun su bekliyor, haydi iç! 🌊',
        'Su içmek cildini güzelleştirir ✨',
        'Enerji için su şart! ⚡',
        'Beynin su istiyor, konsantrasyonunu artır! 🧠',
        'Metabolizmanı hızlandır, su iç! 🏃',
        'Suyun yoksa enerjin de yok! 💧',
        'Günlük hedefe yaklaş, bir bardak daha! 🎯',
        'Su içmek baş ağrısını önler 🩺',
        'Sağlığın için şimdi su iç! ❤️',
    ];

    const rastgeleIndex = Math.floor(Math.random() * mesajlar.length);
    return mesajlar[rastgeleIndex];
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
    return { aktif: false, aralikDakika: 120 };
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
    return { aktif: false, saat: 21 }; // Varsayılan: 21:00
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

        // Mevcut su verisini AsyncStorage'dan al
        let toplamMl = suMl ?? 0;
        let hedef = hedefMl ?? 2000;

        try {
            // Su sayacı verisini al
            const suVerisi = await AsyncStorage.getItem('@su_sayaci');
            if (suVerisi) {
                const veri = JSON.parse(suVerisi);
                const bugun = new Date().toDateString();
                if (veri.tarih === bugun) {
                    toplamMl = veri.toplamMl || 0;
                }
            }

            // Hedefi al
            const hedefVerisi = await AsyncStorage.getItem('@gunluk_hedef');
            if (hedefVerisi) {
                hedef = parseInt(hedefVerisi, 10);
            }
        } catch (e) {
            console.log('Su verisi alınamadı, varsayılan değerler kullanılıyor');
        }

        const yuzde = hedef > 0 ? Math.round((toplamMl / hedef) * 100) : 0;
        let mesaj = '';

        if (yuzde >= 100) {
            mesaj = `🎉 Bugün hedefine ulaştın! ${toplamMl}/${hedef} ml içtin. Harikasın!`;
        } else if (yuzde >= 75) {
            mesaj = `💪 Bugün ${toplamMl}/${hedef} ml içtin (%${yuzde}). Neredeyse hedefe ulaştın!`;
        } else if (yuzde >= 50) {
            mesaj = `💧 Bugün ${toplamMl}/${hedef} ml içtin (%${yuzde}). Yarın daha iyisini yapabilirsin!`;
        } else {
            mesaj = `🌊 Bugün ${toplamMl}/${hedef} ml içtin. Yarın daha fazla su içmeyi unutma!`;
        }

        // Bugün belirlenen saatte bildirim planla
        const simdi = new Date();
        const bildirimZamani = new Date();
        bildirimZamani.setHours(kullanilacakSaat, 0, 0, 0);

        // Eğer belirlenen saat geçtiyse, yarına planla
        if (simdi >= bildirimZamani) {
            bildirimZamani.setDate(bildirimZamani.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
            identifier: 'gunluk-ozet',
            content: {
                title: '📊 Günlük Özet',
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: bildirimZamani,
            },
        });

        console.log('Günlük özet planlandı:', bildirimZamani);
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
    return { aktif: false, gun: 0, saat: 20 }; // Varsayılan: Pazar 20:00
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

                        const gunlukMiktar = gecmis[tarihStr] || 0;
                        toplam += gunlukMiktar;

                        // Bardak boyutunu varsayılan olarak 250ml al
                        if (gunlukMiktar * 250 >= hedef) {
                            basari++;
                        }
                    }

                    ort = Math.round(toplam / 7);
                }
            } catch (e) {
                console.log('Haftalık veriler hesaplanamadı, varsayılan değerler kullanılıyor');
            }
        }

        // Mesaj oluştur
        let emoji = '📊';
        let mesaj = '';

        if (basari >= 6) {
            emoji = '🏆';
            mesaj = `Muhteşem bir hafta! ${basari}/7 gün hedefe ulaştın. Toplam ${toplam} bardak su içtin.`;
        } else if (basari >= 4) {
            emoji = '💪';
            mesaj = `İyi iş! ${basari}/7 gün hedefe ulaştın. Ortalama günlük ${ort} bardak.`;
        } else if (basari >= 2) {
            emoji = '🌱';
            mesaj = `${basari}/7 gün hedefe ulaştın. Gelecek hafta daha iyi olabilir!`;
        } else {
            emoji = '💧';
            mesaj = `Bu hafta ${toplam} bardak su içtin. Hatırlatmaları açmayı dene!`;
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
                title: `${emoji} Haftalık Rapor`,
                body: mesaj,
                sound: true,
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: bildirimZamani,
            },
        });

        console.log('Haftalık rapor planlandı:', bildirimZamani);
    } catch (hata) {
        console.error('Haftalık rapor planlanamadı:', hata);
    }
}

