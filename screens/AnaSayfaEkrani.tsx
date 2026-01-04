// ============================================
// ANA SAYFA EKRANI
// ============================================
// Orijinal su takip ana ekranı - Wave animasyonlu

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTema } from '../TemaContext';
import {
    hedefYukle, bardakBoyutuYukle,
    rekorKontrolEt, suIcmeSaatiKaydet, sonIcmeZamaniKaydet, BARDAK_SECENEKLERI,
    streakHesapla, StreakBilgisi, sonIcmeZamaniYukle
} from '../ayarlarUtils';
import { suIcmeXP, seviyeDurumuYukle, hedefTamamlamaXP, SeviyeDurumu } from '../seviyeSistemi';
import { gunlukGorevleriYukle, GunlukGorevDurumu, suIcmeGorevKontrol } from '../gunlukGorevler';
import { havaDurumuAl, HavaDurumuVerisi, sicaklikMesaji } from '../havaDurumu';
import { InsightsCard } from '../components/InsightsCard';
import { ForecastCard } from '../components/ForecastCard';
import {
    akilliHedefHesapla,
    AIHedefOnerisi,
    aiAyarlariniYukle,
    suIcmeSaatiKaydet as aiSuIcmeSaatiKaydet,
    bildirimTepkisiKaydet
} from '../aiUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Storage Keys
const GUNLUK_KEY = '@gunluk_su';
const GECMIS_KEY = '@su_gecmisi';

interface GunlukVeri {
    tarih: string;
    miktar: number;
    toplamMl: number;
}

