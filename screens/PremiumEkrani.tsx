// ============================================
// PREMIUM EKRANI (Paywall)
// ============================================
// Uygulamanın ücretli özelliklerini tanıtan premium ekran

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Image,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTema } from '../TemaContext';
import { premiumDurumKaydet } from '../premiumUtils';
import { usePremium } from '../PremiumContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PREMIUM_OZELLIKLER = [
    { id: 1, baslik: 'Sınırsız Geçmiş', detay: 'Yıllara dayanan verilerinizle gelişiminizi izleyin.', emoji: '📈' },
    { id: 2, baslik: 'Gelişmiş AI İçgörüleri', detay: 'Derin öğrenme ile su içme alışkanlıklarınızı analiz edin.', emoji: '🧠' },
    { id: 3, baslik: 'Apple Health & Sync', detay: 'Verilerinizi tüm cihazlarınızla senkronize edin.', emoji: '⌚' },
    { id: 4, baslik: 'Ödüllü Rozetler', detay: 'Sadece Premium üyelere özel 12+ nadir rozet.', emoji: '💎' },
    { id: 5, baslik: 'Akıllı Hatırlatmalar', detay: 'Hava durumu ve biyoritminize tam uyumlu bildirimler.', emoji: '🔔' },
    { id: 6, baslik: 'Özel Temalar', detay: '5 yeni renk paleti ve özel uygulama ikonları.', emoji: '🎨' },
    { id: 7, baslik: 'Veri Dışa Aktarma', detay: 'Tüm su tüketim verilerinizi CSV olarak indirin.', emoji: '📊' },
    { id: 8, baslik: 'Sanal Bitki', detay: 'Su içtikçe büyüyen ve çiçek açan bitkini yetiştir.', emoji: '🌸' },
    { id: 9, baslik: 'Bardak Koleksiyonu', detay: 'Özel bardak görselleriyle koleksiyonunu tamamla.', emoji: '🏆' },
    { id: 10, baslik: 'Aylık PDF Rapor', detay: 'Detaylı performans raporunu PDF olarak indir.', emoji: '📄' },
];

const FIYAT_PLANLARI = [
    { id: 'aylik', baslik: 'Aylık', fiyat: '49,99 TL', altMetin: 'Her ay öde', populer: false },
    { id: 'yillik', baslik: 'Yıllık', fiyat: '299,99 TL', altMetin: 'En Popüler • %50 tasarruf', populer: true },
    { id: 'omur_boyu', baslik: 'Ömür Boyu', fiyat: '799,99 TL', altMetin: 'Tek seferlik ödeme', populer: false },
];

interface PremiumEkraniProps {
    onClose: () => void;
}

