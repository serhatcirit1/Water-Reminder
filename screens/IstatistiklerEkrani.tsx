// ============================================
// İSTATİSTİKLER EKRANI
// ============================================
// Tam özellikli istatistikler - Haftalık/Aylık grafikler dahil

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions,
    ActivityIndicator, Animated, Easing, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTema } from '../TemaContext';
import {
    rekorYukle, RekorBilgisi, streakHesapla, StreakBilgisi,
    hedefYukle, suIcmeSaatleriYukle, SaatIstatistik,
    favoriSaatHesapla, enAktifZamanDilimi
} from '../ayarlarUtils';
import { seviyeDurumuYukle, SeviyeDurumu } from '../seviyeSistemi';
import { rozetleriYukle, Rozet } from '../rozetler';
import { gunlukGorevleriYukle, GunlukGorevDurumu } from '../gunlukGorevler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GECMIS_KEY = '@su_gecmisi';

interface GunlukVeri {
    gun: string;
    tarih: string;
    miktar: number;
    ml: number;
}

export function IstatistiklerEkrani() {
    const { renkler } = useTema();

    // State
    const [yukleniyor, setYukleniyor] = useState(true);
    const [aktifTab, setAktifTab] = useState<'haftalik' | 'aylik'>('haftalik');
    const [gunlukHedef, setGunlukHedef] = useState(2000);
    const [rekor, setRekor] = useState<RekorBilgisi | null>(null);
    const [streak, setStreak] = useState<StreakBilgisi | null>(null);
    const [seviye, setSeviye] = useState<SeviyeDurumu | null>(null);
    const [rozetler, setRozetler] = useState<Rozet[]>([]);
    const [gorevDurumu, setGorevDurumu] = useState<GunlukGorevDurumu | null>(null);
    const [saatIstatistikleri, setSaatIstatistikleri] = useState<SaatIstatistik[]>([]);
    const [favoriSaat, setFavoriSaat] = useState<{ saat: number; toplam: number } | null>(null);
    const [aktifDilim, setAktifDilim] = useState<{ dilim: string; emoji: string; toplam: number } | null>(null);
    const [haftalikVeri, setHaftalikVeri] = useState<GunlukVeri[]>([]);
    const [aylikVeri, setAylikVeri] = useState<GunlukVeri[]>([]);
    const [buHaftaToplam, setBuHaftaToplam] = useState(0);
    const [gecenHaftaToplam, setGecenHaftaToplam] = useState(0);
    const [son15GunToplam, setSon15GunToplam] = useState(0);
    const [onceki15GunToplam, setOnceki15GunToplam] = useState(0);

    // Tooltip ve seçili öğeler
    const [seciliRozet, setSeciliRozet] = useState<Rozet | null>(null);
    const [tooltipVeri, setTooltipVeri] = useState<{ tarih: string; ml: number } | null>(null);

    // Animasyonlar
    const barAnimasyonlari = useRef<Animated.Value[]>([]).current;

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

            const rekorData = await rekorYukle();
            setRekor(rekorData);

            const streakData = await streakHesapla(hedef);
            setStreak(streakData);

            const seviyeData = await seviyeDurumuYukle();
            setSeviye(seviyeData);

            const rozetData = await rozetleriYukle();
            setRozetler(rozetData.rozetler); // Tüm rozetler (kilitli dahil)

            const gorevData = await gunlukGorevleriYukle();
            setGorevDurumu(gorevData);

            const saatData = await suIcmeSaatleriYukle();
            setSaatIstatistikleri(saatData);

            const favori = await favoriSaatHesapla();
            setFavoriSaat(favori);

            const dilim = await enAktifZamanDilimi();
            setAktifDilim(dilim);

            await gecmisVerileriYukle(hedef);

        } catch (hata) {
            console.error('İstatistikler yüklenemedi:', hata);
        } finally {
            setYukleniyor(false);
        }
    };

    const gecmisVerileriYukle = async (hedef: number) => {
        const kayitliGecmis = await AsyncStorage.getItem(GECMIS_KEY);
        const gecmis = kayitliGecmis ? JSON.parse(kayitliGecmis) : {};
        const bugun = new Date();
        const gunler = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

        // Haftalık (son 7 gün)
        const haftalik: GunlukVeri[] = [];
        let buHafta = 0;
        let gecenHafta = 0;
        let son15 = 0;
        let onceki15 = 0;

        for (let i = 6; i >= 0; i--) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];
            const veri = gecmis[tarihStr];

            let ml = 0;
            let miktar = 0;
            if (veri) {
                if (typeof veri === 'object') {
                    ml = veri.ml || 0;
                    miktar = veri.miktar || 0;
                } else {
                    miktar = veri;
                    ml = veri * 250;
                }
            }

            haftalik.push({
                gun: gunler[tarih.getDay()],
                tarih: tarihStr,
                miktar,
                ml,
            });
            buHafta += ml;
        }
        setHaftalikVeri(haftalik);
        setBuHaftaToplam(buHafta);

        // Aylık (son 30 gün)
        const aylik: GunlukVeri[] = [];
        for (let i = 29; i >= 0; i--) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - i);
            const tarihStr = tarih.toISOString().split('T')[0];
            const veri = gecmis[tarihStr];

            let ml = 0;
            let miktar = 0;
            if (veri) {
                if (typeof veri === 'object') {
                    ml = veri.ml || 0;
                    miktar = veri.miktar || 0;
                } else {
                    miktar = veri;
                    ml = veri * 250;
                }
            }

            aylik.push({
                gun: tarih.getDate().toString(),
                tarih: tarihStr,
                miktar,
                ml,
            });

            if (i >= 7 && i < 14) gecenHafta += ml;
            if (i < 15) son15 += ml;
            else onceki15 += ml;
        }
        setAylikVeri(aylik);
        setGecenHaftaToplam(gecenHafta);
        setSon15GunToplam(son15);
        setOnceki15GunToplam(onceki15);

        // Bar animasyonlarını başlat
        animasyonlariBaslat(7);
    };

    const animasyonlariBaslat = (count: number) => {
        barAnimasyonlari.length = 0;
        for (let i = 0; i < count; i++) {
            barAnimasyonlari.push(new Animated.Value(0));
        }

        const animations = barAnimasyonlari.map(anim =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            })
        );

        // Aylık için daha hızlı (count > 7)
        const staggerDelay = count > 7 ? 15 : 60;
        Animated.stagger(staggerDelay, animations).start();
    };

    // Hesaplamalar
    const toplamHaftalik = haftalikVeri.reduce((t, g) => t + g.ml, 0);
    const ortalamaGunluk = haftalikVeri.length > 0
        ? Math.round(toplamHaftalik / haftalikVeri.length)
        : 0;
    const hedefeUlasanGun = haftalikVeri.filter(g => g.ml >= gunlukHedef).length;
    const maxMiktar = Math.max(...haftalikVeri.map(g => g.ml), gunlukHedef);
    const enYuksekGun = haftalikVeri.reduce((max, g) => g.ml > max.ml ? g : max, haftalikVeri[0] || { ml: 0, gun: '-' });

    // Aylık hesaplamalar
    const toplamAylik = aylikVeri.reduce((t, g) => t + g.ml, 0);
    const ortalamaAylik = aylikVeri.length > 0 ? Math.round(toplamAylik / aylikVeri.length) : 0;
    const aylikBasariGun = aylikVeri.filter(g => g.ml >= gunlukHedef).length;
    const aylikMaxMiktar = Math.max(...aylikVeri.map(g => g.ml), gunlukHedef);

    // Trend hesaplama
    const haftalikTrend = gecenHaftaToplam > 0
        ? Math.round(((buHaftaToplam - gecenHaftaToplam) / gecenHaftaToplam) * 100)
        : (buHaftaToplam > 0 ? 100 : 0);

    const aylikTrend = onceki15GunToplam > 0
        ? Math.round(((son15GunToplam - onceki15GunToplam) / onceki15GunToplam) * 100)
        : (son15GunToplam > 0 ? 100 : 0);

    if (yukleniyor) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: '#15202B' }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4FC3F7" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Başlık */}
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>📊</Text>
                    <Text style={styles.headerTitle}>İstatistikler</Text>
                    <Text style={styles.headerSubtitle}>Son 7 günlük su tüketimin</Text>
                </View>

                {/* Seviye Kartı */}
                {seviye && (
                    <View style={styles.levelCard}>
                        <View style={styles.levelHeader}>
                            <Text style={styles.levelTitle}>{seviye.unvan}</Text>
                            <Text style={styles.levelNumber}>Seviye {seviye.seviye}</Text>
                        </View>
                        <View style={styles.xpBarBg}>
                            <View
                                style={[
                                    styles.xpBarFill,
                                    { width: `${Math.min((seviye.mevcutSeviyeXP / seviye.sonrakiSeviyeXP) * 100, 100)}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.xpText}>
                            {seviye.mevcutSeviyeXP} / {seviye.sonrakiSeviyeXP} XP
                        </Text>
                        <Text style={styles.totalXp}>Toplam: {seviye.toplamXP} XP</Text>
                    </View>
                )}

                {/* Rekor Kartı */}
                <View style={styles.rekorCard}>
                    <Text style={styles.rekorEmoji}>🏆</Text>
                    <View style={styles.rekorInfo}>
                        <Text style={styles.rekorLabel}>En İyi Gün (Rekor)</Text>
                        <Text style={styles.rekorValue}>{rekor?.ml || 0} ml</Text>
                        <Text style={styles.rekorDate}>{rekor?.tarih || '-'}</Text>
                    </View>
                </View>

                {/* Streak Kartı */}
                <View style={styles.streakCard}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>Mevcut Seri</Text>
                        <Text style={styles.streakValue}>
                            {streak?.mevcutStreak === 0 ? 'Bugün başla!' : `${streak?.mevcutStreak} gün`}
                        </Text>
                    </View>
                    <View style={styles.streakDivider} />
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>En Uzun Seri</Text>
                        <Text style={styles.streakValueSecondary}>{streak?.enUzunStreak || 0} gün</Text>
                    </View>
                </View>

                {/* Favori Saatler */}
                <View style={styles.favoriCard}>
                    <View style={styles.favoriHeader}>
                        <Text style={styles.favoriEmoji}>🕐</Text>
                        <Text style={styles.favoriTitle}>Favori Saatler (24 Saat)</Text>
                    </View>
                    <Text style={styles.favoriSubtitle}>Saatlere tıklayarak detay görebilirsin</Text>

                    <View style={styles.favoriInfoRow}>
                        {aktifDilim && (
                            <View style={styles.favoriInfoBox}>
                                <Text style={styles.favoriInfoEmoji}>{aktifDilim.emoji}</Text>
                                <Text style={styles.favoriInfoValue}>{aktifDilim.dilim}</Text>
                                <Text style={styles.favoriInfoLabel}>En Aktif Dilim</Text>
                            </View>
                        )}
                        {favoriSaat && (
                            <View style={styles.favoriInfoBox}>
                                <Text style={styles.favoriInfoEmoji}>⭐</Text>
                                <Text style={styles.favoriInfoValue}>{favoriSaat.saat}:00</Text>
                                <Text style={styles.favoriInfoLabel}>{favoriSaat.toplam} bardak</Text>
                            </View>
                        )}
                    </View>

                    {/* 24 Saatlik Çizgi Grafik */}
                    <View style={styles.lineChartContainer}>
                        <Svg width={SCREEN_WIDTH - 80} height={120}>
                            {/* Arka plan çizgileri */}
                            <Line x1={0} y1={30} x2={SCREEN_WIDTH - 80} y2={30} stroke="#1E5166" strokeWidth={0.5} />
                            <Line x1={0} y1={60} x2={SCREEN_WIDTH - 80} y2={60} stroke="#1E5166" strokeWidth={0.5} />
                            <Line x1={0} y1={90} x2={SCREEN_WIDTH - 80} y2={90} stroke="#1E5166" strokeWidth={1} />

                            {/* Çizgi Path */}
                            {saatIstatistikleri.length > 0 && (() => {
                                const maxToplam = Math.max(...saatIstatistikleri.map(s => s.toplam), 1);
                                const chartWidth = SCREEN_WIDTH - 80;
                                const chartHeight = 60;

                                let pathD = '';
                                saatIstatistikleri.forEach((s, i) => {
                                    const x = (i / 23) * chartWidth;
                                    const y = 90 - (s.toplam / maxToplam) * chartHeight;
                                    pathD += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
                                });

                                // Gradient fill path
                                const fillPathD = pathD + ` L ${chartWidth} 90 L 0 90 Z`;

                                return (
                                    <>
                                        <Path d={fillPathD} fill="#4FC3F7" fillOpacity={0.2} />
                                        <Path d={pathD} stroke="#4FC3F7" strokeWidth={2} fill="none" />
                                    </>
                                );
                            })()}

                            {/* Noktalar ve tıklama alanları */}
                            {saatIstatistikleri.map((s, i) => {
                                const maxToplam = Math.max(...saatIstatistikleri.map(st => st.toplam), 1);
                                const x = (i / 23) * (SCREEN_WIDTH - 80);
                                const y = 90 - (s.toplam / maxToplam) * 60;
                                const isTop = s.toplam === maxToplam && s.toplam > 0;
                                return (
                                    <Circle
                                        key={i}
                                        cx={x}
                                        cy={y}
                                        r={isTop ? 5 : 3}
                                        fill={isTop ? '#FFD700' : s.toplam > 0 ? '#4FC3F7' : '#1E5166'}
                                        onPress={() => setFavoriSaat(favoriSaat?.saat === s.saat ? null : { saat: s.saat, toplam: s.toplam })}
                                    />
                                );
                            })}

                            {/* Saat etiketleri */}
                            {[0, 6, 12, 18, 23].map((hour) => {
                                const x = (hour / 23) * (SCREEN_WIDTH - 80);
                                return (
                                    <SvgText key={hour} x={x} y={108} fontSize="9" fill="#90CAF9" textAnchor="middle">
                                        {hour}:00
                                    </SvgText>
                                );
                            })}
                        </Svg>
                    </View>

                    {/* Seçili Saat Tooltip */}
                    {favoriSaat && (
                        <TouchableOpacity
                            style={styles.saatTooltip}
                            onPress={() => setFavoriSaat(null)}
                        >
                            <Text style={styles.saatTooltipText}>
                                🕐 {favoriSaat.saat}:00 • 💧 {favoriSaat.toplam} bardak su içilmiş
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Trend Analizi */}
                <View style={styles.trendCard}>
                    <View style={styles.trendHeader}>
                        <Text style={styles.trendEmoji}>📈</Text>
                        <Text style={styles.trendTitle}>Trend Analizi</Text>
                    </View>
                    <Text style={styles.trendSubtitle}>Geçmiş dönemlerle karşılaştırma</Text>

                    <View style={styles.trendRow}>
                        <View style={styles.trendBox}>
                            <Text style={styles.trendBoxTitle}>Bu Hafta vs Geçen Hafta</Text>
                            <Text style={styles.trendIcon}>{haftalikTrend >= 0 ? '📈' : '📉'}</Text>
                            <Text style={[styles.trendPercent, { color: haftalikTrend >= 0 ? '#4CAF50' : '#F44336' }]}>
                                {haftalikTrend >= 0 ? '+' : ''}{haftalikTrend}%
                            </Text>
                            <Text style={styles.trendDetail}>
                                {Math.round(buHaftaToplam / 250)} vs {Math.round(gecenHaftaToplam / 250)} bardak
                            </Text>
                        </View>
                        <View style={styles.trendBox}>
                            <Text style={styles.trendBoxTitle}>Son 15 Gün vs Önceki 15 Gün</Text>
                            <Text style={styles.trendIcon}>{aylikTrend >= 0 ? '📈' : '📉'}</Text>
                            <Text style={[styles.trendPercent, { color: aylikTrend >= 0 ? '#4CAF50' : '#F44336' }]}>
                                {aylikTrend >= 0 ? '+' : ''}{aylikTrend}%
                            </Text>
                            <Text style={styles.trendDetail}>
                                {Math.round(son15GunToplam / 250)} vs {Math.round(onceki15GunToplam / 250)} bardak
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tab Seçici */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, aktifTab === 'haftalik' && styles.tabActive]}
                        onPress={() => { setAktifTab('haftalik'); animasyonlariBaslat(7); }}
                    >
                        <Text style={[styles.tabText, aktifTab === 'haftalik' && styles.tabTextActive]}>
                            📊 Haftalık
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, aktifTab === 'aylik' && styles.tabActive]}
                        onPress={() => { setAktifTab('aylik'); animasyonlariBaslat(30); }}
                    >
                        <Text style={[styles.tabText, aktifTab === 'aylik' && styles.tabTextActive]}>
                            📅 Aylık
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Haftalık Grafik */}
                {aktifTab === 'haftalik' && (
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartTitle}>Haftalık Görünüm</Text>
                            <Text style={styles.chartSubtitle}>Toplam: {(toplamHaftalik / 1000).toFixed(1)}L</Text>
                        </View>

                        {/* Bar Chart */}
                        <View style={styles.barChart}>
                            {haftalikVeri.map((gun, index) => {
                                const heightPercent = Math.max((gun.ml / maxMiktar) * 100, 5);
                                const isSuccess = gun.ml >= gunlukHedef;
                                const animValue = barAnimasyonlari[index] || new Animated.Value(1);
                                const animatedHeight = animValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', `${heightPercent}%`],
                                });

                                return (
                                    <View key={index} style={styles.barWrapper}>
                                        <Text style={styles.barValue}>{Math.round(gun.ml / 100) / 10}L</Text>
                                        <View style={styles.barBg}>
                                            <Animated.View style={[
                                                styles.bar,
                                                { height: animatedHeight },
                                                isSuccess ? styles.barSuccess : styles.barNormal
                                            ]} />
                                        </View>
                                        <Text style={styles.barLabel}>{gun.gun}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Özet */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{ortalamaGunluk}</Text>
                                <Text style={styles.summaryLabel}>Ort. ml/gün</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{hedefeUlasanGun}/7</Text>
                                <Text style={styles.summaryLabel}>Başarılı Gün</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{enYuksekGun?.gun || '-'}</Text>
                                <Text style={styles.summaryLabel}>En İyi Gün</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Aylık Grafik */}
                {aktifTab === 'aylik' && (
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartTitle}>Aylık Görünüm (30 Gün)</Text>
                            <Text style={styles.chartSubtitle}>Toplam: {(toplamAylik / 1000).toFixed(1)}L</Text>
                        </View>

                        {/* İnline Tooltip */}
                        {tooltipVeri && (
                            <TouchableOpacity
                                style={styles.grafikTooltip}
                                onPress={() => setTooltipVeri(null)}
                            >
                                <Text style={styles.grafikTooltipText}>
                                    📅 {tooltipVeri.tarih} • 💧 {tooltipVeri.ml} ml
                                    {tooltipVeri.ml >= gunlukHedef ? ' ✅' : ''}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Animasyonlu Bar Chart with Tooltips */}
                        <View style={styles.monthlyChart}>
                            {aylikVeri.map((gun, index) => {
                                const heightPercent = Math.max((gun.ml / aylikMaxMiktar) * 100, 3);
                                const isSuccess = gun.ml >= gunlukHedef;
                                const animValue = barAnimasyonlari[index] || new Animated.Value(1);
                                const animatedHeight = animValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', `${heightPercent}%`],
                                });
                                // Her 3 günde bir tarih göster
                                const showDate = index % 3 === 0;
                                const tarihParts = gun.tarih.split('-');
                                const tarihLabel = tarihParts.length >= 3 ? `${tarihParts[2]}/${tarihParts[1]}` : '';

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.monthlyBarWrapper}
                                        onPress={() => setTooltipVeri(
                                            tooltipVeri?.tarih === gun.tarih ? null : { tarih: gun.tarih, ml: gun.ml }
                                        )}
                                    >
                                        <Animated.View style={[
                                            styles.monthlyBar,
                                            { height: animatedHeight },
                                            isSuccess ? styles.barSuccess : styles.barNormal
                                        ]} />
                                        {showDate && (
                                            <Text style={styles.monthlyDateLabel}>{tarihLabel}</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Özet */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{ortalamaAylik}</Text>
                                <Text style={styles.summaryLabel}>Ort. ml/gün</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{aylikBasariGun}/30</Text>
                                <Text style={styles.summaryLabel}>Başarılı Gün</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Başarı Oranı */}
                <View style={styles.basariCard}>
                    <View style={styles.basariHeader}>
                        <Text style={styles.basariEmoji}>🎯</Text>
                        <Text style={styles.basariTitle}>
                            {aktifTab === 'haftalik' ? 'Haftalık Başarı' : 'Aylık Başarı'}
                        </Text>
                    </View>
                    <View style={styles.basariBarBg}>
                        <View style={[
                            styles.basariBarFill,
                            {
                                width: aktifTab === 'haftalik'
                                    ? `${(hedefeUlasanGun / 7) * 100}%`
                                    : `${(aylikBasariGun / 30) * 100}%`
                            }
                        ]} />
                    </View>
                    <Text style={styles.basariYuzde}>
                        %{aktifTab === 'haftalik'
                            ? Math.round((hedefeUlasanGun / 7) * 100)
                            : Math.round((aylikBasariGun / 30) * 100)}
                    </Text>
                    <Text style={styles.basariAciklama}>
                        {aktifTab === 'haftalik'
                            ? `${hedefeUlasanGun}/7 gün hedefe ulaştın`
                            : `${aylikBasariGun}/30 gün hedefe ulaştın`}
                    </Text>
                </View>

                {/* Motivasyon Kartı */}
                <View style={styles.motivasyonCard}>
                    <Text style={styles.motivasyonEmoji}>
                        {hedefeUlasanGun >= 5 ? '🏆' : hedefeUlasanGun >= 3 ? '💪' : '🌱'}
                    </Text>
                    <Text style={styles.motivasyonMesaj}>
                        {hedefeUlasanGun >= 5
                            ? 'Muhteşem performans! Bu hafta harikasın!'
                            : hedefeUlasanGun >= 3
                                ? 'İyi gidiyorsun! Biraz daha gayret!'
                                : 'Her gün yeni bir başlangıç! Devam et!'}
                    </Text>
                </View>

                {/* Günlük Görevler Özeti */}
                {gorevDurumu && (
                    <View style={styles.gorevCard}>
                        <View style={styles.gorevHeader}>
                            <Text style={styles.gorevEmoji}>✅</Text>
                            <Text style={styles.gorevTitle}>Günlük Görevler</Text>
                        </View>
                        <View style={styles.gorevProgress}>
                            <View style={styles.gorevBarBg}>
                                <View style={[
                                    styles.gorevBarFill,
                                    { width: `${(gorevDurumu.toplamTamamlanan / gorevDurumu.gorevler.length) * 100}%` }
                                ]} />
                            </View>
                            <Text style={styles.gorevSayi}>
                                {gorevDurumu.toplamTamamlanan}/{gorevDurumu.gorevler.length}
                            </Text>
                        </View>
                        <View style={styles.gorevListe}>
                            {gorevDurumu.gorevler.map((gorev, index) => (
                                <View key={index} style={styles.gorevItem}>
                                    <Text style={styles.gorevCheck}>
                                        {gorev.tamamlandi ? '✅' : '⬜'}
                                    </Text>
                                    <Text style={[
                                        styles.gorevText,
                                        gorev.tamamlandi && styles.gorevTamamlandi
                                    ]}>
                                        {gorev.aciklama}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Rozetler */}
                <View style={styles.rozetCard}>
                    <Text style={styles.rozetTitle}>
                        🏅 Rozetler ({rozetler.filter(r => r.kazanildi).length}/{rozetler.length})
                    </Text>

                    {/* Seçili Rozet Bilgisi */}
                    {seciliRozet && (
                        <TouchableOpacity
                            style={styles.rozetTooltip}
                            onPress={() => setSeciliRozet(null)}
                        >
                            <Text style={styles.rozetTooltipEmoji}>
                                {seciliRozet.kazanildi ? seciliRozet.emoji : '🔒'}
                            </Text>
                            <View style={styles.rozetTooltipContent}>
                                <Text style={styles.rozetTooltipTitle}>{seciliRozet.isim}</Text>
                                <Text style={styles.rozetTooltipDesc}>{seciliRozet.aciklama}</Text>
                                <Text style={styles.rozetTooltipStatus}>
                                    {seciliRozet.kazanildi ? '✅ Kazanıldı!' : '🎯 ' + seciliRozet.kosul}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={styles.rozetGrid}>
                        {rozetler.map((rozet, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.rozetItem,
                                    !rozet.kazanildi && styles.rozetKilitli
                                ]}
                                onPress={() => setSeciliRozet(seciliRozet?.isim === rozet.isim ? null : rozet)}
                            >
                                <Text style={[
                                    styles.rozetEmoji,
                                    !rozet.kazanildi && styles.rozetEmojiKilitli
                                ]}>
                                    {rozet.kazanildi ? rozet.emoji : '🔒'}
                                </Text>
                                <Text style={[
                                    styles.rozetName,
                                    !rozet.kazanildi && styles.rozetNameKilitli
                                ]}>
                                    {rozet.isim}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { alignItems: 'center', marginBottom: 25 },
    headerEmoji: { fontSize: 32, marginBottom: 5 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
    headerSubtitle: { fontSize: 14, color: '#90CAF9', marginTop: 5 },

    levelCard: { backgroundColor: '#0D47A1', borderRadius: 20, padding: 20, marginBottom: 15 },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    levelTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    levelNumber: { fontSize: 14, color: '#90CAF9' },
    xpBarBg: { height: 10, backgroundColor: '#1565C0', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
    xpBarFill: { height: '100%', backgroundColor: '#4FC3F7', borderRadius: 5 },
    xpText: { fontSize: 12, color: '#90CAF9', textAlign: 'center' },
    totalXp: { fontSize: 12, color: '#4FC3F7', textAlign: 'center', marginTop: 5 },

    rekorCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
    rekorEmoji: { fontSize: 48, marginRight: 20 },
    rekorInfo: {},
    rekorLabel: { fontSize: 12, color: '#90CAF9' },
    rekorValue: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
    rekorDate: { fontSize: 12, color: '#90CAF9' },

    streakCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#FF5722' },
    streakEmoji: { fontSize: 40, marginRight: 15 },
    streakInfo: { flex: 1 },
    streakLabel: { fontSize: 12, color: '#90CAF9' },
    streakValue: { fontSize: 20, fontWeight: 'bold', color: '#FF5722' },
    streakValueSecondary: { fontSize: 18, fontWeight: 'bold', color: '#4FC3F7' },
    streakDivider: { width: 1, height: 40, backgroundColor: '#1E5166', marginHorizontal: 15 },

    favoriCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20 },
    favoriHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    favoriEmoji: { fontSize: 24, marginRight: 10 },
    favoriTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    favoriSubtitle: { fontSize: 12, color: '#90CAF9', marginBottom: 20 },
    favoriInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    favoriInfoBox: { backgroundColor: '#0D3A4D', borderRadius: 15, padding: 15, flex: 0.48, alignItems: 'center' },
    favoriInfoEmoji: { fontSize: 28, marginBottom: 8 },
    favoriInfoValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
    favoriInfoLabel: { fontSize: 11, color: '#90CAF9', marginTop: 4 },
    chartContainer: { alignItems: 'center' },

    // Çizgi Grafik
    lineChartContainer: {
        alignItems: 'center',
        backgroundColor: '#0D3A4D',
        borderRadius: 15,
        padding: 15,
        marginTop: 10,
    },
    saatTooltip: {
        backgroundColor: '#1E88E5',
        borderRadius: 10,
        padding: 12,
        marginTop: 15,
        alignItems: 'center',
    },
    saatTooltipText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

    trendCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20 },
    trendHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    trendEmoji: { fontSize: 24, marginRight: 10 },
    trendTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    trendSubtitle: { fontSize: 12, color: '#90CAF9', marginBottom: 20 },
    trendRow: { flexDirection: 'row', justifyContent: 'space-between' },
    trendBox: { backgroundColor: '#0D3A4D', borderRadius: 15, padding: 15, flex: 0.48, alignItems: 'center' },
    trendBoxTitle: { fontSize: 11, color: '#90CAF9', textAlign: 'center', marginBottom: 10 },
    trendIcon: { fontSize: 24, marginBottom: 5 },
    trendPercent: { fontSize: 24, fontWeight: 'bold' },
    trendDetail: { fontSize: 10, color: '#90CAF9', marginTop: 5 },

    tabContainer: { flexDirection: 'row', backgroundColor: '#0D3A4D', borderRadius: 12, padding: 4, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#134156' },
    tabText: { fontSize: 14, color: '#90CAF9', fontWeight: '600' },
    tabTextActive: { color: '#4FC3F7' },

    chartCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    chartSubtitle: { fontSize: 14, color: '#90CAF9' },

    // Grafik Tooltip
    grafikTooltip: {
        backgroundColor: '#0D3A4D',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    grafikTooltipText: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },

    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, marginBottom: 20 },
    barWrapper: { alignItems: 'center', width: (SCREEN_WIDTH - 80) / 7 },
    barValue: { fontSize: 9, color: '#90CAF9', marginBottom: 5 },
    barBg: { width: 20, height: 120, justifyContent: 'flex-end', backgroundColor: '#0D3A4D', borderRadius: 10 },
    bar: { width: '100%', borderRadius: 10 },
    barNormal: { backgroundColor: '#29B6F6' },
    barSuccess: { backgroundColor: '#4CAF50' },
    barLabel: { marginTop: 8, fontSize: 11, color: '#90CAF9' },

    monthlyChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, marginBottom: 30, justifyContent: 'space-between' },
    monthlyBarWrapper: { width: (SCREEN_WIDTH - 80) / 30, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    monthlyBar: { width: '70%', borderRadius: 2 },
    monthlyDateLabel: { fontSize: 7, color: '#90CAF9', marginTop: 4, position: 'absolute', bottom: -18 },

    summaryRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1E5166', paddingTop: 15 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#4FC3F7' },
    summaryLabel: { fontSize: 11, color: '#90CAF9', marginTop: 4 },

    // Başarı Oranı Kartı
    basariCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center' },
    basariHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    basariEmoji: { fontSize: 28, marginRight: 10 },
    basariTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    basariBarBg: { width: '100%', height: 12, backgroundColor: '#0D3A4D', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
    basariBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 6 },
    basariYuzde: { fontSize: 36, fontWeight: 'bold', color: '#4CAF50', marginBottom: 5 },
    basariAciklama: { fontSize: 14, color: '#90CAF9' },

    // Motivasyon Kartı
    motivasyonCard: { backgroundColor: '#134156', borderRadius: 20, padding: 25, marginBottom: 20, alignItems: 'center' },
    motivasyonEmoji: { fontSize: 48, marginBottom: 10 },
    motivasyonMesaj: { fontSize: 16, color: '#FFFFFF', textAlign: 'center', fontWeight: '600' },

    // Günlük Görevler Kartı
    gorevCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20 },
    gorevHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    gorevEmoji: { fontSize: 24, marginRight: 10 },
    gorevTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    gorevProgress: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    gorevBarBg: { flex: 1, height: 8, backgroundColor: '#0D3A4D', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
    gorevBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
    gorevSayi: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
    gorevListe: { marginTop: 5 },
    gorevItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    gorevCheck: { fontSize: 16, marginRight: 10 },
    gorevText: { fontSize: 14, color: '#FFFFFF', flex: 1 },
    gorevTamamlandi: { color: '#90CAF9', textDecorationLine: 'line-through' },

    // Rozetler
    rozetCard: { backgroundColor: '#134156', borderRadius: 20, padding: 20, marginBottom: 20 },
    rozetTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
    rozetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    rozetItem: { alignItems: 'center', width: '25%', marginVertical: 10 },
    rozetEmoji: { fontSize: 28, marginBottom: 5 },
    rozetName: { fontSize: 10, color: '#90CAF9', textAlign: 'center' },
    rozetKilitli: { opacity: 0.5 },
    rozetEmojiKilitli: { opacity: 0.7 },
    rozetNameKilitli: { color: '#607D8B' },

    // Rozet Tooltip
    rozetTooltip: {
        flexDirection: 'row',
        backgroundColor: '#0D3A4D',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    rozetTooltipEmoji: { fontSize: 40, marginRight: 15 },
    rozetTooltipContent: { flex: 1 },
    rozetTooltipTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
    rozetTooltipDesc: { fontSize: 12, color: '#90CAF9', marginBottom: 4 },
    rozetTooltipStatus: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
});
