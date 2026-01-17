// ============================================
// AYARLAR PANELİ COMPONENTİ
// ============================================
// Bildirim ayarlarını yönetir
// Accordion (aç/kapa) yapısı içerir

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import i18n from '../locales/i18n';

// --- ARALIK SEÇENEKLERİ ---
const ARALIK_SECENEKLERI = [
    { label: '30 dk', value: 30 },
    { label: '1 saat', value: 60 },
    { label: '2 saat', value: 120 },
    { label: '3 saat', value: 180 },
];

// --- PROPS TİPİ ---
interface AyarlarPaneliProps {
    bildirimAktif: boolean;
    hatirlatmaAraligi: number;
    onBildirimDegistir: (aktif: boolean) => void;
    onAralikDegistir: (aralik: number) => void;
    onTestGonder: () => void;
}

// --- COMPONENT ---
export function AyarlarPaneli({
    bildirimAktif,
    hatirlatmaAraligi,
    onBildirimDegistir,
    onAralikDegistir,
    onTestGonder,
}: AyarlarPaneliProps) {
    // Yerel state - sadece bu componenti ilgilendiriyor
    const [acik, setAcik] = useState(false);

    return (
        <View style={styles.container}>
            {/* Başlık - Tıklanınca aç/kapa */}
            <TouchableOpacity
                style={styles.baslik}
                onPress={() => setAcik(!acik)}
            >
                <Text style={styles.baslikYazi}>
                    ⚙️ {i18n.t('settings.notifications')} {acik ? '▼' : '▶'}
                </Text>
            </TouchableOpacity>

            {/* İçerik - Sadece açıksa göster */}
            {acik && (
                <View style={styles.icerik}>
                    {/* Bildirim Aç/Kapa */}
                    <View style={styles.satir}>
                        <Text style={styles.satiriYazi}>🔔 {i18n.t('settings.reminders')}</Text>
                        <Switch
                            value={bildirimAktif}
                            onValueChange={onBildirimDegistir}
                            trackColor={{ false: '#1565C0', true: '#4FC3F7' }}
                            thumbColor={bildirimAktif ? '#FFFFFF' : '#90CAF9'}
                        />
                    </View>

                    {/* Aralık Seçimi - Bildirim aktifse göster */}
                    {bildirimAktif && (
                        <>
                            <Text style={styles.aralikBaslik}>⏰ {i18n.t('settings.reminderFrequency')}</Text>
                            <View style={styles.aralikSecenekleri}>
                                {ARALIK_SECENEKLERI.map((secenek) => (
                                    <TouchableOpacity
                                        key={secenek.value}
                                        style={[
                                            styles.aralikButon,
                                            hatirlatmaAraligi === secenek.value && styles.aralikButonSecili,
                                        ]}
                                        onPress={() => onAralikDegistir(secenek.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.aralikButonYazi,
                                                hatirlatmaAraligi === secenek.value && styles.aralikButonYaziSecili,
                                            ]}
                                        >
                                            {secenek.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Test Butonu */}
                    <TouchableOpacity style={styles.testButonu} onPress={onTestGonder}>
                        <Text style={styles.testButonuYazi}>📲 {i18n.t('settings.testNotification')}</Text>
                    </TouchableOpacity>

                    {/* Bilgi Notu */}
                    <Text style={styles.bilgiNotu}>
                        💡 {i18n.t('settings.notificationInfo')}
                    </Text>
                </View>
            )}
        </View>
    );
}

// --- STİLLER ---
const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#1565C0',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    baslik: {
        padding: 16,
    },
    baslikYazi: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    icerik: {
        padding: 16,
        paddingTop: 0,
    },
    satir: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1976D2',
    },
    satiriYazi: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    aralikBaslik: {
        fontSize: 14,
        color: '#90CAF9',
        marginTop: 16,
        marginBottom: 12,
    },
    aralikSecenekleri: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    aralikButon: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#0D47A1',
        borderWidth: 1,
        borderColor: '#4FC3F7',
    },
    aralikButonSecili: {
        backgroundColor: '#4FC3F7',
    },
    aralikButonYazi: {
        fontSize: 14,
        color: '#4FC3F7',
    },
    aralikButonYaziSecili: {
        color: '#0D47A1',
        fontWeight: 'bold',
    },
    testButonu: {
        backgroundColor: '#FF9800',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    testButonuYazi: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    bilgiNotu: {
        fontSize: 12,
        color: '#90CAF9',
        marginTop: 12,
        textAlign: 'center',
    },
});
