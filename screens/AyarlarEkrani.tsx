// ============================================
// AYARLAR EKRANI
// ============================================
// Bildirim ayarları, hedef ve uygulama bilgileri

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity, Switch, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PickerModal, TimePickerModal } from '../components/PickerModal';
import { PremiumEkrani } from './index';
import {
    bildirimIzniIste,
    bildirimAyarlariniKaydet,
    bildirimAyarlariniYukle,
    testBildirimiGonder,
    gunlukOzetAyarKaydet,
    gunlukOzetAyarYukle,
    GunlukOzetAyar,
    gunlukOzetPlanla,
    haftalikRaporAyarKaydet,
    haftalikRaporAyarYukle,
    HaftalikRaporAyar,
    haftalikRaporPlanla,
    gunlukOzetTestBildirimi,
    haftalikRaporTestBildirimi,
    akilliHatirlatmaTestBildirimi,
} from '../bildirimler';
import {
    hedefKaydet, hedefYukle, HEDEF_SECENEKLERI,
    bardakBoyutuKaydet, bardakBoyutuYukle, BARDAK_SECENEKLERI,
    sessizSaatlerKaydet, sessizSaatlerYukle, SessizSaatlerAyar,
    sesAyarKaydet, sesAyarYukle,
    profilKaydet, profilYukle, KullaniciProfil, onerilenSuHesapla,
    akilliHatirlatmaAyarKaydet, akilliHatirlatmaAyarYukle, AkilliHatirlatmaAyar,
    bioritimAyarKaydet, bioritimAyarYukle, BioritimAyar,
    detoksAyarKaydet, detoksAyarYukle, DetoksAyar
} from '../ayarlarUtils';
import { useTema } from '../TemaContext';
import { healthKitDestekleniyor, healthKitAyarYukle, healthKitToggle, dinamikHedefAyarYukle, dinamikHedefAyarKaydet, dinamikHedefHesapla, DinamikHedefSonuc } from '../healthKit';
import { aiAyarlariniYukle, aiAyarlariniKaydet, AIAyarlari } from '../aiUtils';
import { usePremium } from '../PremiumContext';
import { premiumDurumKaydet } from '../premiumUtils';
import { csvOlusturVePaylas } from '../exportUtils';
import { aylikPdfOlusturVePaylas, haftalikPdfOlusturVePaylas } from '../pdfExport';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage, getCurrentLanguage } from '../locales/i18n';


