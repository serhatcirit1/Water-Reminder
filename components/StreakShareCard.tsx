// ============================================
// STREAK SHARE CARD
// ============================================
// Instagram Story için şık paylaşım kartı

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTema } from '../TemaContext';
import { useTranslation } from 'react-i18next';
import { gorselPaylas, metinPaylas, motivasyonelMesajUret, StreakPaylasimiVerisi } from '../shareUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreakShareCardProps {
    visible: boolean;
    onClose: () => void;
    streak: number;
    gunlukHedef: number;
    bugunIcilen: number;
    seviye: number;
    rozetSayisi: number;
}

export default function StreakShareCard({
    visible,
    onClose,
    streak,
    gunlukHedef,
    bugunIcilen,
    seviye,
    rozetSayisi,
}: StreakShareCardProps) {
    const { renkler } = useTema();
    const { t } = useTranslation();
    const cardRef = useRef<View>(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const yuzde = Math.min(100, Math.round((bugunIcilen / gunlukHedef) * 100));
    const motivasyonMesaji = motivasyonelMesajUret(streak);

    const handleGorselPaylas = async () => {
        if (!cardRef.current) return;

        setYukleniyor(true);
        try {
            await gorselPaylas(cardRef);
        } finally {
            setYukleniyor(false);
        }
    };

    const handleMetinPaylas = async () => {
        const veri: StreakPaylasimiVerisi = {
            streak,
            gunlukHedef,
            bugunIcilen,
            seviye,
            rozetSayisi,
        };
        await metinPaylas(veri);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: renkler.arkaplan }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: renkler.metin }]}>
                        📸 {t('share.createStory')}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeText, { color: renkler.vurguAcik }]}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Preview Card */}
                <View style={styles.previewContainer}>
                    <View ref={cardRef} collapsable={false} style={styles.cardWrapper}>
                        <LinearGradient
                            colors={['#0D47A1', '#1565C0', '#42A5F5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            {/* App Logo / Branding */}
                            <View style={styles.branding}>
                                <Text style={styles.brandingText}>💧 Water Reminder</Text>
                            </View>

                            {/* Main Streak Display */}
                            <View style={styles.streakContainer}>
                                <Text style={styles.fireEmoji}>🔥</Text>
                                <Text style={styles.streakNumber}>{streak}</Text>
                                <Text style={styles.streakLabel}>{t('share.dayStreak')}</Text>
                            </View>

                            {/* Motivational Message */}
                            <Text style={styles.motivationText}>{motivasyonMesaji}</Text>

                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statEmoji}>🎯</Text>
                                    <Text style={styles.statValue}>{yuzde}%</Text>
                                    <Text style={styles.statLabel}>{t('share.todayProgress')}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statEmoji}>⭐</Text>
                                    <Text style={styles.statValue}>{seviye}</Text>
                                    <Text style={styles.statLabel}>{t('share.level')}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statEmoji}>🏅</Text>
                                    <Text style={styles.statValue}>{rozetSayisi}</Text>
                                    <Text style={styles.statLabel}>{t('share.badges')}</Text>
                                </View>
                            </View>

                            {/* Water Amount */}
                            <View style={styles.waterAmount}>
                                <Text style={styles.waterText}>
                                    💧 {bugunIcilen} / {gunlukHedef} ml
                                </Text>
                            </View>

                            {/* Decorative Elements */}
                            <View style={styles.decorCircle1} />
                            <View style={styles.decorCircle2} />
                        </LinearGradient>
                    </View>
                </View>

                {/* Share Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.shareButton, styles.primaryButton]}
                        onPress={handleGorselPaylas}
                        disabled={yukleniyor}
                    >
                        {yukleniyor ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.shareButtonEmoji}>📷</Text>
                                <Text style={styles.shareButtonText}>{t('share.shareAsImage')}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.shareButton, styles.secondaryButton, { borderColor: renkler.vurguAcik }]}
                        onPress={handleMetinPaylas}
                    >
                        <Text style={styles.shareButtonEmoji}>📝</Text>
                        <Text style={[styles.shareButtonText, { color: renkler.vurguAcik }]}>
                            {t('share.shareAsText')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tip */}
                <Text style={[styles.tipText, { color: renkler.metinSoluk }]}>
                    💡 {t('share.instagramTip')}
                </Text>
            </View>
        </Modal>
    );
}

const CARD_WIDTH = SCREEN_WIDTH - 60;
const CARD_HEIGHT = CARD_WIDTH * 1.77; // Instagram story ratio (9:16)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: 30,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    branding: {
        alignItems: 'center',
    },
    brandingText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 1,
    },
    streakContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    fireEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    streakNumber: {
        fontSize: 100,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    streakLabel: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '600',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    motivationText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.9,
        paddingHorizontal: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 20,
        marginVertical: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    statEmoji: {
        fontSize: 28,
        marginBottom: 5,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    waterAmount: {
        alignItems: 'center',
    },
    waterText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: '600',
    },
    decorCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        top: -50,
        right: -50,
    },
    decorCircle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)',
        bottom: -30,
        left: -30,
    },
    buttonsContainer: {
        gap: 12,
        marginTop: 20,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: '#4FC3F7',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },
    shareButtonEmoji: {
        fontSize: 20,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    tipText: {
        textAlign: 'center',
        fontSize: 13,
        marginTop: 16,
    },
});
