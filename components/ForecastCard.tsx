// ============================================
// FORECAST CARD - Haftalık Tahmin Kartı
// ============================================
// Bu hızla gidersen... tahmini gösterir

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { haftalikTahminHesapla, AITahmin } from '../aiUtils';
import { useTranslation } from 'react-i18next';

interface ForecastCardProps {
    gunlukHedef: number;
    bugunIcilen: number;
}

export function ForecastCard({ gunlukHedef, bugunIcilen }: ForecastCardProps) {
    const [tahmin, setTahmin] = useState<AITahmin | null>(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const tahminHesapla = async () => {
            const sonuc = await haftalikTahminHesapla(gunlukHedef, bugunIcilen);
            setTahmin(sonuc);
        };

        if (gunlukHedef > 0) {
            tahminHesapla();
        }
    }, [gunlukHedef, bugunIcilen, i18n.language]);

    if (!tahmin) {
        return null;
    }

    // Progress bar genişliği
    const progressWidth = Math.min(100, tahmin.tamamlanmaOlasiligi);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>{tahmin.icon}</Text>
                <Text style={styles.baslik}>{t('forecast.title')}</Text>
            </View>

            <Text style={styles.mesaj}>{tahmin.mesaj}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${progressWidth}%`,
                                backgroundColor: progressWidth >= 80 ? '#4CAF50' :
                                    progressWidth >= 50 ? '#FF9800' : '#F44336'
                            }
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>%{tahmin.tamamlanmaOlasiligi}</Text>
            </View>

            {/* Detaylar */}
            <View style={styles.detaylar}>
                <View style={styles.detayItem}>
                    <Text style={styles.detayLabel}>{t('forecast.weeklyTotal')}</Text>
                    <Text style={styles.detayDeger}>{tahmin.haftalikHedef} ml</Text>
                </View>
                <View style={styles.detayDivider} />
                <View style={styles.detayItem}>
                    <Text style={styles.detayLabel}>{t('stats.weekly')}</Text>
                    <Text style={styles.detayDeger}>{tahmin.mevcutToplam} ml</Text>
                </View>
                <View style={styles.detayDivider} />
                <View style={styles.detayItem}>
                    <Text style={styles.detayLabel}>{t('stats.dailyAvg')}</Text>
                    <Text style={styles.detayDeger}>{tahmin.gunlukOrtalama} ml</Text>
                </View>
            </View>

            {tahmin.tamamlanmaGunu && (
                <View style={styles.tamamlanmaKart}>
                    <Text style={styles.tamamlanmaEmoji}>🎯</Text>
                    <Text style={styles.tamamlanmaText}>
                        {t('forecast.suggestion')}: <Text style={styles.tamamlanmaGun}>{tahmin.tamamlanmaGunu}</Text>
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1565C0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#42A5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 24,
        marginRight: 10,
    },
    baslik: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    mesaj: {
        fontSize: 14,
        color: '#E3F2FD',
        lineHeight: 20,
        marginBottom: 15,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    progressBg: {
        flex: 1,
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        width: 45,
        textAlign: 'right',
    },
    detaylar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
        padding: 12,
    },
    detayItem: {
        flex: 1,
        alignItems: 'center',
    },
    detayDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    detayLabel: {
        fontSize: 11,
        color: '#90CAF9',
        marginBottom: 4,
    },
    detayDeger: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    tamamlanmaKart: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.3)',
        borderRadius: 10,
        padding: 10,
        marginTop: 12,
    },
    tamamlanmaEmoji: {
        fontSize: 20,
        marginRight: 10,
    },
    tamamlanmaText: {
        fontSize: 13,
        color: '#E8F5E9',
    },
    tamamlanmaGun: {
        fontWeight: 'bold',
        color: '#A5D6A7',
    },
});
