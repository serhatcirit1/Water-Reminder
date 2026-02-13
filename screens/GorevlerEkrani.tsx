// ============================================
// GÖREVLER & ROZETLER EKRANI - UI PRO MAX
// ============================================
// Premium tasarım, akıcı animasyonlar ve gameification odaklı arayüz

import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Dimensions,
    ActivityIndicator, Animated, TouchableOpacity, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTema } from '../TemaContext';
import { seviyeDurumuYukle, SeviyeDurumu, XP_KAZANIMLARI } from '../seviyeSistemi';
import { rozetleriYukle, Rozet } from '../rozetler';
import { gunlukGorevleriYukle, GunlukGorevDurumu } from '../gunlukGorevler';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 8;
const PADDING = 40; // 20 left + 20 right
const CARD_WIDTH = (SCREEN_WIDTH - PADDING - (GAP * 3)) / 4;

export function GorevlerEkrani() {
    const { renkler, koyuMu } = useTema();
    const { t } = useTranslation();

    // State
    const [yukleniyor, setYukleniyor] = useState(true);
    const [seviye, setSeviye] = useState<SeviyeDurumu | null>(null);
    const [rozetler, setRozetler] = useState<Rozet[]>([]);
    const [gorevDurumu, setGorevDurumu] = useState<GunlukGorevDurumu | null>(null);
    const [seciliRozet, setSeciliRozet] = useState<Rozet | null>(null);
    const [rozetModalGoster, setRozetModalGoster] = useState(false);
    const [aktifRozetTab, setAktifRozetTab] = useState<'tumu' | 'kazanilan' | 'kilitli'>('tumu');

    // Animasyon Değerleri
    const scrollY = useRef(new Animated.Value(0)).current;

    // Stagger animasyonları için
    const fadeAnims = useRef<Animated.Value[]>([]).current;
    const scaleAnims = useRef<Animated.Value[]>([]).current;

    useFocusEffect(
        useCallback(() => {
            verileriYukle();
        }, [])
    );

    const verileriYukle = async () => {
        if (!seviye) setYukleniyor(true);

        try {
            const [seviyeData, rozetData, gorevData] = await Promise.all([
                seviyeDurumuYukle(),
                rozetleriYukle(),
                gunlukGorevleriYukle()
            ]);

            setSeviye(seviyeData);
            setRozetler(rozetData.rozetler);
            setGorevDurumu(gorevData);

            // Yeni veri geldiğinde animasyonları tetikle
            startEntranceAnimations(gorevData.gorevler.length + 5);

        } catch (hata) {
            console.error('Görevler yüklenemedi:', hata);
        } finally {
            setYukleniyor(false);
        }
    };

    const startEntranceAnimations = (count: number) => {
        fadeAnims.length = 0;
        scaleAnims.length = 0;

        for (let i = 0; i < count; i++) {
            fadeAnims.push(new Animated.Value(0));
            scaleAnims.push(new Animated.Value(0.9));
        }

        const animations = fadeAnims.map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 400,
                    delay: i * 50,
                    useNativeDriver: true
                }),
                Animated.spring(scaleAnims[i], {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    delay: i * 50,
                    useNativeDriver: true
                })
            ])
        );

        Animated.stagger(50, animations).start();
    };

    const handleRozetPress = (rozet: Rozet) => {
        Haptics.selectionAsync();
        setSeciliRozet(rozet);
        setRozetModalGoster(true);
    };

    // Rozetleri filtrele
    const getFilteredBadges = () => {
        let filtered = rozetler;
        if (aktifRozetTab === 'kazanilan') filtered = rozetler.filter(r => r.kazanildi);
        if (aktifRozetTab === 'kilitli') filtered = rozetler.filter(r => !r.kazanildi);
        return filtered;
    };

    const filteredBadges = getFilteredBadges();

    if (yukleniyor) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: renkler.arkaplan }]}>
                <ActivityIndicator size="large" color={renkler.vurguAcik} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: renkler.arkaplan }]} edges={['top']}>
            {/* Header Arkaplan Efekti */}
            <View style={styles.headerBackground}>
                <LinearGradient
                    colors={koyuMu ? ['rgba(21, 32, 43, 0.9)', 'rgba(21, 32, 43, 0)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0)']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <Animated.ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Header Section */}
                <Animated.View style={[styles.header, { opacity: fadeAnims[0], transform: [{ scale: scaleAnims[0] }] }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: renkler.metin }]}>{t('gorevler.title')}</Text>
                        <Text style={[styles.headerSubtitle, { color: renkler.metinSoluk }]}>{t('gorevler.subtitle')}</Text>
                    </View>
                    <View style={[styles.headerIconContainer, { backgroundColor: renkler.kartArkaplan }]}>
                        <Text style={styles.headerIcon}>🎯</Text>
                    </View>
                </Animated.View>

                {/* Level Card - Hero Section */}
                {seviye && (
                    <Animated.View style={[styles.heroCardContainer, { opacity: fadeAnims[1], transform: [{ scale: scaleAnims[1] }] }]}>
                        <LinearGradient
                            colors={[renkler.vurguAcik, renkler.vurgu]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroContent}>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelNumber}>{seviye.seviye}</Text>
                                    <Text style={styles.levelText}>{t('home.level')}</Text>
                                </View>
                                <View style={styles.levelInfo}>
                                    <Text style={styles.levelTitle}>{t(seviye.unvan)}</Text>
                                    <Text style={styles.levelNext}>
                                        {seviye.sonrakiSeviyeXP - seviye.mevcutSeviyeXP} XP {t('home.remains')}
                                    </Text>
                                </View>
                                <View style={styles.xpBadge}>
                                    <Text style={[styles.xpText, { color: renkler.vurgu }]}>{seviye.toplamXP} XP</Text>
                                </View>
                            </View>

                            {/* Custom Tech Progress Bar */}
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${Math.min((seviye.mevcutSeviyeXP / seviye.sonrakiSeviyeXP) * 100, 100)}%` }
                                        ]}
                                    />
                                </View>
                                <View style={styles.progressLabels}>
                                    <Text style={styles.progressLabel}>{seviye.mevcutSeviyeXP}</Text>
                                    <Text style={styles.progressLabel}>{seviye.sonrakiSeviyeXP}</Text>
                                </View>
                            </View>

                            {/* Mini Stats Grid */}
                            <View style={styles.miniStatsGrid}>
                                <View style={styles.miniStat}>
                                    <Text style={styles.miniStatIcon}>💧</Text>
                                    <Text style={styles.miniStatVal}>+{XP_KAZANIMLARI.SU_ICME}</Text>
                                </View>
                                <View style={styles.miniStatDivider} />
                                <View style={styles.miniStat}>
                                    <Text style={styles.miniStatIcon}>🔥</Text>
                                    <Text style={styles.miniStatVal}>+{XP_KAZANIMLARI.STREAK_7}</Text>
                                </View>
                                <View style={styles.miniStatDivider} />
                                <View style={styles.miniStat}>
                                    <Text style={styles.miniStatIcon}>🏆</Text>
                                    <Text style={styles.miniStatVal}>+{XP_KAZANIMLARI.REKOR_KIRMA}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Daily Tasks Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitleText, { color: renkler.metin }]}>{t('gorevler.dailyTasks')}</Text>

                    {gorevDurumu?.gorevler.map((gorev, index) => {
                        const isCompleted = gorev.tamamlandi;
                        const progress = gorev.hedef > 0 ? (gorev.ilerleme / gorev.hedef) : (isCompleted ? 1 : 0);

                        return (
                            <Animated.View
                                key={gorev.id}
                                style={[
                                    styles.taskCard,
                                    {
                                        backgroundColor: renkler.kartArkaplan,
                                        opacity: fadeAnims[index + 2] || 1,
                                        transform: [{ scale: scaleAnims[index + 2] || 1 }]
                                    },
                                    isCompleted && styles.taskCardCompleted
                                ]}
                            >
                                <View style={styles.taskIconContainer}>
                                    <Text style={styles.taskIcon}>{isCompleted ? '✅' : gorev.emoji}</Text>
                                </View>

                                <View style={styles.taskContent}>
                                    <Text style={[styles.taskTitle, { color: renkler.metin }, isCompleted && styles.textCompleted]}>
                                        {t(gorev.baslik)}
                                    </Text>
                                    <Text style={[styles.taskDesc, { color: renkler.metinSoluk }]} numberOfLines={1}>
                                        {t(gorev.aciklama)}
                                    </Text>

                                    {/* Task Progress Bar */}
                                    <View style={styles.taskProgressBarBg}>
                                        <View
                                            style={[
                                                styles.taskProgressBarFill,
                                                {
                                                    width: `${Math.min(progress * 100, 100)}%`,
                                                    backgroundColor: isCompleted ? '#22c55e' : renkler.vurguAcik
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>

                                <View style={styles.taskReward}>
                                    <Text style={[styles.taskXp, isCompleted ? { color: '#22c55e' } : { color: renkler.vurguAcik }]}>+{gorev.xpOdulu} XP</Text>
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitleText, { color: renkler.metin }]}>{t('gorevler.badges')}</Text>
                        <View style={[styles.badgeCounter, { backgroundColor: renkler.kartArkaplan }]}>
                            <Text style={[styles.badgeCounterText, { color: renkler.metin }]}>
                                {rozetler.filter(r => r.kazanildi).length}/{rozetler.length}
                            </Text>
                        </View>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.tabsContainer}>
                        {['tumu', 'kazanilan', 'kilitli'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tab,
                                    { borderColor: 'rgba(0,0,0,0.1)' },
                                    aktifRozetTab === tab && { backgroundColor: renkler.vurguAcik, borderColor: renkler.vurguAcik }
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setAktifRozetTab(tab as any);
                                }}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: aktifRozetTab === tab ? '#fff' : renkler.metinSoluk }
                                ]}>
                                    {tab === 'tumu' ? t('gorevler.all') : tab === 'kazanilan' ? t('gorevler.earned') : t('gorevler.locked')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Badges Grid */}
                    <View style={styles.badgesGrid}>
                        {filteredBadges.map((rozet, index) => (
                            <TouchableOpacity
                                key={rozet.id}
                                style={[
                                    styles.badgeItem,
                                    { backgroundColor: renkler.kartArkaplan },
                                    rozet.kazanildi && styles.badgeItemEarned
                                ]}
                                onPress={() => handleRozetPress(rozet)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.badgeIconBg, rozet.kazanildi ? { backgroundColor: renkler.vurguAcik + '20' } : { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                                    <Text style={[styles.badgeEmoji, !rozet.kazanildi && { opacity: 0.5 }]}>
                                        {rozet.kazanildi ? rozet.emoji : '🔒'}
                                    </Text>
                                </View>
                                <Text style={[styles.badgeName, { color: renkler.metin }]} numberOfLines={1}>
                                    {t(rozet.isim)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Animated.ScrollView>

            {/* Modal */}
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
                    <View style={[styles.modalContent, { backgroundColor: renkler.kartArkaplan }]}>
                        {seciliRozet && (
                            <>
                                <View style={[styles.modalBadgeDisplay, { backgroundColor: seciliRozet.kazanildi ? '#e0f2fe' : '#f1f5f9' }]}>
                                    <Text style={styles.modalBadgeEmoji}>
                                        {seciliRozet.kazanildi ? seciliRozet.emoji : '🔒'}
                                    </Text>
                                </View>

                                <Text style={[styles.modalTitle, { color: renkler.metin }]}>
                                    {t(seciliRozet.isim)}
                                </Text>

                                <Text style={styles.modalDesc}>
                                    {t(seciliRozet.aciklama)}
                                </Text>

                                <View style={[styles.statusTag, { backgroundColor: seciliRozet.kazanildi ? '#dcfce7' : '#f1f5f9' }]}>
                                    <Text style={[styles.statusText, { color: seciliRozet.kazanildi ? '#166534' : '#64748b' }]}>
                                        {seciliRozet.kazanildi ? t('gorevler.earned') : t('gorevler.locked')}
                                    </Text>
                                </View>

                                {seciliRozet.kazanildi && (
                                    <Text style={styles.earningDate}>
                                        {t('gorevler.earnedDate')}: {new Date(seciliRozet.kazanilmaTarihi || new Date()).toLocaleDateString('tr-TR')}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setRozetModalGoster(false)}
                                >
                                    <Text style={styles.closeButtonText}>{t('common.close')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    contentContainer: { paddingHorizontal: 20, paddingBottom: 100 },

    headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: -1 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 15, marginTop: 2 },
    headerIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    headerIcon: { fontSize: 24 },

    // Hero Card
    heroCardContainer: { marginBottom: 24, shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
    heroCard: { borderRadius: 24, padding: 24, overflow: 'hidden' },
    heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    levelBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
    levelNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    levelText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
    levelInfo: { flex: 1, paddingHorizontal: 16 },
    levelTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    levelNext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    xpBadge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    xpText: { color: '#0284c7', fontWeight: 'bold', fontSize: 12 },

    progressBarContainer: { marginBottom: 20 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    progressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

    miniStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 16, padding: 12 },
    miniStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    miniStatIcon: { fontSize: 14 },
    miniStatVal: { color: '#fff', fontWeight: '600', fontSize: 12 },
    miniStatDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Sections
    sectionContainer: { marginBottom: 24 },
    sectionTitleText: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    badgeCounter: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeCounterText: { fontSize: 12, fontWeight: 'bold' },

    // Tasks
    taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    taskCardCompleted: { opacity: 0.8 },
    taskIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    taskIcon: { fontSize: 20 },
    taskContent: { flex: 1, marginRight: 12 },
    taskTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    taskDesc: { fontSize: 12 },
    textCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
    taskReward: { alignItems: 'flex-end' },
    taskXp: { fontSize: 13, fontWeight: 'bold' },
    taskProgressBarBg: { height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, marginTop: 8, width: '80%' },
    taskProgressBarFill: { height: '100%', borderRadius: 2 },

    // Tabs
    tabsContainer: { flexDirection: 'row', marginBottom: 16, gap: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    tabText: { fontSize: 13, fontWeight: '600' },

    // Badges
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
    badgeItem: { width: CARD_WIDTH, aspectRatio: 0.85, borderRadius: 16, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
    badgeItemEarned: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    badgeIconBg: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    badgeEmoji: { fontSize: 22 },
    badgeName: { fontSize: 9, fontWeight: '600', textAlign: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
    modalBadgeDisplay: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalBadgeEmoji: { fontSize: 40 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    modalDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
    statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
    statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    earningDate: { fontSize: 12, color: '#94a3b8', marginBottom: 20 },
    closeButton: { backgroundColor: '#0ea5e9', paddingVertical: 14, width: '100%', borderRadius: 16, alignItems: 'center' },
    closeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