// --- COMPONENT ---
export function AyarlarEkrani() {
    const [bildirimAktif, setBildirimAktif] = useState(false);
    const [hatirlatmaAraligi, setHatirlatmaAraligi] = useState(120);
    const [gunlukHedef, setGunlukHedef] = useState(2000);
    const [bardakBoyutu, setBardakBoyutu] = useState(250);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [sessizSaatler, setSessizSaatler] = useState<SessizSaatlerAyar>({
        aktif: false, baslangic: 22, bitis: 7
    });
    const [sesAktif, setSesAktif] = useState(true);
    const [profil, setProfil] = useState<KullaniciProfil>({
        kilo: 70, yas: 30, aktifMi: false
    });
    const [gunlukOzet, setGunlukOzet] = useState<GunlukOzetAyar>({
        aktif: false, saat: 21
    });
    const [haftalikRapor, setHaftalikRapor] = useState<HaftalikRaporAyar>({
        aktif: false, gun: 0, saat: 20
    });
    const [akilliHatirlatma, setAkilliHatirlatma] = useState<AkilliHatirlatmaAyar>({
        aktif: false, aralikDakika: 90
    });
    const [healthKitAktif, setHealthKitAktif] = useState(false);
    const [dinamikHedefAktif, setDinamikHedefAktif] = useState(false);
    const [dinamikHedefSonuc, setDinamikHedefSonuc] = useState<DinamikHedefSonuc | null>(null);
    const [bioritim, setBioritim] = useState<BioritimAyar>({
        aktif: false, uyanmaSaati: '08:00', uyumaSaati: '23:00'
    });
    const [detoks, setDetoks] = useState<DetoksAyar>({ aktif: false });
    const [aiAktif, setAiAktif] = useState(true);

    // Premium Context
    const { isPremium: premiumAktif, setPremium } = usePremium();

    // Modal State'leri
    const [hedefModalGoster, setHedefModalGoster] = useState(false);
    const [bildirimAralikModalGoster, setBildirimAralikModalGoster] = useState(false);
    const [sessizBaslangicModalGoster, setSessizBaslangicModalGoster] = useState(false);
    const [sessizBitisModalGoster, setSessizBitisModalGoster] = useState(false);
    const [akilliAralikModalGoster, setAkilliAralikModalGoster] = useState(false);
    const [bioritimUyanmaModalGoster, setBioritimUyanmaModalGoster] = useState(false);
    const [bioritimUyumaModalGoster, setBioritimUyumaModalGoster] = useState(false);
    const [premiumModalGoster, setPremiumModalGoster] = useState(false);
    const [dilModalGoster, setDilModalGoster] = useState(false);

    // Tema hook
    const { mod, renkler, modDegistir, otomatikMod, otomatikModDegistir } = useTema();
    const { t } = useTranslation();
    const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

    useEffect(() => {
        ayarlariYukle();
    }, []);

    const ayarlariYukle = async () => {
        try {
            const bildirimAyarlar = await bildirimAyarlariniYukle();
            setBildirimAktif(bildirimAyarlar.aktif);
            setHatirlatmaAraligi(bildirimAyarlar.aralikDakika);

            const hedef = await hedefYukle();
            setGunlukHedef(hedef);

            const boyut = await bardakBoyutuYukle();
            setBardakBoyutu(boyut);

            const sessiz = await sessizSaatlerYukle();
            setSessizSaatler(sessiz);

            const ses = await sesAyarYukle();
            setSesAktif(ses);

            const kullaniciProfil = await profilYukle();
            setProfil(kullaniciProfil);

            const ozetAyar = await gunlukOzetAyarYukle();
            setGunlukOzet(ozetAyar);

            const akilliAyar = await akilliHatirlatmaAyarYukle();
            setAkilliHatirlatma(akilliAyar);

            const haftalikAyar = await haftalikRaporAyarYukle();
            setHaftalikRapor(haftalikAyar);

            // HealthKit durumunu yükle
            const hkAktif = await healthKitAyarYukle();
            setHealthKitAktif(hkAktif);

            // Dinamik hedef ayarını yükle
            const dhAktif = await dinamikHedefAyarYukle();
            setDinamikHedefAktif(dhAktif);

            // Bioritim ve Detoks yükle
            const bioAyar = await bioritimAyarYukle();
            setBioritim(bioAyar);
            const detAyar = await detoksAyarYukle();
            setDetoks(detAyar);

            // AI ayarlarını yükle
            const aiAyar = await aiAyarlariniYukle();
            setAiAktif(aiAyar.aktif);
        } catch (hata) {
            console.error('Ayarlar yüklenemedi:', hata);
        } finally {
            setYukleniyor(false);
        }
    };

    // Bildirim aç/kapa
    const bildirimDurumuDegistir = async (yeniDeger: boolean) => {
        setBildirimAktif(yeniDeger);
        if (yeniDeger) {
            const izinVar = await bildirimIzniIste();
            if (!izinVar) {
                setBildirimAktif(false);
                Alert.alert(
                    t('alerts.permissionRequired'),
                    t('alerts.notificationPermission')
                );
                return;
            }
        }
        await bildirimAyarlariniKaydet(yeniDeger, hatirlatmaAraligi);
    };

    // Aralık değiştir
    const aralikDegistir = async (yeniAralik: number) => {
        setHatirlatmaAraligi(yeniAralik);
        if (bildirimAktif) {
            await bildirimAyarlariniKaydet(true, yeniAralik);
        }
    };


    // Hedef değiştir
    const hedefDegistir = async (yeniHedef: number) => {
        setGunlukHedef(yeniHedef);
        await hedefKaydet(yeniHedef);
    };

    // Bardak boyutu değiştir
    const bardakDegistir = async (yeniBoyut: number) => {
        setBardakBoyutu(yeniBoyut);
        await bardakBoyutuKaydet(yeniBoyut);
    };

    // Sessiz saatler aç/kapa
    const sessizSaatlerDegistir = async (aktif: boolean) => {
        const yeniAyar = { ...sessizSaatler, aktif };
        setSessizSaatler(yeniAyar);
        await sessizSaatlerKaydet(yeniAyar);
    };

    // Ses aç/kapa
    const sesDegistir = async (aktif: boolean) => {
        setSesAktif(aktif);
        await sesAyarKaydet(aktif);
    };

    // Profil değiştir
    const profilDegistir = async (yeniProfil: KullaniciProfil) => {
        setProfil(yeniProfil);
        await profilKaydet(yeniProfil);
    };

    // Önerilen hedefi uygula (ml cinsinden - 250 ml katları)
    const oneriUygula = async () => {
        const onerilenMl = onerilenSuHesapla(profil, bardakBoyutu);
        setGunlukHedef(onerilenMl);
        await hedefKaydet(onerilenMl);
        Alert.alert(t('alerts.goalUpdated'), t('alerts.goalUpdatedMsg', { goal: onerilenMl }));
    };

    // AI özelliklerini aç/kapat
    const aiDegistir = async (aktif: boolean) => {
        setAiAktif(aktif);
        await aiAyarlariniKaydet({ aktif });
        if (aktif) {
            Alert.alert(t('alerts.aiActive'), t('alerts.aiActiveMsg'));
        }
    };

    // Günlük özet aç/kapa
    const gunlukOzetDegistir = async (aktif: boolean) => {
        const yeniAyar = { ...gunlukOzet, aktif };
        setGunlukOzet(yeniAyar);
        await gunlukOzetAyarKaydet(yeniAyar);

        // Aktifse bildirimi planla (su verisi otomatik alınır)
        if (aktif) {
            await gunlukOzetPlanla(undefined, undefined, yeniAyar.saat);
        }
    };

    // Haftalık rapor aç/kapa
    const haftalikRaporDegistir = async (aktif: boolean) => {
        const yeniAyar = { ...haftalikRapor, aktif };
        setHaftalikRapor(yeniAyar);
        await haftalikRaporAyarKaydet(yeniAyar);

        // Aktifse bildirimi planla (haftalık veriler otomatik hesaplanır)
        if (aktif) {
            await haftalikRaporPlanla(undefined, undefined, undefined, yeniAyar);
        }
    };

    // Akıllı hatırlatma aç/kapa
    const akilliHatirlatmaDegistir = async (aktif: boolean) => {
        const yeniAyar = { ...akilliHatirlatma, aktif };
        setAkilliHatirlatma(yeniAyar);
        await akilliHatirlatmaAyarKaydet(yeniAyar);
    };

    if (yukleniyor) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.yukleniyorYazi}>⚙️ {t('common.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            <ScrollView style={[styles.container, { backgroundColor: renkler.arkaplan }]}>
                {/* Başlık */}
                <Text style={styles.baslik}>⚙️ {t('settings.title')}</Text>

                {/* Premium Banner */}
                {!premiumAktif && (
                    <TouchableOpacity
                        style={styles.premiumBanner}
                        onPress={() => setPremiumModalGoster(true)}
                    >
                        <LinearGradient
                            colors={['#FFD700', '#FFA000']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.premiumBannerGradient}
                        >
                            <View style={styles.premiumBannerContent}>
                                <View style={styles.premiumBannerTextContainer}>
                                    <Text style={styles.premiumBannerTitle}>{t('home.premiumBannerTitle')}</Text>
                                    <Text style={styles.premiumBannerSubtitle}>{t('home.premiumBannerSubtitle')}</Text>
                                </View>
                                <View style={styles.premiumBannerBadge}>
                                    <Text style={styles.premiumBannerBadgeText}>{t('home.explore')}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Kişiselleştirilmiş Hedef */}
                <View style={[styles.hedefContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.hedefBaslik}>📐 {t('settings.personalizedGoal')}</Text>
                    <Text style={styles.hedefAciklama}>
                        {t('settings.personalizedGoalDesc')}
                    </Text>

                    {/* Cinsiyet */}
                    <View style={styles.profilSatir}>
                        <Text style={styles.profilEtiket}>{t('onboarding.gender')}</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[
                                    styles.profilButon,
                                    { paddingHorizontal: 12, backgroundColor: profil.cinsiyet === 'erkek' ? '#4FC3F7' : 'transparent' }
                                ]}
                                onPress={() => profilDegistir({ ...profil, cinsiyet: 'erkek' })}
                            >
                                <Text style={[styles.profilButonYazi, { color: profil.cinsiyet === 'erkek' ? '#fff' : '#4FC3F7' }]}>
                                    👨 {t('onboarding.male')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.profilButon,
                                    { paddingHorizontal: 12, backgroundColor: profil.cinsiyet === 'kadin' ? '#4FC3F7' : 'transparent' }
                                ]}
                                onPress={() => profilDegistir({ ...profil, cinsiyet: 'kadin' })}
                            >
                                <Text style={[styles.profilButonYazi, { color: profil.cinsiyet === 'kadin' ? '#fff' : '#4FC3F7' }]}>
                                    👩 {t('onboarding.female')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Boy */}
                    <View style={styles.profilSatir}>
                        <Text style={styles.profilEtiket}>{t('onboarding.height')}</Text>
                        <View style={styles.profilDegerler}>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, boy: Math.max(100, (profil.boy || 170) - 5) })}
                            >
                                <Text style={styles.profilButonYazi}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.profilDeger}>{profil.boy || 170} cm</Text>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, boy: Math.min(220, (profil.boy || 170) + 5) })}
                            >
                                <Text style={styles.profilButonYazi}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Kilo */}
                    <View style={styles.profilSatir}>
                        <Text style={styles.profilEtiket}>{t('settings.weight')}</Text>
                        <View style={styles.profilDegerler}>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, kilo: Math.max(30, profil.kilo - 5) })}
                            >
                                <Text style={styles.profilButonYazi}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.profilDeger}>{profil.kilo} kg</Text>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, kilo: Math.min(150, profil.kilo + 5) })}
                            >
                                <Text style={styles.profilButonYazi}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Yaş */}
                    <View style={styles.profilSatir}>
                        <Text style={styles.profilEtiket}>{t('settings.age')}</Text>
                        <View style={styles.profilDegerler}>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, yas: Math.max(10, profil.yas - 5) })}
                            >
                                <Text style={styles.profilButonYazi}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.profilDeger}>{profil.yas} {t('alerts.age')}</Text>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, yas: Math.min(100, profil.yas + 5) })}
                            >
                                <Text style={styles.profilButonYazi}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Aktif Yaşam */}
                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {profil.aktifMi ? t('alerts.activeLifestyle') : t('alerts.normalLifestyle')}
                        </Text>
                        <Switch
                            value={profil.aktifMi}
                            onValueChange={(value) => profilDegistir({ ...profil, aktifMi: value })}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={profil.aktifMi ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {/* Önerilen */}
                    <View style={styles.oneriContainer}>
                        <Text style={styles.oneriYazi}>
                            {t('alerts.recommended')}: {Math.round((profil.kilo * 33 + (profil.aktifMi ? 500 : 0)) / 250) * 250} {t('alerts.perDay')}
                        </Text>
                        <TouchableOpacity style={styles.oneriButon} onPress={oneriUygula}>
                            <Text style={styles.oneriButonYazi}>{t('alerts.apply')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Günlük Hedef Ayarı */}
                <View style={[styles.hedefContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.hedefBaslik}>🎯 {t('settings.dailyGoal')}</Text>
                    <Text style={styles.hedefAciklama}>
                        {t('settings.dailyGoalDesc')}
                    </Text>

                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setHedefModalGoster(true)}
                    >
                        <Text style={styles.pickerButtonLabel}>💧 {t('settings.dailyGoal')}</Text>
                        <Text style={styles.pickerButtonValue}>{gunlukHedef} ml ({(gunlukHedef / 1000).toFixed(1)} L)</Text>
                    </TouchableOpacity>
                </View>

                {/* 🧠 AI Özellikleri */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🧠 {t('settings.aiFeatures')}</Text>
                    <Text style={styles.hedefAciklama}>
                        {t('settings.aiDesc')}
                    </Text>

                    <View style={styles.modSatir}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modEtiket}>{t('settings.smartGoalEngine')}</Text>
                            <Text style={[styles.hedefAciklama, { fontSize: 11, marginTop: 2 }]}>
                                {t('settings.smartGoalEngineDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={aiAktif}
                            onValueChange={aiDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={aiAktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {aiAktif && (
                        <View style={styles.oneriContainer}>
                            <Text style={styles.oneriYazi}>
                                ✅ {t('settings.aiActive')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Bildirim Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🔔 {t('settings.notifications')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {bildirimAktif ? t('settings.notificationsOn') : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={bildirimAktif}
                            onValueChange={bildirimDurumuDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={bildirimAktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {bildirimAktif && (
                        <>
                            <TouchableOpacity
                                style={[styles.pickerButton, { marginTop: 10 }]}
                                onPress={() => setBildirimAralikModalGoster(true)}
                            >
                                <Text style={styles.pickerButtonLabel}>⏰ {t('settings.reminderInterval')}</Text>
                                <Text style={styles.pickerButtonValue}>
                                    {hatirlatmaAraligi >= 60 ? `${hatirlatmaAraligi / 60} ${t('time.hours')}` : `${hatirlatmaAraligi} ${t('time.minutes')}`}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Sessiz Saatler */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🌙 {t('settings.silentHours')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {sessizSaatler.aktif
                                ? `${sessizSaatler.baslangic}:00 - ${sessizSaatler.bitis}:00`
                                : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={sessizSaatler.aktif}
                            onValueChange={sessizSaatlerDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={sessizSaatler.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {sessizSaatler.aktif && (
                        <>
                            <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1 }]}
                                    onPress={() => setSessizBaslangicModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>{t('settings.startTime')}</Text>
                                    <Text style={styles.pickerButtonValue}>{sessizSaatler.baslangic}:00</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1 }]}
                                    onPress={() => setSessizBitisModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>{t('settings.endTime')}</Text>
                                    <Text style={styles.pickerButtonValue}>{sessizSaatler.bitis}:00</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.sessizAciklama}>
                                {t('settings.silentHoursDesc')}
                            </Text>
                        </>
                    )}
                </View>

                {/* Ses Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🔊 {t('settings.sound')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {sesAktif ? `🎵 ${t('settings.soundOn')}` : `🔇 ${t('settings.soundOff')}`}
                        </Text>
                        <Switch
                            value={sesAktif}
                            onValueChange={sesDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={sesAktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Akıllı Hatırlatma */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🧠 {t('settings.smartReminder')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {akilliHatirlatma.aktif ? `${akilliHatirlatma.aralikDakika} ${t('time.minutes')}` : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={akilliHatirlatma.aktif}
                            onValueChange={akilliHatirlatmaDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={akilliHatirlatma.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {akilliHatirlatma.aktif && (
                        <>
                            <TouchableOpacity
                                style={[styles.pickerButton, { marginTop: 10 }]}
                                onPress={() => setAkilliAralikModalGoster(true)}
                            >
                                <Text style={styles.pickerButtonLabel}>⏱️ {t('settings.reminderInterval')}</Text>
                                <Text style={styles.pickerButtonValue}>
                                    {akilliHatirlatma.aralikDakika >= 60
                                        ? `${akilliHatirlatma.aralikDakika / 60} ${t('time.hours')}`
                                        : `${akilliHatirlatma.aralikDakika} ${t('time.minutes')}`}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.sessizAciklama}>
                                {t('settings.smartReminderDesc')}
                            </Text>
                        </>
                    )}
                </View>

                {/* Günlük Özet */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>📊 {t('settings.dailySummary')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {gunlukOzet.aktif ? `${gunlukOzet.saat}:00` : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={gunlukOzet.aktif}
                            onValueChange={gunlukOzetDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={gunlukOzet.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {gunlukOzet.aktif && (
                        <>
                            <Text style={styles.sessizAciklama}>
                                {t('settings.dailySummaryDesc')}
                            </Text>
                        </>
                    )}
                </View>

                {/* Haftalık Rapor */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>📊 {t('settings.weeklyReport')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {haftalikRapor.aktif ? t('settings.notificationsOn') : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={haftalikRapor.aktif}
                            onValueChange={haftalikRaporDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={haftalikRapor.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {haftalikRapor.aktif && (
                        <>
                            <Text style={styles.sessizAciklama}>
                                {t('settings.weeklyReportDesc')}
                            </Text>
                        </>
                    )}
                </View>

                {/* Bioritim Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🌅 {t('settings.biorhythm')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {bioritim.aktif ? `${t('settings.wakeUpTime')}: ${bioritim.uyanmaSaati}` : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={bioritim.aktif}
                            onValueChange={async (value) => {
                                const yeniAyar = { ...bioritim, aktif: value };
                                setBioritim(yeniAyar);
                                await bioritimAyarKaydet(yeniAyar);
                            }}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={bioritim.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {bioritim.aktif && (
                        <>
                            <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 5 }]}
                                    onPress={() => setBioritimUyanmaModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>☀️ {t('settings.wakeUpTime')}</Text>
                                    <Text style={[styles.pickerButtonValue, { marginLeft: 0 }]}>{bioritim.uyanmaSaati}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 5 }]}
                                    onPress={() => setBioritimUyumaModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>🌙 {t('settings.sleepTime')}</Text>
                                    <Text style={[styles.pickerButtonValue, { marginLeft: 0 }]}>{bioritim.uyumaSaati}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.sessizAciklama}>
                                {t('settings.biorhythmDesc')}
                            </Text>
                        </>
                    )}
                </View>

                {/* Detoks Modu */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🧪 {t('settings.detoxMode')}</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {detoks.aktif ? `💪 ${t('settings.detoxActive')}` : t('settings.notificationsOff')}
                        </Text>
                        <Switch
                            value={detoks.aktif}
                            onValueChange={async (value) => {
                                const yeniAyar = { aktif: value };
                                setDetoks(yeniAyar);
                                await detoksAyarKaydet(yeniAyar);
                                if (value) {
                                    Alert.alert(t('settings.detoxMode'), t('settings.detoxActiveMsg'));
                                }
                            }}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={detoks.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {detoks.aktif && (
                        <Text style={styles.sessizAciklama}>
                            {t('settings.detoxDesc')}
                        </Text>
                    )}
                </View>

                {/* Tema Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🎨 {t('settings.theme')}</Text>

                    {/* Otomatik Gece Modu */}
                    <View style={styles.modSatir}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modEtiket}>🌙 {t('settings.autoNightMode')}</Text>
                            <Text style={styles.sessizAciklama}>{t('settings.autoNightModeDesc')}</Text>
                        </View>
                        <Switch
                            value={otomatikMod}
                            onValueChange={otomatikModDegistir}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={otomatikMod ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {/* Koyu/Açık Mod (Otomatik kapalıyken göster) */}
                    {!otomatikMod && (
                        <View style={[styles.modSatir, { marginTop: 10 }]}>
                            <Text style={styles.modEtiket}>
                                {mod === 'koyu' ? `🌑 ${t('settings.darkMode')}` : `☀️ ${t('settings.lightMode')}`}
                            </Text>
                            <Switch
                                value={mod === 'koyu'}
                                onValueChange={(value) => modDegistir(value ? 'koyu' : 'acik')}
                                trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                                thumbColor={mod === 'koyu' ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    )}

                    {/* Premium Temalar */}
                    <View style={{ marginTop: 15 }}>
                        <Text style={[styles.modEtiket, { marginBottom: 12 }]}>🎭 {t('settings.specialThemes')}</Text>
                        <View style={styles.renkSecenekleri}>
                            {[
                                { id: 'altin', renk: '#FFD700', ikon: '👑' },
                                { id: 'okyanus', renk: '#2AA198', ikon: '🌊' },
                                { id: 'zumrut', renk: '#2ECC71', ikon: '🌿' },
                                { id: 'midnight', renk: '#BB86FC', ikon: '🌌' },
                            ].map((tema) => (
                                <TouchableOpacity
                                    key={tema.id}
                                    style={[
                                        styles.renkButon,
                                        { backgroundColor: tema.renk },
                                        mod === tema.id && styles.renkButonSecili
                                    ]}
                                    onPress={() => {
                                        if (premiumAktif) {
                                            modDegistir(tema.id as any);
                                        } else {
                                            setPremiumModalGoster(true);
                                        }
                                    }}
                                >
                                    <Text style={{ fontSize: 18 }}>{tema.ikon}</Text>
                                    {!premiumAktif && (
                                        <View style={{
                                            position: 'absolute',
                                            top: -5,
                                            right: -5,
                                            backgroundColor: '#000',
                                            borderRadius: 10,
                                            width: 20,
                                            height: 20,
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Text style={{ fontSize: 10 }}>🔒</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Dil Seçimi / Language */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🌐 {t('settings.language')}</Text>

                    <TouchableOpacity
                        style={styles.dilSeciciButon}
                        onPress={() => setDilModalGoster(true)}
                    >
                        <View style={styles.dilSeciciIcerik}>
                            <Text style={styles.dilSeciciFlag}>
                                {LANGUAGES.find(l => l.code === currentLang)?.flag || '🌐'}
                            </Text>
                            <Text style={styles.dilSeciciText}>
                                {LANGUAGES.find(l => l.code === currentLang)?.name || 'Select Language'}
                            </Text>
                        </View>
                        <Text style={styles.dilSeciciOk}>▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Dil Seçim Modal */}
                <Modal
                    visible={dilModalGoster}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setDilModalGoster(false)}
                >
                    <TouchableOpacity
                        style={styles.dilModalOverlay}
                        activeOpacity={1}
                        onPress={() => setDilModalGoster(false)}
                    >
                        <View style={styles.dilModalContainer}>
                            <Text style={styles.dilModalBaslik}>🌐 {t('settings.language')}</Text>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.dilModalItem,
                                        currentLang === lang.code && styles.dilModalItemSecili
                                    ]}
                                    onPress={async () => {
                                        await changeLanguage(lang.code);
                                        setCurrentLang(lang.code);
                                        setDilModalGoster(false);
                                    }}
                                >
                                    <Text style={styles.dilModalFlag}>{lang.flag}</Text>
                                    <Text style={[
                                        styles.dilModalText,
                                        currentLang === lang.code && styles.dilModalTextSecili
                                    ]}>
                                        {lang.name}
                                    </Text>
                                    {currentLang === lang.code && (
                                        <Text style={styles.dilModalCheck}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Apple Health Entegrasyonu (Sadece iOS) */}
                {healthKitDestekleniyor() && (
                    <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                        <Text style={styles.temaBaslik}>❤️ {t('settings.appleHealth')}</Text>

                        <View style={styles.modSatir}>
                            <Text style={styles.modEtiket}>
                                {healthKitAktif ? t('settings.syncActive') : t('settings.syncOff')}
                            </Text>
                            <Switch
                                value={healthKitAktif}
                                onValueChange={async () => {
                                    const yeniDurum = await healthKitToggle();
                                    setHealthKitAktif(yeniDurum);
                                    // HealthKit kapatılırsa dinamik hedefi de kapat
                                    if (!yeniDurum) {
                                        setDinamikHedefAktif(false);
                                        await dinamikHedefAyarKaydet(false);
                                    }
                                }}
                                trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                                thumbColor={healthKitAktif ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        <Text style={styles.sessizAciklama}>
                            {t('settings.appleHealthDesc')}
                        </Text>

                        {/* Dinamik Hedef Toggle - HealthKit aktifse göster */}
                        {healthKitAktif && (
                            <>
                                <View style={[styles.modSatir, { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modEtiket}>🔥 {t('settings.dynamicGoal')}</Text>
                                        <Text style={[styles.sessizAciklama, { marginTop: 4 }]}>
                                            {t('settings.dynamicGoalDesc')}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={dinamikHedefAktif}
                                        onValueChange={async (value) => {
                                            setDinamikHedefAktif(value);
                                            await dinamikHedefAyarKaydet(value);
                                            if (value) {
                                                // Dinamik hedefi hemen hesapla
                                                const sonuc = await dinamikHedefHesapla(profil.kilo);
                                                setDinamikHedefSonuc(sonuc);
                                            } else {
                                                setDinamikHedefSonuc(null);
                                            }
                                        }}
                                        trackColor={{ false: '#ccc', true: '#FF9800' }}
                                        thumbColor={dinamikHedefAktif ? '#fff' : '#f4f3f4'}
                                    />
                                </View>

                                {/* Dinamik Hedef Sonucu */}
                                {dinamikHedefAktif && dinamikHedefSonuc && (
                                    <View style={{
                                        marginTop: 15,
                                        padding: 15,
                                        backgroundColor: 'rgba(255, 152, 0, 0.15)',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 152, 0, 0.3)',
                                    }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={{ color: '#FF9800', fontSize: 14, fontWeight: '600' }}>
                                                {t('settings.recommendedGoal')}
                                            </Text>
                                            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' }}>
                                                {dinamikHedefSonuc.hedefMl} ml
                                            </Text>
                                        </View>

                                        <View style={{ gap: 6 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Text style={{ color: '#90CAF9', fontSize: 12 }}>
                                                    📐 {t('settings.baseNeed')} ({profil.kilo}kg × 33ml)
                                                </Text>
                                                <Text style={{ color: '#90CAF9', fontSize: 12 }}>
                                                    {dinamikHedefSonuc.temelIhtiyac} ml
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Text style={{ color: '#90CAF9', fontSize: 12 }}>
                                                    🔥 {t('settings.activityAddition')} ({dinamikHedefSonuc.yakilanKalori} kcal)
                                                </Text>
                                                <Text style={{ color: '#90CAF9', fontSize: 12 }}>
                                                    +{dinamikHedefSonuc.aktiviteEklentisi} ml
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={{ color: '#FFC107', fontSize: 11, marginTop: 10, fontStyle: 'italic' }}>
                                            💡 {dinamikHedefSonuc.aciklama}
                                        </Text>

                                        {/* Uygula Butonu */}
                                        <TouchableOpacity
                                            style={{
                                                marginTop: 12,
                                                backgroundColor: '#FF9800',
                                                paddingVertical: 10,
                                                borderRadius: 10,
                                                alignItems: 'center',
                                            }}
                                            onPress={async () => {
                                                await hedefKaydet(dinamikHedefSonuc.hedefMl);
                                                setGunlukHedef(dinamikHedefSonuc.hedefMl);
                                                Alert.alert(
                                                    t('alerts.goalUpdated'),
                                                    t('alerts.dynamicGoalApplied', { goal: dinamikHedefSonuc.hedefMl })
                                                );
                                            }}
                                        >
                                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                                                ✅ {t('alerts.apply')} ({dinamikHedefSonuc.hedefMl} ml)
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Dinamik hedef aktif ama sonuç yoksa hesapla butonu */}
                                {dinamikHedefAktif && !dinamikHedefSonuc && (
                                    <TouchableOpacity
                                        style={{
                                            marginTop: 10,
                                            backgroundColor: '#FF9800',
                                            paddingVertical: 10,
                                            paddingHorizontal: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                        }}
                                        onPress={async () => {
                                            const sonuc = await dinamikHedefHesapla(profil.kilo);
                                            setDinamikHedefSonuc(sonuc);
                                        }}
                                    >
                                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                                            🔄 {t('settings.calculateGoal')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}

                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>📊 {t('settings.dataExport')}</Text>
                    <Text style={styles.hedefAciklama}>
                        {t('settings.dataExportDesc')}
                    </Text>

                    {/* Rapor Kartları */}
                    <View style={{ marginTop: 20, gap: 12 }}>

                        {/* CSV Rapor Kartı */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: premiumAktif ? '#1976D2' : '#424242',
                                borderRadius: 16,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: premiumAktif ? 1 : 0.7,
                                shadowColor: '#1976D2',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: premiumAktif ? 0.3 : 0,
                                shadowRadius: 8,
                                elevation: premiumAktif ? 6 : 0,
                            }}
                            onPress={async () => {
                                if (premiumAktif) {
                                    await csvOlusturVePaylas(gunlukHedef);
                                } else {
                                    setPremiumModalGoster(true);
                                }
                            }}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                            }}>
                                <Text style={{ fontSize: 24 }}>📥</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                                    {t('settings.csvData')}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                                    {t('settings.csvDataDesc')}
                                </Text>
                            </View>
                            {!premiumAktif && <Text style={{ fontSize: 20 }}>🔒</Text>}
                        </TouchableOpacity>

                        {/* Haftalık PDF Kartı */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: premiumAktif ? '#7B1FA2' : '#424242',
                                borderRadius: 16,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: premiumAktif ? 1 : 0.7,
                                shadowColor: '#7B1FA2',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: premiumAktif ? 0.3 : 0,
                                shadowRadius: 8,
                                elevation: premiumAktif ? 6 : 0,
                            }}
                            onPress={async () => {
                                if (premiumAktif) {
                                    await haftalikPdfOlusturVePaylas(gunlukHedef);
                                } else {
                                    setPremiumModalGoster(true);
                                }
                            }}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                            }}>
                                <Text style={{ fontSize: 24 }}>📊</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                                    {t('settings.pdfWeekly')}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                                    {t('settings.pdfWeeklyDesc')}
                                </Text>
                            </View>
                            {!premiumAktif && <Text style={{ fontSize: 20 }}>🔒</Text>}
                        </TouchableOpacity>

                        {/* Aylık PDF Kartı */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: premiumAktif ? '#C2185B' : '#424242',
                                borderRadius: 16,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: premiumAktif ? 1 : 0.7,
                                shadowColor: '#C2185B',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: premiumAktif ? 0.3 : 0,
                                shadowRadius: 8,
                                elevation: premiumAktif ? 6 : 0,
                            }}
                            onPress={async () => {
                                if (premiumAktif) {
                                    await aylikPdfOlusturVePaylas(gunlukHedef);
                                } else {
                                    setPremiumModalGoster(true);
                                }
                            }}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                            }}>
                                <Text style={{ fontSize: 24 }}>📄</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                                    {t('settings.pdfMonthly')}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                                    {t('settings.pdfMonthlyDesc')}
                                </Text>
                            </View>
                            {!premiumAktif && <Text style={{ fontSize: 20 }}>🔒</Text>}
                        </TouchableOpacity>

                    </View>

                    {!premiumAktif && (
                        <TouchableOpacity
                            style={{
                                marginTop: 16,
                                paddingVertical: 12,
                                backgroundColor: 'rgba(79, 195, 247, 0.15)',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(79, 195, 247, 0.3)',
                            }}
                            onPress={() => setPremiumModalGoster(true)}
                        >
                            <Text style={{ color: '#4FC3F7', textAlign: 'center', fontWeight: '600' }}>
                                ⭐ {t('premium.upgrade')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Uygulama Bilgileri */}
                <View style={[styles.bilgiContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.bilgiBaslik}>{t('settings.appInfo')}</Text>

                    <View style={styles.bilgiSatir}>
                        <Text style={styles.bilgiEtiket}>{t('settings.version')}</Text>
                        <Text style={styles.bilgiDeger}>{t('appInfo.versionValue')}</Text>
                    </View>

                    <View style={styles.bilgiSatir}>
                        <Text style={styles.bilgiEtiket}>{t('settings.developer')}</Text>
                        <Text style={styles.bilgiDeger}>{t('appInfo.developerName')}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.bilgiSatir, { marginTop: 10 }]}
                        onPress={() => Linking.openURL('https://serhatcirit1.github.io/Smart-Water-AI-Insights-Privacy-Policy/')}
                    >
                        <Text style={[styles.bilgiEtiket, { color: '#4FC3F7', textDecorationLine: 'underline' }]}>{t('settings.legal.privacyPolicy')}</Text>
                        <Text style={styles.bilgiDeger}>📄</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bilgiSatir}
                        onPress={() => Linking.openURL('https://serhatcirit1.github.io/Smart-Water-AI-Insights-Privacy-Policy/terms.html')}
                    >
                        <Text style={[styles.bilgiEtiket, { color: '#4FC3F7', textDecorationLine: 'underline' }]}>{t('settings.legal.termsOfUse')}</Text>
                        <Text style={styles.bilgiDeger}>⚖️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.oneriButon, { marginTop: 15 }]}
                        onPress={async () => {
                            await AsyncStorage.removeItem('@onboarding_tamamlandi');
                            Alert.alert(t('settings.resetComplete'), t('settings.resetCompleteMessage'));
                        }}
                    >
                        <Text style={styles.oneriButonYazi}>🔄 {t('settings.resetOnboarding')}</Text>
                    </TouchableOpacity>
                </View>

                {/* 🔧 Geliştirici Test Modu */}
                <View style={[styles.temaContainer, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#FF6B6B' }]}>
                    <Text style={[styles.temaBaslik, { color: '#FF6B6B' }]}>🔧 {t('settings.devTestMode')}</Text>
                    <Text style={[styles.sessizAciklama, { color: '#888', marginBottom: 10 }]}>
                        {t('settings.devTestModeWarning')}
                    </Text>

                    <View style={styles.modSatir}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.modEtiket, { color: '#fff' }]}>
                                {premiumAktif ? t('settings.premiumActive') : t('settings.premiumOff')}
                            </Text>
                            <Text style={[styles.sessizAciklama, { fontSize: 11, marginTop: 2, color: '#666' }]}>
                                {t('settings.premiumToggleDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={premiumAktif}
                            onValueChange={async (value) => {
                                const yeniDurum = {
                                    aktif: value,
                                    paketId: value ? 'omur_boyu' as const : undefined,
                                    satinAlmaTarihi: value ? new Date().toISOString() : undefined
                                };
                                await premiumDurumKaydet(yeniDurum);
                                // Context'i güncelle
                                setPremium(yeniDurum);
                                Alert.alert(
                                    value ? t('settings.premiumActive') : t('settings.premiumOff'),
                                    value
                                        ? t('settings.premiumActivated')
                                        : t('settings.premiumDeactivated')
                                );
                            }}
                            trackColor={{ false: '#333', true: '#FF6B6B' }}
                            thumbColor={premiumAktif ? '#fff' : '#666'}
                        />
                    </View>
                </View>

                {/* İpuçları */}
                <View style={[styles.ipucuContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.ipucuBaslik}>💡 {t('settings.tips')}</Text>
                    <Text style={styles.ipucuMetin}>
                        • {t('settings.tip1')}{'\n'}
                        • {t('settings.tip2')}{'\n'}
                        • {t('settings.tip3')}{'\n'}
                        • {t('settings.tip4')}
                    </Text>
                </View>

                {/* Alt boşluk */}
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Premium Modal */}
            <Modal
                visible={premiumModalGoster}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setPremiumModalGoster(false)}
            >
                <PremiumEkrani onClose={() => setPremiumModalGoster(false)} />
            </Modal>

            {/* Günlük Hedef Picker Modal */}
            <PickerModal
                visible={hedefModalGoster}
                title={t('settings.pickerTitles.dailyGoal')}
                value={gunlukHedef}
                options={HEDEF_SECENEKLERI.map(ml => ({
                    label: `${ml} ml (${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L)`,
                    value: ml
                }))}
                onSelect={(value) => hedefDegistir(Number(value))}
                onClose={() => setHedefModalGoster(false)}
            />

            {/* Bildirim Aralığı Picker Modal */}
            <PickerModal
                visible={bildirimAralikModalGoster}
                title={t('settings.pickerTitles.reminderInterval')}
                value={hatirlatmaAraligi}
                options={[
                    { label: `15 ${t('time.minutes')}`, value: 15 },
                    { label: `30 ${t('time.minutes')}`, value: 30 },
                    { label: `45 ${t('time.minutes')}`, value: 45 },
                    { label: `1 ${t('time.hours')}`, value: 60 },
                    { label: `1.5 ${t('time.hours')}`, value: 90 },
                    { label: `2 ${t('time.hours')}`, value: 120 },
                    { label: `3 ${t('time.hours')}`, value: 180 },
                    { label: `4 ${t('time.hours')}`, value: 240 },
                ]}
                onSelect={(value) => aralikDegistir(Number(value))}
                onClose={() => setBildirimAralikModalGoster(false)}
            />

            {/* Akıllı Hatırlatma Aralığı Picker Modal */}
            <PickerModal
                visible={akilliAralikModalGoster}
                title={t('settings.pickerTitles.smartReminderInterval')}
                value={akilliHatirlatma.aralikDakika}
                options={[
                    { label: `30 ${t('time.minutes')}`, value: 30 },
                    { label: `45 ${t('time.minutes')}`, value: 45 },
                    { label: `1 ${t('time.hours')}`, value: 60 },
                    { label: `1.5 ${t('time.hours')}`, value: 90 },
                    { label: `2 ${t('time.hours')}`, value: 120 },
                    { label: `2.5 ${t('time.hours')}`, value: 150 },
                    { label: `3 ${t('time.hours')}`, value: 180 },
                ]}
                onSelect={async (value) => {
                    const yeniAyar = { ...akilliHatirlatma, aralikDakika: Number(value) };
                    setAkilliHatirlatma(yeniAyar);
                    await akilliHatirlatmaAyarKaydet(yeniAyar);
                }}
                onClose={() => setAkilliAralikModalGoster(false)}
            />

            {/* Sessiz Saatler Başlangıç Modal */}
            <TimePickerModal
                visible={sessizBaslangicModalGoster}
                title={t('settings.pickerTitles.silentStart')}
                hour={sessizSaatler.baslangic}
                onSelect={async (hour) => {
                    const yeniAyar = { ...sessizSaatler, baslangic: hour };
                    setSessizSaatler(yeniAyar);
                    await sessizSaatlerKaydet(yeniAyar);
                }}
                onClose={() => setSessizBaslangicModalGoster(false)}
            />

            {/* Sessiz Saatler Bitiş Modal */}
            <TimePickerModal
                visible={sessizBitisModalGoster}
                title={t('settings.pickerTitles.silentEnd')}
                hour={sessizSaatler.bitis}
                onSelect={async (hour) => {
                    const yeniAyar = { ...sessizSaatler, bitis: hour };
                    setSessizSaatler(yeniAyar);
                    await sessizSaatlerKaydet(yeniAyar);
                }}
                onClose={() => setSessizBitisModalGoster(false)}
            />

            {/* Bioritim Uyanma Saati Modal */}
            <TimePickerModal
                visible={bioritimUyanmaModalGoster}
                title={t('settings.pickerTitles.wakeUpTime')}
                hour={parseInt(bioritim.uyanmaSaati.split(':')[0])}
                minute={parseInt(bioritim.uyanmaSaati.split(':')[1] || '0')}
                onSelect={async (hour, minute) => {
                    const yeniSaat = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const yeniAyar = { ...bioritim, uyanmaSaati: yeniSaat };
                    setBioritim(yeniAyar);
                    await bioritimAyarKaydet(yeniAyar);
                }}
                onClose={() => setBioritimUyanmaModalGoster(false)}
            />

            {/* Bioritim Uyuma Saati Modal */}
            <TimePickerModal
                visible={bioritimUyumaModalGoster}
                title={t('settings.pickerTitles.sleepTime')}
                hour={parseInt(bioritim.uyumaSaati.split(':')[0])}
                minute={parseInt(bioritim.uyumaSaati.split(':')[1] || '0')}
                onSelect={async (hour, minute) => {
                    const yeniSaat = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const yeniAyar = { ...bioritim, uyumaSaati: yeniSaat };
                    setBioritim(yeniAyar);
                    await bioritimAyarKaydet(yeniAyar);
                }}
                onClose={() => setBioritimUyumaModalGoster(false)}
            />
        </SafeAreaView >
    );
}

// --- STİLLER ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0D47A1',
    },
    container: {
        flex: 1,
        backgroundColor: '#0D47A1',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yukleniyorYazi: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    baslik: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },

    // Hedef ayarı
    hedefContainer: {
        backgroundColor: '#1565C0',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    hedefBaslik: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    hedefAciklama: {
        fontSize: 12,
        color: '#90CAF9',
        marginBottom: 15,
    },
    hedefSecenekleri: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    hedefButon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0D47A1',
        borderWidth: 2,
        borderColor: '#4FC3F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hedefButonSecili: {
        backgroundColor: '#4FC3F7',
    },
    hedefButonYazi: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4FC3F7',
    },
    hedefButonYaziSecili: {
        color: '#0D47A1',
    },
    hedefSonuc: {
        fontSize: 14,
        color: '#90CAF9',
        textAlign: 'center',
    },
    hedefVurgu: {
        color: '#4FC3F7',
        fontWeight: 'bold',
    },

    // Bilgi kartı
    bilgiContainer: {
        backgroundColor: '#1565C0',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    bilgiBaslik: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
    },
    bilgiSatir: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1976D2',
    },
    bilgiEtiket: {
        fontSize: 14,
        color: '#90CAF9',
    },
    bilgiDeger: {
        fontSize: 14,
        color: '#FFFFFF',
    },

    // İpuçları
    ipucuContainer: {
        backgroundColor: '#1565C0',
        borderRadius: 16,
        padding: 20,
    },
    ipucuBaslik: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    ipucuMetin: {
        fontSize: 14,
        color: '#90CAF9',
        lineHeight: 24,
    },

    // Tema Ayarları
    temaContainer: {
        backgroundColor: '#1565C0',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    temaBaslik: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
    },
    modSatir: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modEtiket: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    renkEtiket: {
        fontSize: 12,
        color: '#90CAF9',
        marginBottom: 10,
    },
    renkSecenekleri: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    renkButon: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    renkButonSecili: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    renkTik: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },

    // Bardak Boyutu
    bardakSecenekleri: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    bardakButon: {
        flex: 1,
        backgroundColor: '#0D47A1',
        borderRadius: 12,
        paddingVertical: 15,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    bardakButonSecili: {
        borderColor: '#4FC3F7',
        backgroundColor: '#1976D2',
    },
    bardakBoyutYazi: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    bardakMlYazi: {
        fontSize: 11,
        color: '#90CAF9',
        marginTop: 2,
    },
    sessizAciklama: {
        fontSize: 12,
        color: '#90CAF9',
        marginTop: 8,
        fontStyle: 'italic',
    },

    // Profil Stiller
    profilSatir: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    profilEtiket: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    profilDegerler: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilButon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0D47A1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilButonYazi: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    profilDeger: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 80,
        textAlign: 'center',
    },
    oneriContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#0D47A1',
    },
    oneriYazi: {
        color: '#4FC3F7',
        fontSize: 14,
        fontWeight: 'bold',
    },
    oneriButon: {
        backgroundColor: '#4FC3F7',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    oneriButonYazi: {
        color: '#0D47A1',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Picker Buton Stilleri
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0D47A1',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#4FC3F7',
    },
    pickerButtonLabel: {
        color: '#90CAF9',
        fontSize: 14,
    },
    pickerButtonValue: {
        color: '#4FC3F7',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Premium Banner
    premiumBanner: {
        marginHorizontal: 20,
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#4FC3F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    premiumBannerGradient: {
        padding: 20,
    },
    premiumBannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    premiumBannerTextContainer: {
        flex: 1,
    },
    premiumBannerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    premiumBannerSubtitle: {
        color: '#E1F5FE',
        fontSize: 12,
        marginTop: 4,
        opacity: 0.9,
    },
    premiumBannerBadge: {
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    premiumBannerBadgeText: {
        color: '#01579B',
        fontSize: 12,
        fontWeight: '900',
    },
    // Language Selector
    dilButon: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1565C0',
        borderRadius: 12,
        padding: 15,
        gap: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dilButonSecili: {
        borderColor: '#4FC3F7',
        backgroundColor: '#0D47A1',
    },
    dilButonYazi: {
        color: '#90CAF9',
        fontSize: 14,
        fontWeight: '600',
    },
    dilButonYaziSecili: {
        color: '#4FC3F7',
        fontWeight: 'bold',
    },
    // Dil Seçici Dropdown
    dilSeciciButon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0D47A1',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#4FC3F7',
        marginTop: 10,
    },
    dilSeciciIcerik: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dilSeciciFlag: {
        fontSize: 28,
    },
    dilSeciciText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dilSeciciOk: {
        color: '#4FC3F7',
        fontSize: 14,
    },
    // Dil Modal
    dilModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    dilModalContainer: {
        backgroundColor: '#1565C0',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    dilModalBaslik: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    dilModalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#0D47A1',
    },
    dilModalItemSecili: {
        backgroundColor: '#1976D2',
        borderWidth: 2,
        borderColor: '#4FC3F7',
    },
    dilModalFlag: {
        fontSize: 28,
        marginRight: 15,
    },
    dilModalText: {
        flex: 1,
        color: '#90CAF9',
        fontSize: 16,
        fontWeight: '600',
    },
    dilModalTextSecili: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    dilModalCheck: {
        color: '#4FC3F7',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