// Animasyonlu dalga SVG
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function AnaSayfaEkrani() {
    const { renkler } = useTema();

    // State
    const [suMiktari, setSuMiktari] = useState(0);
    const [toplamMl, setToplamMl] = useState(0);
    const [gunlukHedef, setGunlukHedef] = useState(2500);
    const [bardakBoyutu, setBardakBoyutu] = useState(200);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hedefeTamamlandi, setHedefeTamamlandi] = useState(false);

    // Yeni özellikler için state
    const [havaDurumu, setHavaDurumu] = useState<HavaDurumuVerisi | null>(null);
    const [streak, setStreak] = useState<StreakBilgisi | null>(null);
    const [seviye, setSeviye] = useState<SeviyeDurumu | null>(null);
    const [sonIcmeZamani, setSonIcmeZamani] = useState<Date | null>(null);
    const [gorevDurumu, setGorevDurumu] = useState<GunlukGorevDurumu | null>(null);
    const [aiOneri, setAiOneri] = useState<AIHedefOnerisi | null>(null);

    // Animasyonlar
    const waveAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Wave animasyonu
    useEffect(() => {
        Animated.loop(
            Animated.timing(waveAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    useFocusEffect(
        useCallback(() => {
            verileriYukle();
        }, [])
    );

    const verileriYukle = async () => {
        setYukleniyor(true);
        try {
            const hedef = await hedefYukle();
            setGunlukHedef(hedef);

            const bBoyut = await bardakBoyutuYukle();
            setBardakBoyutu(bBoyut);

            const bugun = new Date().toDateString();
            const kayitliVeri = await AsyncStorage.getItem(GUNLUK_KEY);

            if (kayitliVeri) {
                const veri: GunlukVeri = JSON.parse(kayitliVeri);
                if (veri.tarih === bugun) {
                    setSuMiktari(veri.miktar);
                    setToplamMl(veri.toplamMl || veri.miktar * 250);
                    setHedefeTamamlandi((veri.toplamMl || veri.miktar * 250) >= hedef);
                } else {
                    await yeniGunBaslat(veri);
                }
            }

            // Yeni özellikler için veri yükle
            const havaData = await havaDurumuAl();
            setHavaDurumu(havaData);

            const streakData = await streakHesapla(hedef);
            setStreak(streakData);

            const seviyeData = await seviyeDurumuYukle();
            setSeviye(seviyeData);

            const sonIcme = await sonIcmeZamaniYukle();
            setSonIcmeZamani(sonIcme);

            const gorevData = await gunlukGorevleriYukle();
            setGorevDurumu(gorevData);

            // AI Hedef Hesapla
            const aiAyarlar = await aiAyarlariniYukle();
            if (aiAyarlar.aktif && havaData) {
                const oneri = await akilliHedefHesapla(hedef, havaData, 0);
                setAiOneri(oneri);
            }

        } catch (hata) {
            console.error('Veri yüklenemedi:', hata);
        } finally {
            setYukleniyor(false);
        }
    };

    const yeniGunBaslat = async (eskiVeri: GunlukVeri) => {
        if (eskiVeri && eskiVeri.toplamMl > 0) {
            const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
            const gecmis = gecmisStr ? JSON.parse(gecmisStr) : {};
            const tarihKey = new Date(eskiVeri.tarih).toISOString().split('T')[0];
            gecmis[tarihKey] = { ml: eskiVeri.toplamMl, miktar: eskiVeri.miktar };
            await AsyncStorage.setItem(GECMIS_KEY, JSON.stringify(gecmis));
        }

        setSuMiktari(0);
        setToplamMl(0);
        setHedefeTamamlandi(false);

        const yeniVeri: GunlukVeri = {
            tarih: new Date().toDateString(),
            miktar: 0,
            toplamMl: 0,
        };
        await AsyncStorage.setItem(GUNLUK_KEY, JSON.stringify(yeniVeri));
    };

    const suEkle = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        const yeniMiktar = suMiktari + 1;
        const yeniToplamMl = toplamMl + bardakBoyutu;

        setSuMiktari(yeniMiktar);
        setToplamMl(yeniToplamMl);

        const veri: GunlukVeri = {
            tarih: new Date().toDateString(),
            miktar: yeniMiktar,
            toplamMl: yeniToplamMl,
        };
        await AsyncStorage.setItem(GUNLUK_KEY, JSON.stringify(veri));

        const bugunKey = new Date().toISOString().split('T')[0];
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        const gecmis = gecmisStr ? JSON.parse(gecmisStr) : {};
        gecmis[bugunKey] = { ml: yeniToplamMl, miktar: yeniMiktar };
        await AsyncStorage.setItem(GECMIS_KEY, JSON.stringify(gecmis));

        await suIcmeSaatiKaydet();
        await sonIcmeZamaniKaydet();
        await suIcmeXP();

        // AI İçgörü sistemi için saat kaydı
        const simdikiSaat = new Date().getHours();
        const simdikiGun = new Date().getDay();
        await aiSuIcmeSaatiKaydet(simdikiSaat, simdikiGun);

        // Adaptif hatırlatma: Bildirimden sonra su içildiğini kaydet
        await bildirimTepkisiKaydet();

        // Günlük görev kontrolü
        const saat = new Date().getHours();
        const tamamlananGorev = await suIcmeGorevKontrol(yeniToplamMl, saat, bardakBoyutu);
        if (tamamlananGorev) {
            Alert.alert('✅ Görev Tamamlandı!', `${tamamlananGorev.baslik} - +${tamamlananGorev.xpOdulu} XP kazandın!`);
        }
        // Görev durumunu güncelle
        const yeniGorevDurumu = await gunlukGorevleriYukle();
        setGorevDurumu(yeniGorevDurumu);

        const yeniRekor = await rekorKontrolEt(yeniMiktar, yeniToplamMl);
        if (yeniRekor) {
            Alert.alert('🏆 Yeni Rekor!', `${yeniToplamMl} ml ile yeni rekor kırdın!`);
        }

        if (!hedefeTamamlandi && yeniToplamMl >= gunlukHedef) {
            setHedefeTamamlandi(true);
            await hedefTamamlamaXP();
            Alert.alert('🎉 Tebrikler!', 'Günlük hedefe ulaştın!');
        }
    };

    // Bugünü geri al fonksiyonu
    const bugunuGeriAl = async () => {
        if (suMiktari <= 0) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const yeniMiktar = Math.max(suMiktari - 1, 0);
        const yeniToplamMl = Math.max(toplamMl - bardakBoyutu, 0);

        setSuMiktari(yeniMiktar);
        setToplamMl(yeniToplamMl);

        if (yeniToplamMl < gunlukHedef) {
            setHedefeTamamlandi(false);
        }

        const veri: GunlukVeri = {
            tarih: new Date().toDateString(),
            miktar: yeniMiktar,
            toplamMl: yeniToplamMl,
        };
        await AsyncStorage.setItem(GUNLUK_KEY, JSON.stringify(veri));

        const bugunKey = new Date().toISOString().split('T')[0];
        const gecmisStr = await AsyncStorage.getItem(GECMIS_KEY);
        const gecmis = gecmisStr ? JSON.parse(gecmisStr) : {};
        gecmis[bugunKey] = { ml: yeniToplamMl, miktar: yeniMiktar };
        await AsyncStorage.setItem(GECMIS_KEY, JSON.stringify(gecmis));
    };

    const yuzde = (toplamMl / gunlukHedef) * 100; // Sınırsız yüzde
    const kalanMl = Math.max(gunlukHedef - toplamMl, 0);

    // Tarih formatı
    const bugun = new Date();
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const tarihStr = `${bugun.getDate()} ${aylar[bugun.getMonth()]} ${gunler[bugun.getDay()]}`;

    // Dalga yolu oluştur
    const createWavePath = (offset: number) => {
        const height = 200;
        const fillHeight = height * (1 - yuzde / 100);
        const amplitude = 8;
        const frequency = 0.03;

        let path = `M 0 ${fillHeight}`;
        for (let x = 0; x <= 200; x += 5) {
            const y = fillHeight + Math.sin((x + offset) * frequency * Math.PI * 2) * amplitude;
            path += ` L ${x} ${y}`;
        }
        path += ` L 200 200 L 0 200 Z`;
        return path;
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.waterDrop}>💧</Text>
                    <Text style={styles.title}>Su Takibi</Text>
                    <Text style={styles.date}>{tarihStr}</Text>
                </View>

                {/* Hava Durumu - En Üstte */}
                {havaDurumu && (
                    <View style={styles.havaDurumuKart}>
                        <Text style={styles.havaDurumuIcon}>{havaDurumu.icon}</Text>
                        <View style={styles.havaDurumuBilgi}>
                            <Text style={styles.havaDurumuSicaklik}>{havaDurumu.sicaklik}°C</Text>
                            <Text style={styles.havaDurumuMesaj}>{sicaklikMesaji(havaDurumu.sicaklik)}</Text>
                        </View>
                    </View>
                )}

                {/* Ana Dairesel İlerleme */}
                <Animated.View style={[styles.circleContainer, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Progress Ring */}
                    <Svg width={250} height={250} style={styles.progressRing}>
                        {/* Arka plan halkası */}
                        <Circle
                            cx={125}
                            cy={125}
                            r={115}
                            stroke="#1E5166"
                            strokeWidth={10}
                            fill="transparent"
                        />
                        {/* İlk tur - Mavi */}
                        <Circle
                            cx={125}
                            cy={125}
                            r={115}
                            stroke="#4FC3F7"
                            strokeWidth={10}
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 115}`}
                            strokeDashoffset={`${2 * Math.PI * 115 * (1 - Math.min(yuzde, 100) / 100)}`}
                            strokeLinecap="round"
                            rotation="-90"
                            origin="125, 125"
                        />
                        {/* İkinci tur - Yeşil (hedef aşıldığında) */}
                        {yuzde > 100 && (
                            <Circle
                                cx={125}
                                cy={125}
                                r={115}
                                stroke="#4CAF50"
                                strokeWidth={10}
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 115}`}
                                strokeDashoffset={`${2 * Math.PI * 115 * (1 - (yuzde - 100) / 100)}`}
                                strokeLinecap="round"
                                rotation="-90"
                                origin="125, 125"
                            />
                        )}
                    </Svg>

                    <View style={styles.progressCircle}>
                        {/* Gelişmiş Dalga Animasyonu */}
                        <Animated.View style={[styles.waveContainer, {
                            transform: [{
                                translateX: waveAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -100]
                                })
                            }]
                        }]}>
                            <Svg width={400} height={200} viewBox="0 0 400 200">
                                <Defs>
                                    <LinearGradient id="waveGradient1" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor="#4FC3F7" stopOpacity="0.95" />
                                        <Stop offset="0.5" stopColor="#29B6F6" stopOpacity="0.8" />
                                        <Stop offset="1" stopColor="#0288D1" stopOpacity="0.6" />
                                    </LinearGradient>
                                    <LinearGradient id="waveGradient2" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor="#81D4FA" stopOpacity="0.5" />
                                        <Stop offset="1" stopColor="#4FC3F7" stopOpacity="0.3" />
                                    </LinearGradient>
                                </Defs>
                                {/* Arka dalga */}
                                <Path
                                    d={`M0 ${200 - (yuzde / 100) * 180 + 15}
                                        Q50 ${200 - (yuzde / 100) * 180 - 10} 100 ${200 - (yuzde / 100) * 180 + 15}
                                        T200 ${200 - (yuzde / 100) * 180 + 15}
                                        T300 ${200 - (yuzde / 100) * 180 + 15}
                                        T400 ${200 - (yuzde / 100) * 180 + 15}
                                        L400 200 L0 200 Z`}
                                    fill="url(#waveGradient2)"
                                />
                                {/* Ön dalga */}
                                <Path
                                    d={`M0 ${200 - (yuzde / 100) * 180}
                                        Q50 ${200 - (yuzde / 100) * 180 - 20} 100 ${200 - (yuzde / 100) * 180}
                                        T200 ${200 - (yuzde / 100) * 180}
                                        T300 ${200 - (yuzde / 100) * 180}
                                        T400 ${200 - (yuzde / 100) * 180}
                                        L400 200 L0 200 Z`}
                                    fill="url(#waveGradient1)"
                                />
                            </Svg>
                        </Animated.View>

                        {/* Daire Maskesi */}
                        <View style={styles.circleMask} />

                        {/* Değerler */}
                        <View style={styles.valueContainer}>
                            <Text style={styles.mlValue}>{toplamMl}</Text>
                            <Text style={styles.mlLabel}>ml</Text>
                            <Text style={styles.hedefText}>/ {gunlukHedef}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Yüzde */}
                <View style={styles.percentContainer}>
                    <Text style={styles.percentValue}>%{Math.round(yuzde)}</Text>
                    <Text style={styles.percentLabel}>Tamamlandı</Text>
                </View>

                {/* Bardak Boyutu Seçici - Yukarıda */}
                <View style={styles.sizeSelector}>
                    <Text style={styles.sizeLabel}>Bardak Boyutu:</Text>
                    <View style={styles.sizeOptions}>
                        {BARDAK_SECENEKLERI.map((secenek) => (
                            <TouchableOpacity
                                key={secenek.ml}
                                style={[
                                    styles.sizeOption,
                                    bardakBoyutu === secenek.ml && styles.sizeOptionActive
                                ]}
                                onPress={() => setBardakBoyutu(secenek.ml)}
                            >
                                <Text style={[
                                    styles.sizeOptionText,
                                    bardakBoyutu === secenek.ml && styles.sizeOptionTextActive
                                ]}>
                                    {secenek.ml}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Su İç Butonu - Yukarıda */}
                <TouchableOpacity
                    style={styles.suIcButton}
                    onPress={suEkle}
                    activeOpacity={0.8}
                >
                    <Text style={styles.suIcEmoji}>💧</Text>
                    <View>
                        <Text style={styles.suIcText}>Su İç</Text>
                        <Text style={styles.suIcAmount}>+{bardakBoyutu} ml</Text>
                    </View>
                </TouchableOpacity>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>🥛</Text>
                        <Text style={styles.statValue}>{suMiktari}</Text>
                        <Text style={styles.statLabel}>Bardak</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>🎯</Text>
                        <Text style={styles.statValue}>{kalanMl} ml</Text>
                        <Text style={styles.statLabel}>Kalan</Text>
                    </View>
                </View>

                {/* Streak ve Seviye Satırı */}
                <View style={styles.miniKartRow}>
                    <View style={styles.miniKart}>
                        <Text style={styles.miniKartEmoji}>🔥</Text>
                        <Text style={styles.miniKartDeger}>{streak?.mevcutStreak || 0}</Text>
                        <Text style={styles.miniKartLabel}>Gün Seri</Text>
                    </View>
                    <View style={styles.miniKart}>
                        <Text style={styles.miniKartEmoji}>⭐</Text>
                        <Text style={styles.miniKartDeger}>Lv.{seviye?.seviye || 1}</Text>
                        <Text style={styles.miniKartLabel}>{seviye?.unvan || 'Damla'}</Text>
                    </View>
                    <View style={styles.miniKart}>
                        <Text style={styles.miniKartEmoji}>⏰</Text>
                        <Text style={styles.miniKartDeger}>
                            {sonIcmeZamani
                                ? `${Math.floor((Date.now() - sonIcmeZamani.getTime()) / 60000)} dk`
                                : '-'}
                        </Text>
                        <Text style={styles.miniKartLabel}>Son İçme</Text>
                    </View>
                </View>

                {/* Motivasyon Kartı */}
                <View style={styles.motivasyonKart}>
                    <Text style={styles.motivasyonEmoji}>
                        {yuzde >= 100 ? '🏆' : yuzde >= 75 ? '💪' : yuzde >= 50 ? '👍' : yuzde >= 25 ? '🌱' : '💧'}
                    </Text>
                    <Text style={styles.motivasyonMesaj}>
                        {yuzde >= 100 ? 'Harikasın! Bugünkü hedefi tamamladın!'
                            : yuzde >= 75 ? 'Neredeyse tamam! Son bir hamle!'
                                : yuzde >= 50 ? 'Yarıyı geçtin! Devam et!'
                                    : yuzde >= 25 ? 'İyi başlangıç! Daha fazla iç!'
                                        : 'Haydi, bugün de hedefine ulaş!'}
                    </Text>
                </View>

                {/* 💡 AI İçgörü Kartı */}
                <InsightsCard />

                {/* 📈 Haftalık Tahmin Kartı */}
                <ForecastCard
                    gunlukHedef={gunlukHedef}
                    bugunIcilen={toplamMl}
                />

                {/* Günlük Görevler Mini */}
                {gorevDurumu && gorevDurumu.gorevler.length > 0 && (
                    <View style={styles.gorevMiniKart}>
                        <View style={styles.gorevMiniHeader}>
                            <Text style={styles.gorevMiniEmoji}>✅</Text>
                            <Text style={styles.gorevMiniTitle}>Günlük Görevler</Text>
                            <Text style={styles.gorevMiniSayi}>
                                {gorevDurumu.toplamTamamlanan}/{gorevDurumu.gorevler.length}
                            </Text>
                        </View>
                        <View style={styles.gorevMiniBarBg}>
                            <View style={[
                                styles.gorevMiniBarFill,
                                { width: `${(gorevDurumu.toplamTamamlanan / gorevDurumu.gorevler.length) * 100}%` }
                            ]} />
                        </View>
                    </View>
                )}

                {/* Bugünü Geri Al Butonu */}
                {suMiktari > 0 && (
                    <TouchableOpacity
                        style={styles.geriAlButton}
                        onPress={bugunuGeriAl}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.geriAlEmoji}>↩️</Text>
                        <Text style={styles.geriAlText}>Son Bardağı Geri Al</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    contentContainer: { padding: 20, alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    waterDrop: { fontSize: 40, marginBottom: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
    date: { fontSize: 14, color: '#90CAF9', marginTop: 5 },

    circleContainer: {
        position: 'relative',
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressRing: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    progressCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        overflow: 'hidden',
        position: 'relative',
    },
    waveContainer: {
        position: 'absolute',
        width: 400,
        height: 200,
        bottom: 0,
        left: -100,
    },
    circleMask: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: '#1E5166',
        backgroundColor: 'transparent',
    },
    valueContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mlValue: { fontSize: 48, fontWeight: 'bold', color: '#FFFFFF' },
    mlLabel: { fontSize: 14, color: '#90CAF9', marginTop: -5 },
    hedefText: { fontSize: 14, color: '#90CAF9', marginTop: 5 },
    outerRing: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 4,
        borderColor: '#4FC3F7',
    },

    percentContainer: { alignItems: 'center', marginBottom: 30 },
    percentValue: { fontSize: 36, fontWeight: 'bold', color: '#4FC3F7' },
    percentLabel: { fontSize: 14, color: '#90CAF9' },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#134156',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: { alignItems: 'center' },
    statEmoji: { fontSize: 24, marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    statLabel: { fontSize: 12, color: '#90CAF9', marginTop: 4 },
    statDivider: { width: 1, height: 50, backgroundColor: '#1E5166' },

    sizeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        width: '100%',
    },
    sizeLabel: { fontSize: 14, color: '#90CAF9', marginRight: 15 },
    sizeOptions: { flexDirection: 'row', gap: 10 },
    sizeOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4FC3F7',
    },
    sizeOptionActive: {
        backgroundColor: '#4FC3F7',
    },
    sizeOptionText: { fontSize: 14, color: '#4FC3F7' },
    sizeOptionTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

    suIcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E88E5',
        paddingVertical: 18,
        paddingHorizontal: 50,
        borderRadius: 30,
        width: '100%',
        gap: 15,
        marginBottom: 25,
    },
    suIcEmoji: { fontSize: 28 },
    suIcText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    suIcAmount: { fontSize: 12, color: '#90CAF9', textAlign: 'center' },

    // Hava Durumu Kartı
    havaDurumuKart: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#134156',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        width: '100%',
    },
    havaDurumuIcon: { fontSize: 36, marginRight: 15 },
    havaDurumuBilgi: { flex: 1 },
    havaDurumuSicaklik: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    havaDurumuMesaj: { fontSize: 12, color: '#90CAF9', marginTop: 2 },

    // Mini Kart Satırı
    miniKartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
        gap: 10,
    },
    miniKart: {
        flex: 1,
        backgroundColor: '#134156',
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
    },
    miniKartEmoji: { fontSize: 24, marginBottom: 5 },
    miniKartDeger: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
    miniKartLabel: { fontSize: 10, color: '#90CAF9', marginTop: 3 },

    // Motivasyon Kartı
    motivasyonKart: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#134156',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        width: '100%',
    },
    motivasyonEmoji: { fontSize: 36, marginRight: 15 },
    motivasyonMesaj: { flex: 1, fontSize: 14, color: '#FFFFFF', fontWeight: '500' },

    // Günlük Görevler Mini Kartı
    gorevMiniKart: {
        backgroundColor: '#134156',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        width: '100%',
    },
    gorevMiniHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    gorevMiniEmoji: { fontSize: 20, marginRight: 10 },
    gorevMiniTitle: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
    gorevMiniSayi: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
    gorevMiniBarBg: {
        height: 6,
        backgroundColor: '#0D3A4D',
        borderRadius: 3,
        overflow: 'hidden',
    },
    gorevMiniBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },

    // Bugünü Geri Al Butonu
    geriAlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E3A50',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FF5722',
        marginTop: 10,
        width: '100%',
    },
    geriAlEmoji: { fontSize: 18, marginRight: 8 },
    geriAlText: { fontSize: 14, color: '#FF5722', fontWeight: '600' },
});
