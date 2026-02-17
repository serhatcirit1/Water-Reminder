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
import { isTablet } from '../responsive';

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
                            colors={['#4527A0', '#1565C0', '#0097A7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            {/* Üst Kısım: Bugün İçilen Su (Öne Çıkan) */}
                            <View style={styles.heroSection}>
                                <Text style={styles.heroEmoji}>💧</Text>
                                <Text style={styles.heroTitle}>{t('share.todayIDrank')}</Text>
                                <View style={styles.amountContainer}>
                                    <Text style={styles.heroAmount}>
                                        {(bugunIcilen / 1000).toFixed(1)}
                                    </Text>
                                    <Text style={styles.heroUnit}>{t('common.liters')}</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View style={[styles.progressBarFill, { width: `${yuzde}%` }]} />
                                </View>
                                <Text style={styles.heroPercentage}>%{yuzde} {t('share.completed')}</Text>
                            </View>

                            {/* Orta Kısım: İstatistikler Grid */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxEmoji}>🔥</Text>
                                    <Text style={styles.statBoxValue}>{streak}</Text>
                                    <Text style={styles.statBoxLabel}>{t('share.streakDays')}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxEmoji}>⭐</Text>
                                    <Text style={styles.statBoxValue}>{seviye}</Text>
                                    <Text style={styles.statBoxLabel}>{t('share.levelLabel')}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxEmoji}>🏅</Text>
                                    <Text style={styles.statBoxValue}>{rozetSayisi}</Text>
                                    <Text style={styles.statBoxLabel}>{t('share.badgesLabel')}</Text>
                                </View>
                            </View>

                            {/* Alt Kısım: Motivasyon & Branding */}
                            <View style={styles.footerSection}>
                                <Text style={styles.motivationText}>"{motivasyonMesaji}"</Text>
                                <View style={styles.divider} />
                                <View style={styles.branding}>
                                    <Text style={styles.brandingText}>💧 Water Reminder App</Text>
                                </View>
                            </View>

                            {/* Dekoratif Efektler */}
                            <View style={styles.glowEffect} />
                            <View style={styles.glassEffect} />
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

const CARD_WIDTH = isTablet() ? 400 : SCREEN_WIDTH - 60;
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
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 25,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: 30,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        marginTop: 40,
        zIndex: 10,
    },
    heroEmoji: {
        fontSize: 60,
        marginBottom: 15,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    heroTitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 5,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    // Rakam ve birim için container
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Taban hizalama
        justifyContent: 'center',
        marginBottom: 10,
    },
    heroAmount: {
        fontSize: 80,
        fontWeight: '900',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 15,
        lineHeight: 90,
        // includeFontPadding: false, // Android'de dikey hizalamayı düzeltebilir
    },
    heroUnit: {
        fontSize: 24,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12, // Rakamın tabanına hizalamak için margin
        marginLeft: 8,
    },
    progressBarContainer: {
        width: '80%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50', // Başarı yeşili
        borderRadius: 4,
    },
    heroPercentage: {
        fontSize: 16,
        color: '#4CAF50', // Parlak yeşil
        fontWeight: 'bold',
        marginTop: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Stats Grid
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginVertical: 20,
        zIndex: 10,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)', // Glassmorphism
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statBoxEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    statBoxValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statBoxLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Footer
    footerSection: {
        alignItems: 'center',
        zIndex: 10,
    },
    motivationText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.95,
        marginBottom: 20,
        paddingHorizontal: 10,
        lineHeight: 22,
    },
    divider: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 15,
    },
    branding: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    brandingText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 0.5,
    },

    // Effects
    glowEffect: {
        position: 'absolute',
        top: -100,
        left: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(79, 195, 247, 0.2)',
    },
    glassEffect: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(105, 240, 174, 0.1)',
        transform: [{ rotate: '45deg' }],
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
