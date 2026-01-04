// ============================================
// AYARLAR EKRANI
// ============================================
// Bildirim ayarları, hedef ve uygulama bilgileri

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PickerModal, TimePickerModal } from '../components/PickerModal';
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
import { healthKitDestekleniyor, healthKitAyarYukle, healthKitToggle } from '../healthKit';
import { aiAyarlariniYukle, aiAyarlariniKaydet, AIAyarlari } from '../aiUtils';

// --- COMPONENT ---
export function AyarlarEkrani() {
    const [bildirimAktif, setBildirimAktif] = useState(false);
    const [hatirlatmaAraligi, setHatirlatmaAraligi] = useState(120);
    const [gunlukHedef, setGunlukHedef] = useState(8);
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
    const [bioritim, setBioritim] = useState<BioritimAyar>({
        aktif: false, uyanmaSaati: '08:00', uyumaSaati: '23:00'
    });
    const [detoks, setDetoks] = useState<DetoksAyar>({ aktif: false });
    const [aiAktif, setAiAktif] = useState(true);

    // Modal State'leri
    const [hedefModalGoster, setHedefModalGoster] = useState(false);
    const [bildirimAralikModalGoster, setBildirimAralikModalGoster] = useState(false);
    const [sessizBaslangicModalGoster, setSessizBaslangicModalGoster] = useState(false);
    const [sessizBitisModalGoster, setSessizBitisModalGoster] = useState(false);
    const [akilliAralikModalGoster, setAkilliAralikModalGoster] = useState(false);
    const [bioritimUyanmaModalGoster, setBioritimUyanmaModalGoster] = useState(false);
    const [bioritimUyumaModalGoster, setBioritimUyumaModalGoster] = useState(false);

    // Tema hook
    const { mod, renkler, modDegistir } = useTema();

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
                    'İzin Gerekli',
                    'Bildirim göndermek için izin vermeniz gerekiyor.'
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

    // Test gönder
    const testGonder = async () => {
        const izinVar = await bildirimIzniIste();
        if (izinVar) {
            await testBildirimiGonder();
            Alert.alert('Bildirim Gönderildi', '3 saniye içinde bildirim alacaksın! 💧');
        } else {
            Alert.alert('İzin Gerekli', 'Önce bildirim izni vermeniz gerekiyor.');
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

    // Önerilen hedefi uygula (ml cinsinden)
    const oneriUygula = async () => {
        const onerilenMl = profil.kilo * 33 + (profil.aktifMi ? 500 : 0);
        // En yakın hedef seçeneğine yuvarla
        const enYakin = HEDEF_SECENEKLERI.reduce((prev, curr) =>
            Math.abs(curr - onerilenMl) < Math.abs(prev - onerilenMl) ? curr : prev
        );
        setGunlukHedef(enYakin);
        await hedefKaydet(enYakin);
        Alert.alert('Hedef Güncellendi', `Yeni hedefiniz: ${enYakin} ml 💧`);
    };

    // AI özelliklerini aç/kapat
    const aiDegistir = async (aktif: boolean) => {
        setAiAktif(aktif);
        await aiAyarlariniKaydet({ aktif });
        if (aktif) {
            Alert.alert('🧠 AI Aktif', 'Akıllı hedef ve içgörü özellikleri açıldı.');
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
                    <Text style={styles.yukleniyorYazi}>⚙️ Yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            <ScrollView style={[styles.container, { backgroundColor: renkler.arkaplan }]}>
                {/* Başlık */}
                <Text style={styles.baslik}>⚙️ Ayarlar</Text>

                {/* Kişiselleştirilmiş Hedef */}
                <View style={[styles.hedefContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.hedefBaslik}>📐 Kişiselleştirilmiş Hedef</Text>
                    <Text style={styles.hedefAciklama}>
                        Bilgilerine göre önerilen su miktarı
                    </Text>

                    {/* Kilo */}
                    <View style={styles.profilSatir}>
                        <Text style={styles.profilEtiket}>Kilo</Text>
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
                        <Text style={styles.profilEtiket}>Yaş</Text>
                        <View style={styles.profilDegerler}>
                            <TouchableOpacity
                                style={styles.profilButon}
                                onPress={() => profilDegistir({ ...profil, yas: Math.max(10, profil.yas - 5) })}
                            >
                                <Text style={styles.profilButonYazi}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.profilDeger}>{profil.yas} yaş</Text>
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
                            {profil.aktifMi ? '🏃 Aktif Yaşam' : '🧘 Normal Yaşam'}
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
                            Önerilen: {Math.round((profil.kilo * 33 + (profil.aktifMi ? 500 : 0)) / 100) * 100} ml/gün
                        </Text>
                        <TouchableOpacity style={styles.oneriButon} onPress={oneriUygula}>
                            <Text style={styles.oneriButonYazi}>Uygula</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Günlük Hedef Ayarı */}
                <View style={[styles.hedefContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.hedefBaslik}>🎯 Günlük Hedef</Text>
                    <Text style={styles.hedefAciklama}>
                        Günde ne kadar su içmeyi hedefliyorsun?
                    </Text>

                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setHedefModalGoster(true)}
                    >
                        <Text style={styles.pickerButtonLabel}>💧 Günlük Hedef</Text>
                        <Text style={styles.pickerButtonValue}>{gunlukHedef} ml ({(gunlukHedef / 1000).toFixed(1)} L)</Text>
                    </TouchableOpacity>
                </View>

                {/* 🧠 AI Özellikleri */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🧠 Yapay Zeka Özellikleri</Text>
                    <Text style={styles.hedefAciklama}>
                        Kişiselleştirilmiş öneriler ve akıllı hatırlatmalar
                    </Text>

                    <View style={styles.modSatir}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modEtiket}>Akıllı Hedef Motoru</Text>
                            <Text style={[styles.hedefAciklama, { fontSize: 11, marginTop: 2 }]}>
                                Hava durumu ve geçmişine göre günlük hedefini otomatik ayarlar
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
                                ✅ AI İçgörüleri ve Tahminler aktif
                            </Text>
                        </View>
                    )}
                </View>

                {/* Bildirim Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🔔 Bildirim Ayarları</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {bildirimAktif ? 'Açık' : 'Kapalı'}
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
                                <Text style={styles.pickerButtonLabel}>⏰ Hatırlatma Aralığı</Text>
                                <Text style={styles.pickerButtonValue}>
                                    {hatirlatmaAraligi >= 60 ? `${hatirlatmaAraligi / 60} saat` : `${hatirlatmaAraligi} dk`}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.oneriButon, { marginTop: 15 }]}
                                onPress={testGonder}
                            >
                                <Text style={styles.oneriButonYazi}>📲 Test Gönder</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Sessiz Saatler */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🌙 Sessiz Saatler</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {sessizSaatler.aktif
                                ? `${sessizSaatler.baslangic}:00 - ${sessizSaatler.bitis}:00`
                                : 'Kapalı'}
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
                                    <Text style={styles.pickerButtonLabel}>Başlangıç</Text>
                                    <Text style={styles.pickerButtonValue}>{sessizSaatler.baslangic}:00</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1 }]}
                                    onPress={() => setSessizBitisModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>Bitiş</Text>
                                    <Text style={styles.pickerButtonValue}>{sessizSaatler.bitis}:00</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.sessizAciklama}>
                                Bu saatlerde bildirim gönderilmez
                            </Text>
                        </>
                    )}
                </View>

                {/* Ses Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🔊 Ses Efektleri</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {sesAktif ? '🎵 Ses Açık' : '🔇 Ses Kapalı'}
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
                    <Text style={styles.temaBaslik}>🧠 Akıllı Hatırlatma</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {akilliHatirlatma.aktif ? `${akilliHatirlatma.aralikDakika} dk su içmezsen hatırlat` : 'Kapalı'}
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
                                <Text style={styles.pickerButtonLabel}>⏱️ Hatırlatma Süresi</Text>
                                <Text style={styles.pickerButtonValue}>
                                    {akilliHatirlatma.aralikDakika >= 60
                                        ? `${akilliHatirlatma.aralikDakika / 60} saat`
                                        : `${akilliHatirlatma.aralikDakika} dk`}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.sessizAciklama}>
                                Son su içtiğin zamandan itibaren süre başlar
                            </Text>
                            <TouchableOpacity
                                style={[styles.oneriButon, { marginTop: 10 }]}
                                onPress={async () => {
                                    await akilliHatirlatmaTestBildirimi();
                                }}
                            >
                                <Text style={styles.oneriButonYazi}>📲 Akıllı Test</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Günlük Özet */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>📊 Günlük Özet Bildirimi</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {gunlukOzet.aktif ? `Her gün ${gunlukOzet.saat}:00'da` : 'Kapalı'}
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
                                Gün sonunda performans özeti alacaksın
                            </Text>
                            <TouchableOpacity
                                style={[styles.oneriButon, { marginTop: 10 }]}
                                onPress={async () => {
                                    await gunlukOzetTestBildirimi();
                                }}
                            >
                                <Text style={styles.oneriButonYazi}>📲 Günlük Test</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Haftalık Rapor */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>📊 Haftalık Rapor</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {haftalikRapor.aktif ? 'Her Pazar 20:00' : 'Kapalı'}
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
                                Haftalık su tüketiminle ilgili özet bildirim alacaksın
                            </Text>
                            <TouchableOpacity
                                style={[styles.oneriButon, { marginTop: 10 }]}
                                onPress={async () => {
                                    await haftalikRaporTestBildirimi();
                                }}
                            >
                                <Text style={styles.oneriButonYazi}>📲 Haftalık Test</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Bioritim Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🌅 Bioritim Entegrasyonu</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {bioritim.aktif ? `Uyanış: ${bioritim.uyanmaSaati}` : 'Kapalı'}
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
                                    style={[styles.pickerButton, { flex: 1 }]}
                                    onPress={() => setBioritimUyanmaModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>☀️ Uyanış</Text>
                                    <Text style={styles.pickerButtonValue}>{bioritim.uyanmaSaati}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pickerButton, { flex: 1 }]}
                                    onPress={() => setBioritimUyumaModalGoster(true)}
                                >
                                    <Text style={styles.pickerButtonLabel}>🌙 Uyku</Text>
                                    <Text style={styles.pickerButtonValue}>{bioritim.uyumaSaati}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.sessizAciklama}>
                                Uyanış saatine göre su içme hatırlatması alacaksın
                            </Text>
                        </>
                    )}
                </View>

                {/* Detoks Modu */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🧪 Detoks Modu</Text>

                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {detoks.aktif ? '💪 Hedef +20% Artırıldı' : 'Kapalı'}
                        </Text>
                        <Switch
                            value={detoks.aktif}
                            onValueChange={async (value) => {
                                const yeniAyar = { aktif: value };
                                setDetoks(yeniAyar);
                                await detoksAyarKaydet(yeniAyar);
                                if (value) {
                                    Alert.alert('🧪 Detoks Modu Aktif', 'Günlük su hedefin %20 artırıldı!');
                                }
                            }}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={detoks.aktif ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {detoks.aktif && (
                        <Text style={styles.sessizAciklama}>
                            Detoks modunda hedefin %20 fazlası önerilir
                        </Text>
                    )}
                </View>

                {/* Tema Ayarları */}
                <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.temaBaslik}>🎨 Tema Ayarları</Text>

                    {/* Koyu/Açık Mod */}
                    <View style={styles.modSatir}>
                        <Text style={styles.modEtiket}>
                            {mod === 'koyu' ? '🌙 Koyu Mod' : '☀️ Açık Mod'}
                        </Text>
                        <Switch
                            value={mod === 'koyu'}
                            onValueChange={(value) => modDegistir(value ? 'koyu' : 'acik')}
                            trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                            thumbColor={mod === 'koyu' ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Apple Health Entegrasyonu (Sadece iOS) */}
                {healthKitDestekleniyor() && (
                    <View style={[styles.temaContainer, { backgroundColor: renkler.kartArkaplan }]}>
                        <Text style={styles.temaBaslik}>❤️ Apple Health</Text>

                        <View style={styles.modSatir}>
                            <Text style={styles.modEtiket}>
                                {healthKitAktif ? 'Senkronizasyon Aktif' : 'Senkronizasyon Kapalı'}
                            </Text>
                            <Switch
                                value={healthKitAktif}
                                onValueChange={async () => {
                                    const yeniDurum = await healthKitToggle();
                                    setHealthKitAktif(yeniDurum);
                                }}
                                trackColor={{ false: '#ccc', true: '#4FC3F7' }}
                                thumbColor={healthKitAktif ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        <Text style={styles.sessizAciklama}>
                            Su tüketimin otomatik olarak Apple Health'e kaydedilir.
                        </Text>
                    </View>
                )}

                {/* Uygulama Bilgileri */}
                <View style={[styles.bilgiContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.bilgiBaslik}>Uygulama Hakkında</Text>

                    <View style={styles.bilgiSatir}>
                        <Text style={styles.bilgiEtiket}>Versiyon</Text>
                        <Text style={styles.bilgiDeger}>1.0.0</Text>
                    </View>

                    <View style={styles.bilgiSatir}>
                        <Text style={styles.bilgiEtiket}>Geliştirici</Text>
                        <Text style={styles.bilgiDeger}>Serhat Cirit</Text>
                    </View>

                    <View style={styles.bilgiSatir}>
                        <Text style={styles.bilgiEtiket}>Gizlilik Politikası</Text>
                        <Text style={styles.bilgiDeger}>📄 Mevcut</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.oneriButon, { marginTop: 15 }]}
                        onPress={async () => {
                            await AsyncStorage.removeItem('@onboarding_tamamlandi');
                            Alert.alert('✅ Sıfırlandı', 'Uygulamayı yeniden başlattığınızda onboarding görünecek.');
                        }}
                    >
                        <Text style={styles.oneriButonYazi}>🔄 Onboarding'i Sıfırla</Text>
                    </TouchableOpacity>
                </View>

                {/* İpuçları */}
                <View style={[styles.ipucuContainer, { backgroundColor: renkler.kartArkaplan }]}>
                    <Text style={styles.ipucuBaslik}>💡 Su İçme İpuçları</Text>
                    <Text style={styles.ipucuMetin}>
                        • Sabah kalktığında bir bardak su iç{'\n'}
                        • Her yemekten önce su iç{'\n'}
                        • Yanında su şişesi taşı{'\n'}
                        • Kahve/çay yerine bazen su tercih et{'\n'}
                        • Susama hissetmeden önce iç
                    </Text>
                </View>

                {/* Alt boşluk */}
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Günlük Hedef Picker Modal */}
            <PickerModal
                visible={hedefModalGoster}
                title="Günlük Su Hedefi (ml)"
                value={gunlukHedef}
                options={[
                    { label: '1000 ml (1 L)', value: 1000 },
                    { label: '1500 ml (1.5 L)', value: 1500 },
                    { label: '2000 ml (2 L)', value: 2000 },
                    { label: '2500 ml (2.5 L)', value: 2500 },
                    { label: '3000 ml (3 L)', value: 3000 },
                    { label: '3500 ml (3.5 L)', value: 3500 },
                    { label: '4000 ml (4 L)', value: 4000 },
                ]}
                onSelect={(value) => hedefDegistir(Number(value))}
                onClose={() => setHedefModalGoster(false)}
            />

            {/* Bildirim Aralığı Picker Modal */}
            <PickerModal
                visible={bildirimAralikModalGoster}
                title="Hatırlatma Aralığı"
                value={hatirlatmaAraligi}
                options={[
                    { label: '15 dakika', value: 15 },
                    { label: '30 dakika', value: 30 },
                    { label: '45 dakika', value: 45 },
                    { label: '1 saat', value: 60 },
                    { label: '1.5 saat', value: 90 },
                    { label: '2 saat', value: 120 },
                    { label: '3 saat', value: 180 },
                    { label: '4 saat', value: 240 },
                ]}
                onSelect={(value) => aralikDegistir(Number(value))}
                onClose={() => setBildirimAralikModalGoster(false)}
            />

            {/* Akıllı Hatırlatma Aralığı Picker Modal */}
            <PickerModal
                visible={akilliAralikModalGoster}
                title="Su İçmezsen Hatırlat"
                value={akilliHatirlatma.aralikDakika}
                options={[
                    { label: '30 dakika', value: 30 },
                    { label: '45 dakika', value: 45 },
                    { label: '1 saat', value: 60 },
                    { label: '1.5 saat', value: 90 },
                    { label: '2 saat', value: 120 },
                    { label: '2.5 saat', value: 150 },
                    { label: '3 saat', value: 180 },
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
                title="Sessiz Saat Başlangıcı"
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
                title="Sessiz Saat Bitişi"
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
                title="Uyanış Saati"
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
                title="Uyku Saati"
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
});