export default function PremiumEkrani({ onClose }: PremiumEkraniProps) {
    const { renkler } = useTema();
    const { setPremium } = usePremium();
    const [seciliPlan, setSeciliPlan] = useState<string>('yillik');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const handleSatinAl = async (planId?: string) => {
        const id = planId || seciliPlan;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const yeniDurum = {
                aktif: true,
                paketId: id as any,
                satinAlmaTarihi: new Date().toISOString()
            };

            await premiumDurumKaydet(yeniDurum);
            setPremium(yeniDurum);

            Alert.alert(
                'Tebrikler! 🎉',
                'Artık bir Premium üyesiniz. Tüm özelliklere sınırsız erişim sağlayabilirsiniz.',
                [{ text: 'Harika!', onPress: onClose }]
            );
        } catch (error) {
            Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
        }
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0A192F', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
                        <View style={styles.premiumBadgeContainer}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA000']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.premiumBadgeGradient}
                            >
                                <Text style={styles.premiumBadge}>PRO</Text>
                            </LinearGradient>
                        </View>
                        <Text style={styles.headerTitle}>WATER PREMIUM</Text>
                        <Text style={styles.headerSubtitle}>Sağlık yolculuğunu bir üst seviyeye taşı</Text>
                    </Animated.View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Özellikler Listesi */}
                    <View style={styles.featuresContainer}>
                        {PREMIUM_OZELLIKLER.map((ozellik, index) => (
                            <Animated.View
                                key={ozellik.id}
                                style={[
                                    styles.featureItem,
                                    {
                                        opacity: fadeAnim, transform: [{
                                            translateX: slideAnim.interpolate({
                                                inputRange: [0, 50],
                                                outputRange: [0, index * 5]
                                            })
                                        }]
                                    }
                                ]}
                            >
                                <LinearGradient
                                    colors={['rgba(255,215,0,0.1)', 'rgba(255,160,0,0.05)']}
                                    style={styles.featureIconContainer}
                                >
                                    <View style={styles.featureIconInner}>
                                        <Text style={styles.featureEmoji}>{ozellik.emoji}</Text>
                                    </View>
                                </LinearGradient>
                                <View style={styles.featureTextContainer}>
                                    <Text style={styles.featureTitle}>{ozellik.baslik}</Text>
                                    <Text style={styles.featureDetail}>{ozellik.detay}</Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Fiyat Kartları */}
                    <Text style={styles.sectionTitle}>Planını Seç</Text>
                    <View style={styles.pricingContainer}>
                        {FIYAT_PLANLARI.map((plan) => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[
                                    styles.pricingCard,
                                    seciliPlan === plan.id && styles.pricingCardSecili,
                                    plan.populer && styles.pricingCardPopuler,
                                ]}
                                onPress={() => {
                                    setSeciliPlan(plan.id);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                {plan.populer && (
                                    <LinearGradient
                                        colors={['#FFD700', '#FFA000']}
                                        style={styles.populerBadge}
                                    >
                                        <Text style={styles.populerBadgeText}>EN İYİ FİYAT</Text>
                                    </LinearGradient>
                                )}
                                <Text style={[styles.planTitle, (plan.populer || seciliPlan === plan.id) && { color: '#FFD700' }]}>{plan.baslik}</Text>
                                <Text style={styles.planPrice}>{plan.fiyat}</Text>
                                <Text style={styles.planSubtext}>{plan.altMetin}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Alt Bilgi */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            İstediğiniz zaman iptal edebilirsiniz. Ödemeler Google Play Store / App Store hesabınızdan tahsil edilir.
                        </Text>
                    </View>
                </ScrollView>

                {/* Aksiyon Butonu */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.mainButton} onPress={() => handleSatinAl()}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA000']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>
                                {seciliPlan === 'aylik' ? 'ÜCRETSİZ DENEMEYİ BAŞLAT' : 'ŞİMDİ ABONE OL'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.trialText}>
                        {seciliPlan === 'aylik' ? 'İlk 7 gün ücretsiz, sonra aylık 49,99 TL' :
                            seciliPlan === 'yillik' ? 'Yıllık 299,99 TL • İstediğin zaman iptal et' :
                                'Tek seferlik ödeme • Sınırsız erişim'}
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        left: 20,
        top: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 18,
    },
    premiumBadgeContainer: {
        marginBottom: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    premiumBadgeGradient: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
    },
    premiumBadge: {
        color: '#000',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 4,
        textShadowColor: 'rgba(255,215,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    headerSubtitle: {
        color: '#90CAF9',
        fontSize: 14,
        marginTop: 8,
        opacity: 0.8,
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 160,
    },
    featuresContainer: {
        marginTop: 30,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 18,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureIconInner: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,215,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureEmoji: {
        fontSize: 26,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    featureDetail: {
        color: '#90CAF9',
        fontSize: 13,
        marginTop: 4,
        opacity: 0.7,
        lineHeight: 18,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 40,
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 1,
    },
    pricingContainer: {
        gap: 14,
    },
    pricingCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
    },
    pricingCardPopuler: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.03)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    pricingCardSecili: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 2,
    },
    populerBadge: {
        position: 'absolute',
        top: -14,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    populerBadgeText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    planTitle: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1,
    },
    planPrice: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 6,
    },
    planSubtext: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        marginTop: 40,
        paddingHorizontal: 30,
    },
    footerText: {
        color: '#475569',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.95)',
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    mainButton: {
        height: 64,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    trialText: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '500',
    },
});
