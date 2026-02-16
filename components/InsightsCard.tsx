// ============================================
// INSIGHTS CARD - AI İçgörü Kartı
// ============================================
// Premium entegrasyonlu kişiselleştirilmiş içgörüler

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { icgorulerUret, AIIcgoru, addInsightListener } from '../aiUtils';
import { usePremium } from '../PremiumContext';
import { useTranslation } from 'react-i18next';

interface InsightsCardProps {
    onRefresh?: () => void;
    bugunIcilen?: number;    // Bugün içilen su miktarı (ml) - gerçek zamanlı için
    gunlukHedef?: number;    // Günlük hedef (ml) - gerçek zamanlı için
    onPremiumPress?: () => void; // Premium modal açma fonksiyonu
}

export function InsightsCard({ onRefresh, bugunIcilen = 0, gunlukHedef = 2500, onPremiumPress }: InsightsCardProps) {
    const [icgoruler, setIcgoruler] = useState<AIIcgoru[]>([]);
    const [modalGoster, setModalGoster] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(true);
    const { t, i18n } = useTranslation();
    const { isPremium } = usePremium();

    // İçgörüleri yükle fonksiyonu
    const icgoruleriYukle = useCallback(async () => {
        setYukleniyor(true);
        const sonuclar = await icgorulerUret(bugunIcilen, gunlukHedef);
        setIcgoruler(sonuclar);
        setYukleniyor(false);
    }, [bugunIcilen, gunlukHedef, i18n.language]);

    // İlk yükleme
    useEffect(() => {
        icgoruleriYukle();
    }, []);

    // bugunIcilen veya gunlukHedef değiştiğinde güncelle
    useEffect(() => {
        icgoruleriYukle();
    }, [bugunIcilen, gunlukHedef, icgoruleriYukle]);

    // Event listener ile gerçek zamanlı güncelleme
    useEffect(() => {
        const unsubscribe = addInsightListener(() => {
            icgoruleriYukle();
        });
        return () => unsubscribe();
    }, [icgoruleriYukle]);

    const oncelikRengi = (oncelik: string) => {
        switch (oncelik) {
            case 'yuksek': return '#FF5722';
            case 'orta': return '#FF9800';
            case 'dusuk': return '#4CAF50';
            default: return '#4FC3F7';
        }
    };

    // Premium içgörü sayısı
    const premiumIcgoruSayisi = icgoruler.length > 1 ? icgoruler.length - 1 : 0;

    if (yukleniyor) {
        return null;
    }

    if (icgoruler.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>💡</Text>
                    <Text style={styles.headerText}>{t('insights.title')}</Text>
                </View>
                <Text style={styles.bosAciklama}>
                    🎯 {t('insights.noData')}
                </Text>
            </View>
        );
    }

    const ilkIcgoru = icgoruler[0];

    return (
        <>
            <TouchableOpacity
                style={styles.container}
                onPress={() => setModalGoster(true)}
                activeOpacity={0.8}
            >
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>💡</Text>
                    <Text style={styles.headerText}>{t('insights.title')}</Text>
                    {icgoruler.length > 1 && (
                        <View style={[styles.badge, !isPremium && styles.premiumBadge]}>
                            <Text style={styles.badgeText}>
                                {isPremium ? icgoruler.length : `+${premiumIcgoruSayisi} 👑`}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.icgoruPreview}>
                    <Text style={styles.icgoruIcon}>{ilkIcgoru.icon}</Text>
                    <Text style={styles.icgoruMesaj} numberOfLines={2}>
                        {ilkIcgoru.mesaj}
                    </Text>
                </View>

                <Text style={styles.devamText}>
                    {isPremium ? t('insights.seeAll') : t('insights.unlockMore')} ›
                </Text>
            </TouchableOpacity>

            <Modal
                visible={modalGoster}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalGoster(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalBaslik}>💡 {t('insights.title')}</Text>
                            <TouchableOpacity onPress={() => setModalGoster(false)}>
                                <Text style={styles.kapatButon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {icgoruler.map((icgoru, index) => {
                                // İlk içgörü herkese açık
                                const kilitli = !isPremium && index > 0;

                                return (
                                    <View key={icgoru.id} style={styles.icgoruWrapper}>
                                        <View
                                            style={[
                                                styles.icgoruKart,
                                                { borderLeftColor: oncelikRengi(icgoru.oncelik) },
                                                kilitli && styles.icgoruKartBlur
                                            ]}
                                        >
                                            <View style={styles.icgoruKartHeader}>
                                                <Text style={[styles.icgoruKartIcon, kilitli && styles.blurredText]}>
                                                    {kilitli ? '🔒' : icgoru.icon}
                                                </Text>
                                                <View style={[
                                                    styles.oncelikBadge,
                                                    { backgroundColor: kilitli ? '#666' : oncelikRengi(icgoru.oncelik) }
                                                ]}>
                                                    <Text style={styles.oncelikText}>
                                                        {kilitli ? '👑 PREMIUM' :
                                                            icgoru.oncelik === 'yuksek' ? t('insights.important') :
                                                                icgoru.oncelik === 'orta' ? t('insights.medium') : t('insights.info')}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.icgoruKartMesaj,
                                                    kilitli && styles.blurredText
                                                ]}
                                            >
                                                {kilitli
                                                    ? '████████████ ███████ ██████████ ████████████'
                                                    : icgoru.mesaj}
                                            </Text>
                                        </View>

                                        {/* Kilitli içgörü overlay */}
                                        {kilitli && (
                                            <TouchableOpacity
                                                style={styles.lockedOverlay}
                                                onPress={() => {
                                                    setModalGoster(false);
                                                    onPremiumPress?.();
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <LinearGradient
                                                    colors={['rgba(255,215,0,0.1)', 'rgba(255,165,0,0.2)']}
                                                    style={styles.lockedGradient}
                                                >
                                                    <Text style={styles.lockedIcon}>👑</Text>
                                                    <Text style={styles.lockedText}>{t('insights.tapToUnlock')}</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}

                            {/* Premium Banner - Eğer premium değilse */}
                            {!isPremium && icgoruler.length > 1 && (
                                <TouchableOpacity
                                    style={styles.premiumBanner}
                                    onPress={() => {
                                        setModalGoster(false);
                                        onPremiumPress?.();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#FFD700', '#FFA000', '#FFD700']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.premiumBannerGradient}
                                    >
                                        <Text style={styles.premiumBannerIcon}>💎</Text>
                                        <View style={styles.premiumBannerTextContainer}>
                                            <Text style={styles.premiumBannerTitle}>{t('insights.unlockAll')}</Text>
                                            <Text style={styles.premiumBannerSubtitle}>
                                                {t('insights.unlockAllDesc', { count: premiumIcgoruSayisi })}
                                            </Text>
                                        </View>
                                        <Text style={styles.premiumBannerArrow}>→</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Yenile butonu - sadece premium için */}
                            {isPremium && (
                                <TouchableOpacity
                                    style={styles.yenileButon}
                                    onPress={() => {
                                        icgoruleriYukle();
                                        onRefresh?.();
                                    }}
                                >
                                    <Text style={styles.yenileText}>🔄 {t('insights.refresh')}</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1565C0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#64B5F6',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    headerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
    },
    badge: {
        backgroundColor: '#FF5722',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    icgoruPreview: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    icgoruIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    icgoruMesaj: {
        flex: 1,
        fontSize: 14,
        color: '#E3F2FD',
        lineHeight: 20,
    },
    devamText: {
        textAlign: 'right',
        color: '#90CAF9',
        fontSize: 12,
    },
    bosAciklama: {
        fontSize: 14,
        color: '#E3F2FD',
        lineHeight: 22,
        textAlign: 'center',
        paddingVertical: 10,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0D47A1',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1565C0',
    },
    modalBaslik: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    kapatButon: {
        fontSize: 24,
        color: '#90CAF9',
        padding: 5,
    },
    modalScroll: {
        padding: 20,
    },

    // İçgörü Kartları
    icgoruWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    icgoruKart: {
        backgroundColor: '#1565C0',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
    },
    icgoruKartBlur: {
        backgroundColor: '#0D47A1',
        opacity: 0.7,
    },
    icgoruKartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icgoruKartIcon: {
        fontSize: 28,
        marginRight: 10,
    },
    blurredText: {
        opacity: 0.5,
    },
    oncelikBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    oncelikText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    icgoruKartMesaj: {
        fontSize: 14,
        color: '#E3F2FD',
        lineHeight: 22,
    },

    // Kilitli Overlay
    lockedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
        overflow: 'hidden',
    },
    lockedGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    lockedIcon: {
        fontSize: 24,
    },
    lockedText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Premium Banner
    premiumBanner: {
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
    },
    premiumBannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    premiumBannerIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    premiumBannerTextContainer: {
        flex: 1,
    },
    premiumBannerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    premiumBannerSubtitle: {
        fontSize: 12,
        color: '#333',
        marginTop: 2,
    },
    premiumBannerArrow: {
        fontSize: 24,
        color: '#1A1A1A',
        fontWeight: 'bold',
    },

    // Yenile butonu
    yenileButon: {
        backgroundColor: '#1976D2',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    yenileText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
