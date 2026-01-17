// ============================================
// INSIGHTS CARD - AI İçgörü Kartı
// ============================================
// Kişiselleştirilmiş içgörüleri gösteren kart

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { icgorulerUret, AIIcgoru } from '../aiUtils';
import { useTranslation } from 'react-i18next';

interface InsightsCardProps {
    onRefresh?: () => void;
}

export function InsightsCard({ onRefresh }: InsightsCardProps) {
    const [icgoruler, setIcgoruler] = useState<AIIcgoru[]>([]);
    const [modalGoster, setModalGoster] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        icgoruleriYukle();
    }, []);

    const icgoruleriYukle = async () => {
        setYukleniyor(true);
        const sonuclar = await icgorulerUret();
        setIcgoruler(sonuclar);
        setYukleniyor(false);
    };

    const oncelikRengi = (oncelik: string) => {
        switch (oncelik) {
            case 'yuksek': return '#FF5722';
            case 'orta': return '#FF9800';
            case 'dusuk': return '#4CAF50';
            default: return '#4FC3F7';
        }
    };

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
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{icgoruler.length}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.icgoruPreview}>
                    <Text style={styles.icgoruIcon}>{ilkIcgoru.icon}</Text>
                    <Text style={styles.icgoruMesaj} numberOfLines={2}>
                        {ilkIcgoru.mesaj}
                    </Text>
                </View>

                <Text style={styles.devamText}>{t('insights.seeAll')} ›</Text>
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
                            {icgoruler.map((icgoru, index) => (
                                <View
                                    key={icgoru.id}
                                    style={[
                                        styles.icgoruKart,
                                        { borderLeftColor: oncelikRengi(icgoru.oncelik) }
                                    ]}
                                >
                                    <View style={styles.icgoruKartHeader}>
                                        <Text style={styles.icgoruKartIcon}>{icgoru.icon}</Text>
                                        <View style={[
                                            styles.oncelikBadge,
                                            { backgroundColor: oncelikRengi(icgoru.oncelik) }
                                        ]}>
                                            <Text style={styles.oncelikText}>
                                                {icgoru.oncelik === 'yuksek' ? t('insights.important') :
                                                    icgoru.oncelik === 'orta' ? t('insights.medium') : t('insights.info')}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.icgoruKartMesaj}>{icgoru.mesaj}</Text>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.yenileButon}
                                onPress={() => {
                                    icgoruleriYukle();
                                    onRefresh?.();
                                }}
                            >
                                <Text style={styles.yenileText}>🔄 {t('insights.refresh')}</Text>
                            </TouchableOpacity>
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
    icgoruKart: {
        backgroundColor: '#1565C0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
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
