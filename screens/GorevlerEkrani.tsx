// ============================================
// GÖREVLER & ROZETLER EKRANI
// ============================================
// Günlük görevler ve başarı rozetleri

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions,
    ActivityIndicator, Animated, Easing, TouchableOpacity, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTema } from '../TemaContext';
import { seviyeDurumuYukle, SeviyeDurumu, XP_KAZANIMLARI } from '../seviyeSistemi';
import { rozetleriYukle, Rozet, ROZET_TANIMLARI } from '../rozetler';
import { gunlukGorevleriYukle, GunlukGorevDurumu, GunlukGorev } from '../gunlukGorevler';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function GorevlerEkrani() {
    const { renkler } = useTema();
    const { t } = useTranslation();

    // State
    const [yukleniyor, setYukleniyor] = useState(true);
    const [seviye, setSeviye] = useState<SeviyeDurumu | null>(null);
    const [rozetler, setRozetler] = useState<Rozet[]>([]);
    const [gorevDurumu, setGorevDurumu] = useState<GunlukGorevDurumu | null>(null);
    const [seciliRozet, setSeciliRozet] = useState<Rozet | null>(null);
    const [rozetModalGoster, setRozetModalGoster] = useState(false);
    const [aktifRozetTab, setAktifRozetTab] = useState<'tumu' | 'kazanilan' | 'kilitli'>('tumu');

    // Animasyonlar
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const progressAnims = useRef<Animated.Value[]>([]).current;
    const xpBarAnim = useRef(new Animated.Value(0)).current;
    const badgeScaleAnims = useRef<Animated.Value[]>([]).current;

    useFocusEffect(
        useCallback(() => {
            verileriYukle();
        }, [])
    );

    const verileriYukle = async () => {
        setYukleniyor(true);
        try {
            const seviyeData = await seviyeDurumuYukle();
            setSeviye(seviyeData);

            const rozetData = await rozetleriYukle();
            setRozetler(rozetData.rozetler);

            const gorevData = await gunlukGorevleriYukle();
            setGorevDurumu(gorevData);

            // Animasyonları başlat
            animasyonlariBaslat(gorevData, seviyeData, rozetData.rozetler);
        } catch (hata) {
            console.error('Görevler yüklenemedi:', hata);
        } finally {
            setYukleniyor(false);
        }
    };

    const animasyonlariBaslat = (gorev: GunlukGorevDurumu, seviye: SeviyeDurumu, rozetler: Rozet[]) => {
        // Fade in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Progress animasyonları
        progressAnims.length = 0;
        gorev.gorevler.forEach((g) => {
            const anim = new Animated.Value(0);
            progressAnims.push(anim);
            const targetValue = g.hedef > 0 ? Math.min(g.ilerleme / g.hedef, 1) : (g.tamamlandi ? 1 : 0);
            Animated.timing(anim, {
                toValue: targetValue,
                duration: 800,
                delay: 200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        });

        // XP bar animasyonu
        const xpPercent = seviye.sonrakiSeviyeXP > 0
            ? Math.min(seviye.mevcutSeviyeXP / seviye.sonrakiSeviyeXP, 1)
            : 0;
        Animated.timing(xpBarAnim, {
            toValue: xpPercent,
            duration: 1000,
            delay: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        // Badge scale animasyonları
        badgeScaleAnims.length = 0;
        rozetler.forEach((r, i) => {
            const anim = new Animated.Value(0);
            badgeScaleAnims.push(anim);
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: 400 + (i * 40),
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }).start();
        });
    };

    // Filtrelenmiş rozetler
    const filtrelenmisRozetler = rozetler.filter(r => {
        if (aktifRozetTab === 'kazanilan') return r.kazanildi;
        if (aktifRozetTab === 'kilitli') return !r.kazanildi;
        return true;
    });

    const kazanilanSayisi = rozetler.filter(r => r.kazanildi).length;
    const toplamRozet = rozetler.length;

    // Streak rozetleri
    const streakRozetler = rozetler.filter(r => r.id.startsWith('streak_'));
    const toplamRozetler = rozetler.filter(r => r.id.startsWith('toplam_'));
    const ozelRozetler = rozetler.filter(r => !r.id.startsWith('streak_') && !r.id.startsWith('toplam_'));

    if (yukleniyor) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={renkler.vurguAcik} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            <Animated.ScrollView
                style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Başlık */}
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🎯</Text>
                    <Text style={[styles.headerTitle, { color: renkler.metin }]}>
                        {t('gorevler.title')}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: renkler.metinSoluk }]}>
                        {t('gorevler.subtitle')}
                    </Text>
                </View>

                {/* Seviye Kartı */}
                {seviye && (
                    <LinearGradient
                        colors={['#1a3a4a', '#0d2533']}
                        style={styles.seviyeCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.seviyeHeader}>
                            <View style={styles.seviyeBadge}>
                                <Text style={styles.seviyeNum}>{seviye.seviye}</Text>
                            </View>
                            <View style={styles.seviyeInfo}>
                                <Text style={styles.seviyeUnvan}>{t(seviye.unvan)}</Text>
                                <Text style={styles.seviyeLabel}>
                                    {t('home.level')} {seviye.seviye}
                                </Text>
                            </View>
                            <View style={styles.seviyeXPBadge}>
                                <Text style={styles.seviyeXPText}>{seviye.toplamXP} XP</Text>
                            </View>
                        </View>

                        <View style={styles.xpBarContainer}>
                            <View style={styles.xpBarBg}>
                                <Animated.View
                                    style={[
                                        styles.xpBarFill,
                                        {
                                            width: xpBarAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            })
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.xpBarText}>
                                {seviye.mevcutSeviyeXP} / {seviye.sonrakiSeviyeXP} XP
                            </Text>
                        </View>

                        {/* XP Kazanım Tablosu */}
                        <View style={styles.xpKazanimRow}>
                            <View style={styles.xpKazanimItem}>
                                <Text style={styles.xpKazanimEmoji}>💧</Text>
                                <Text style={styles.xpKazanimLabel}>+{XP_KAZANIMLARI.SU_ICME}</Text>
                            </View>
                            <View style={styles.xpKazanimItem}>
                                <Text style={styles.xpKazanimEmoji}>🎯</Text>
                                <Text style={styles.xpKazanimLabel}>+{XP_KAZANIMLARI.HEDEF_TAMAMLAMA}</Text>
                            </View>
                            <View style={styles.xpKazanimItem}>
                                <Text style={styles.xpKazanimEmoji}>🔥</Text>
                                <Text style={styles.xpKazanimLabel}>+{XP_KAZANIMLARI.STREAK_7}</Text>
                            </View>
                            <View style={styles.xpKazanimItem}>
                                <Text style={styles.xpKazanimEmoji}>🏆</Text>
                                <Text style={styles.xpKazanimLabel}>+{XP_KAZANIMLARI.REKOR_KIRMA}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Günlük Görevler */}
                {gorevDurumu && (
                    <View style={[styles.sectionCard, { backgroundColor: renkler.kartArkaplan }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionEmoji}>📋</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { color: renkler.metin }]}>
                                    {t('gorevler.dailyTasks')}
                                </Text>
                                <Text style={[styles.sectionSubtitle, { color: renkler.metinSoluk }]}>
                                    {t('gorevler.dailyTasksDesc')}
                                </Text>
                            </View>
                            <View style={styles.gorevSayacBadge}>
                                <Text style={styles.gorevSayacText}>
                                    {gorevDurumu.toplamTamamlanan}/{gorevDurumu.gorevler.length}
                                </Text>
                            </View>
                        </View>

                        {/* Genel İlerleme */}
                        <View style={styles.genelIlerlemeContainer}>
                            <View style={[styles.genelIlerlemeBg, { backgroundColor: renkler.arkaplan }]}>
                                <LinearGradient
                                    colors={gorevDurumu.toplamTamamlanan === gorevDurumu.gorevler.length
                                        ? ['#4CAF50', '#66BB6A']
                                        : ['#4FC3F7', '#29B6F6']}
                                    style={[
                                        styles.genelIlerlemeFill,
                                        { width: `${(gorevDurumu.toplamTamamlanan / gorevDurumu.gorevler.length) * 100}%` }
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            </View>
                        </View>

                        {/* Görev Listesi */}
                        {gorevDurumu.gorevler.map((gorev, index) => {
                            const progressAnim = progressAnims[index] || new Animated.Value(0);
                            const ilerlemeYuzde = gorev.hedef > 0 ? Math.min((gorev.ilerleme / gorev.hedef) * 100, 100) : (gorev.tamamlandi ? 100 : 0);

                            return (
                                <View
                                    key={gorev.id}
                                    style={[
                                        styles.gorevItem,
                                        { backgroundColor: renkler.arkaplan },
                                        gorev.tamamlandi && styles.gorevTamamlandiItem
                                    ]}
                                >
                                    <View style={styles.gorevItemLeft}>
                                        <View style={[
                                            styles.gorevEmojiContainer,
                                            gorev.tamamlandi && styles.gorevEmojiTamamlandi
                                        ]}>
                                            <Text style={styles.gorevEmoji}>
                                                {gorev.tamamlandi ? '✅' : gorev.emoji}
                                            </Text>
                                        </View>
                                        <View style={styles.gorevTextContainer}>
                                            <Text style={[
                                                styles.gorevBaslik,
                                                { color: renkler.metin },
                                                gorev.tamamlandi && styles.gorevBaslikTamamlandi
                                            ]}>
                                                {t(gorev.baslik)}
                                            </Text>
                                            <Text style={[styles.gorevAciklama, { color: renkler.metinSoluk }]}>
                                                {t(gorev.aciklama)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.gorevItemRight}>
                                        <View style={styles.gorevProgressContainer}>
                                            <View style={[styles.gorevProgressBg, { backgroundColor: renkler.arkaplan }]}>
                                                <Animated.View
                                                    style={[
                                                        styles.gorevProgressFill,
                                                        {
                                                            backgroundColor: gorev.tamamlandi ? '#4CAF50' : '#4FC3F7',
                                                            width: progressAnim.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: ['0%', '100%'],
                                                            })
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={[styles.gorevProgressText, { color: renkler.metinSoluk }]}>
                                                {Math.round(ilerlemeYuzde)}%
                                            </Text>
                                        </View>
                                        <View style={[styles.xpBadge, gorev.tamamlandi && styles.xpBadgeKazanildi]}>
                                            <Text style={[styles.xpBadgeText, gorev.tamamlandi && styles.xpBadgeTextKazanildi]}>
                                                +{gorev.xpOdulu} XP
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Tüm görevler tamamlandıysa kutlama */}
                        {gorevDurumu.toplamTamamlanan === gorevDurumu.gorevler.length && (
                            <LinearGradient
                                colors={['#1B5E20', '#2E7D32']}
                                style={styles.tumGorevTamamCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.tumGorevTamamEmoji}>🎉</Text>
                                <Text style={styles.tumGorevTamamText}>
                                    {t('gorevler.allCompleted')}
                                </Text>
                            </LinearGradient>
                        )}
                    </View>
                )}

                {/* Başarı Rozetleri */}
                <View style={[styles.sectionCard, { backgroundColor: renkler.kartArkaplan }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionEmoji}>🏅</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sectionTitle, { color: renkler.metin }]}>
                                {t('gorevler.badges')}
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: renkler.metinSoluk }]}>
                                {t('gorevler.badgesDesc')}
                            </Text>
                        </View>
                        <View style={styles.rozetSayacBadge}>
                            <Text style={styles.rozetSayacText}>
                                {kazanilanSayisi}/{toplamRozet}
                            </Text>
                        </View>
                    </View>

                    {/* Rozet İlerleme Barı */}
                    <View style={styles.rozetIlerlemeContainer}>
                        <View style={[styles.rozetIlerlemeBg, { backgroundColor: renkler.arkaplan }]}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA000']}
                                style={[
                                    styles.rozetIlerlemeFill,
                                    { width: `${toplamRozet > 0 ? (kazanilanSayisi / toplamRozet) * 100 : 0}%` }
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </View>
                        <Text style={[styles.rozetIlerlemeText, { color: renkler.metinSoluk }]}>
                            %{toplamRozet > 0 ? Math.round((kazanilanSayisi / toplamRozet) * 100) : 0} {t('gorevler.completed')}
                        </Text>
                    </View>

                    {/* Rozet Filtreleme Tabları */}
                    <View style={styles.rozetTabContainer}>
                        {(['tumu', 'kazanilan', 'kilitli'] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.rozetTab,
                                    aktifRozetTab === tab && [styles.rozetTabActive, { borderColor: renkler.vurguAcik }]
                                ]}
                                onPress={() => setAktifRozetTab(tab)}
                            >
                                <Text style={[
                                    styles.rozetTabText,
                                    { color: renkler.metinSoluk },
                                    aktifRozetTab === tab && { color: renkler.vurguAcik }
                                ]}>
                                    {tab === 'tumu' ? t('gorevler.all') : tab === 'kazanilan' ? t('gorevler.earned') : t('gorevler.locked')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Rozet Kategorileri */}
                    {aktifRozetTab === 'tumu' ? (
                        <>
                            {/* Streak Rozetleri */}
                            <View style={styles.rozetKategori}>
                                <Text style={[styles.rozetKategoriTitle, { color: renkler.metin }]}>
                                    🔥 {t('gorevler.streakBadges')}
                                </Text>
                                <View style={styles.rozetGrid}>
                                    {streakRozetler.map((rozet, index) => (
                                        <TouchableOpacity
                                            key={rozet.id}
                                            style={[
                                                styles.rozetGridItem,
                                                { backgroundColor: renkler.arkaplan },
                                                rozet.kazanildi && styles.rozetGridItemKazanildi
                                            ]}
                                            onPress={() => { setSeciliRozet(rozet); setRozetModalGoster(true); }}
                                            activeOpacity={0.7}
                                        >
                                            <Animated.View style={{
                                                transform: [{ scale: badgeScaleAnims[rozetler.indexOf(rozet)] || new Animated.Value(1) }]
                                            }}>
                                                <Text style={styles.rozetGridEmoji}>
                                                    {rozet.kazanildi ? rozet.emoji : '🔒'}
                                                </Text>
                                            </Animated.View>
                                            <Text style={[
                                                styles.rozetGridIsim,
                                                { color: rozet.kazanildi ? renkler.metin : renkler.metinSoluk }
                                            ]} numberOfLines={1}>
                                                {t(rozet.isim)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Toplam Su Rozetleri */}
                            <View style={styles.rozetKategori}>
                                <Text style={[styles.rozetKategoriTitle, { color: renkler.metin }]}>
                                    💧 {t('gorevler.totalBadges')}
                                </Text>
                                <View style={styles.rozetGrid}>
                                    {toplamRozetler.map((rozet) => (
                                        <TouchableOpacity
                                            key={rozet.id}
                                            style={[
                                                styles.rozetGridItem,
                                                { backgroundColor: renkler.arkaplan },
                                                rozet.kazanildi && styles.rozetGridItemKazanildi
                                            ]}
                                            onPress={() => { setSeciliRozet(rozet); setRozetModalGoster(true); }}
                                            activeOpacity={0.7}
                                        >
                                            <Animated.View style={{
                                                transform: [{ scale: badgeScaleAnims[rozetler.indexOf(rozet)] || new Animated.Value(1) }]
                                            }}>
                                                <Text style={styles.rozetGridEmoji}>
                                                    {rozet.kazanildi ? rozet.emoji : '🔒'}
                                                </Text>
                                            </Animated.View>
                                            <Text style={[
                                                styles.rozetGridIsim,
                                                { color: rozet.kazanildi ? renkler.metin : renkler.metinSoluk }
                                            ]} numberOfLines={1}>
                                                {t(rozet.isim)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Özel Rozetler */}
                            <View style={styles.rozetKategori}>
                                <Text style={[styles.rozetKategoriTitle, { color: renkler.metin }]}>
                                    ⭐ {t('gorevler.specialBadges')}
                                </Text>
                                <View style={styles.rozetGrid}>
                                    {ozelRozetler.map((rozet) => (
                                        <TouchableOpacity
                                            key={rozet.id}
                                            style={[
                                                styles.rozetGridItem,
                                                { backgroundColor: renkler.arkaplan },
                                                rozet.kazanildi && styles.rozetGridItemKazanildi
                                            ]}
                                            onPress={() => { setSeciliRozet(rozet); setRozetModalGoster(true); }}
                                            activeOpacity={0.7}
                                        >
                                            <Animated.View style={{
                                                transform: [{ scale: badgeScaleAnims[rozetler.indexOf(rozet)] || new Animated.Value(1) }]
                                            }}>
                                                <Text style={styles.rozetGridEmoji}>
                                                    {rozet.kazanildi ? rozet.emoji : '🔒'}
                                                </Text>
                                            </Animated.View>
                                            <Text style={[
                                                styles.rozetGridIsim,
                                                { color: rozet.kazanildi ? renkler.metin : renkler.metinSoluk }
                                            ]} numberOfLines={1}>
                                                {t(rozet.isim)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={styles.rozetGrid}>
                            {filtrelenmisRozetler.map((rozet) => (
                                <TouchableOpacity
                                    key={rozet.id}
                                    style={[
                                        styles.rozetGridItem,
                                        { backgroundColor: renkler.arkaplan },
                                        rozet.kazanildi && styles.rozetGridItemKazanildi
                                    ]}
                                    onPress={() => { setSeciliRozet(rozet); setRozetModalGoster(true); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.rozetGridEmoji}>
                                        {rozet.kazanildi ? rozet.emoji : '🔒'}
                                    </Text>
                                    <Text style={[
                                        styles.rozetGridIsim,
                                        { color: rozet.kazanildi ? renkler.metin : renkler.metinSoluk }
                                    ]} numberOfLines={1}>
                                        {t(rozet.isim)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {filtrelenmisRozetler.length === 0 && (
                                <View style={styles.bosRozetContainer}>
                                    <Text style={styles.bosRozetEmoji}>
                                        {aktifRozetTab === 'kazanilan' ? '🌟' : '🎯'}
                                    </Text>
                                    <Text style={[styles.bosRozetText, { color: renkler.metinSoluk }]}>
                                        {aktifRozetTab === 'kazanilan'
                                            ? t('gorevler.noEarnedYet')
                                            : t('gorevler.allEarned')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </Animated.ScrollView>

            {/* Rozet Detay Modalı */}
            <Modal
                visible={rozetModalGoster}
                transparent
                animationType="fade"
                onRequestClose={() => setRozetModalGoster(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setRozetModalGoster(false)}
                >
                    <View style={[styles.rozetModalContent, { backgroundColor: renkler.kartArkaplan }]}>
                        {seciliRozet && (
                            <>
                                <View style={[
                                    styles.rozetModalEmojiContainer,
                                    seciliRozet.kazanildi ? styles.rozetModalKazanildi : styles.rozetModalKilitli
                                ]}>
                                    <Text style={styles.rozetModalEmoji}>
                                        {seciliRozet.kazanildi ? seciliRozet.emoji : '🔒'}
                                    </Text>
                                </View>
                                <Text style={[styles.rozetModalTitle, { color: renkler.metin }]}>
                                    {t(seciliRozet.isim)}
                                </Text>
                                <Text style={[styles.rozetModalDesc, { color: renkler.metinSoluk }]}>
                                    {t(seciliRozet.aciklama)}
                                </Text>
                                <View style={[
                                    styles.rozetModalStatusBadge,
                                    seciliRozet.kazanildi ? styles.statusKazanildi : styles.statusKilitli
                                ]}>
                                    <Text style={styles.rozetModalStatusText}>
                                        {seciliRozet.kazanildi
                                            ? `✅ ${t('gorevler.badgeEarned')}`
                                            : `🎯 ${t(seciliRozet.kosul)}`}
                                    </Text>
                                </View>
                                {seciliRozet.kazanilmaTarihi && (
                                    <Text style={[styles.rozetModalTarih, { color: renkler.metinSoluk }]}>
                                        📅 {seciliRozet.kazanilmaTarihi}
                                    </Text>
                                )}
                                <TouchableOpacity
                                    style={[styles.rozetModalKapat, { backgroundColor: renkler.vurguAcik }]}
                                    onPress={() => setRozetModalGoster(false)}
                                >
                                    <Text style={[styles.rozetModalKapatText, { color: renkler.arkaplan }]}>
                                        {t('common.close')}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerEmoji: {
        fontSize: 36,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
    },

    // Seviye Kartı
    seviyeCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 20,
    },
    seviyeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    seviyeBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4FC3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    seviyeNum: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0A2A3A',
    },
    seviyeInfo: {
        flex: 1,
        marginLeft: 14,
    },
    seviyeUnvan: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    seviyeLabel: {
        fontSize: 13,
        color: '#81D4FA',
        marginTop: 2,
    },
    seviyeXPBadge: {
        backgroundColor: 'rgba(79, 195, 247, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    seviyeXPText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4FC3F7',
    },
    xpBarContainer: {
        marginBottom: 14,
    },
    xpBarBg: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: '#4FC3F7',
        borderRadius: 5,
    },
    xpBarText: {
        fontSize: 11,
        color: '#81D4FA',
        textAlign: 'right',
        marginTop: 4,
    },
    xpKazanimRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    xpKazanimItem: {
        alignItems: 'center',
    },
    xpKazanimEmoji: {
        fontSize: 18,
        marginBottom: 2,
    },
    xpKazanimLabel: {
        fontSize: 11,
        color: '#81D4FA',
        fontWeight: '600',
    },

    // Section Card
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionEmoji: {
        fontSize: 28,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },

    // Görev Sayacı
    gorevSayacBadge: {
        backgroundColor: '#4FC3F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    gorevSayacText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0A2A3A',
    },

    // Genel İlerleme
    genelIlerlemeContainer: {
        marginBottom: 16,
    },
    genelIlerlemeBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    genelIlerlemeFill: {
        height: '100%',
        borderRadius: 3,
    },

    // Görev Item
    gorevItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
    },
    gorevTamamlandiItem: {
        opacity: 0.75,
    },
    gorevItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    gorevEmojiContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: 'rgba(79, 195, 247, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    gorevEmojiTamamlandi: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    gorevEmoji: {
        fontSize: 20,
    },
    gorevTextContainer: {
        flex: 1,
    },
    gorevBaslik: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    gorevBaslikTamamlandi: {
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
    gorevAciklama: {
        fontSize: 12,
        lineHeight: 16,
    },
    gorevItemRight: {
        alignItems: 'flex-end',
    },
    gorevProgressContainer: {
        alignItems: 'flex-end',
        marginBottom: 4,
    },
    gorevProgressBg: {
        width: 60,
        height: 5,
        borderRadius: 3,
        overflow: 'hidden',
    },
    gorevProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    gorevProgressText: {
        fontSize: 10,
        marginTop: 2,
    },
    xpBadge: {
        backgroundColor: 'rgba(79, 195, 247, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    xpBadgeKazanildi: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    xpBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4FC3F7',
    },
    xpBadgeTextKazanildi: {
        color: '#4CAF50',
    },

    // Tüm görevler tamamlandı
    tumGorevTamamCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        marginTop: 6,
    },
    tumGorevTamamEmoji: {
        fontSize: 24,
        marginRight: 10,
    },
    tumGorevTamamText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },

    // Rozet Sayaç
    rozetSayacBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    rozetSayacText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0A2A3A',
    },

    // Rozet İlerleme
    rozetIlerlemeContainer: {
        marginBottom: 14,
    },
    rozetIlerlemeBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    rozetIlerlemeFill: {
        height: '100%',
        borderRadius: 3,
    },
    rozetIlerlemeText: {
        fontSize: 11,
        textAlign: 'right',
        marginTop: 4,
    },

    // Rozet Tab
    rozetTabContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    rozetTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    rozetTabActive: {
        borderWidth: 1,
    },
    rozetTabText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Rozet Kategori
    rozetKategori: {
        marginBottom: 16,
    },
    rozetKategoriTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },

    // Rozet Grid
    rozetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    rozetGridItem: {
        width: (SCREEN_WIDTH - 94) / 4,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 14,
    },
    rozetGridItemKazanildi: {
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    rozetGridEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    rozetGridIsim: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Boş rozet
    bosRozetContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 30,
    },
    bosRozetEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    bosRozetText: {
        fontSize: 14,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    rozetModalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
    },
    rozetModalEmojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    rozetModalKazanildi: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
    },
    rozetModalKilitli: {
        backgroundColor: 'rgba(128, 128, 128, 0.15)',
    },
    rozetModalEmoji: {
        fontSize: 44,
    },
    rozetModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    rozetModalDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    rozetModalStatusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    statusKazanildi: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    statusKilitli: {
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
    },
    rozetModalStatusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    rozetModalTarih: {
        fontSize: 12,
        marginBottom: 16,
    },
    rozetModalKapat: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 14,
        minWidth: 120,
        alignItems: 'center',
    },
    rozetModalKapatText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
});
