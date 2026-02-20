// ============================================
// PREMIUM EKRANI (Paywall)
// ============================================
// Uygulamanın ücretli özelliklerini tanıtan premium ekran
import Purchases from 'react-native-purchases'; // Bu importun sayfanın en üstünde olduğundan emin ol

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
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTema } from '../TemaContext';
import { premiumDurumKaydet } from '../premiumUtils';
import { usePremium } from '../PremiumContext';
import { useTranslation } from 'react-i18next';
import { responsiveStyles } from '../responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Feature and plan IDs - actual text will come from translations
const FEATURE_KEYS = [
    { id: 2, titleKey: 'premium.features.aiInsights', descKey: 'premium.features.aiInsightsDesc', emoji: '🧠' },
    { id: 4, titleKey: 'premium.features.badges', descKey: 'premium.features.badgesDesc', emoji: '💎' },
    { id: 5, titleKey: 'premium.features.reminders', descKey: 'premium.features.remindersDesc', emoji: '🔔' },
    { id: 6, titleKey: 'premium.features.themes', descKey: 'premium.features.themesDesc', emoji: '🎨' },
    { id: 7, titleKey: 'premium.features.reports', descKey: 'premium.features.reportsDesc', emoji: '📊' },
    { id: 8, titleKey: 'premium.features.plant', descKey: 'premium.features.plantDesc', emoji: '🌸' },
];

const PLAN_KEYS = [
    { id: 'aylik', titleKey: 'premium.plans.monthly', subKey: 'premium.plans.payMonthly', populer: false },
    { id: 'yillik', titleKey: 'premium.plans.yearly', subKey: 'premium.plans.mostPopular', populer: true },
    { id: 'omur_boyu', titleKey: 'premium.plans.lifetime', subKey: 'premium.plans.oneTime', populer: false },
];

interface PremiumEkraniProps {
    onClose: () => void;
}

export default function PremiumEkrani({ onClose }: PremiumEkraniProps) {
    const { renkler } = useTema();
    const { setPremium } = usePremium();
    const { t } = useTranslation();
    const [seciliPlan, setSeciliPlan] = useState<string>('yillik');
    const [restoring, setRestoring] = useState<boolean>(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const handleRestore = async () => {
        setRestoring(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // GERÇEK REVENUECAT BAĞLANTISI (Apple sunucularına gider)
            const customerInfo = await Purchases.restorePurchases();

            // 'premium' kısmı RevenueCat'te belirlediğin entitlement (hak) ID'sidir
            if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
                // Aktif abonelik bulundu!
                const yeniDurum = {
                    aktif: true,
                    paketId: 'yillik' as any,
                    satinAlmaTarihi: new Date().toISOString()
                };
                await premiumDurumKaydet(yeniDurum as any);
                setPremium(yeniDurum as any);

                Alert.alert(
                    t('common.success'),
                    t('premium.restore.success'),
                    [{ text: t('common.ok'), onPress: onClose }]
                );
            } else {
                // Aktif abonelik YOKSA bu uyarıyı vermeliyiz
                Alert.alert(
                    t('common.info', 'Bilgi'), // Eğer çeviride info yoksa varsayılan 'Bilgi' yazar
                    t('premium.restore.noActive')
                );
            }
        } catch (error) {
            // Kullanıcı şifre girmekten vazgeçerse veya internet koparsa
            Alert.alert(
                t('common.error'),
                t('premium.restore.error')
            );
        } finally {
            setRestoring(false);
        }
    };

    const handleSatinAl = async (planId?: string) => {
        const id = planId || seciliPlan;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // DİKKAT: RevenueCat üzerinden gerçek satın alma tetikleniyor
            // 'id' değeri (aylik, yillik, omur_boyu) Mağaza Ürün Kimliği (Product ID) ile eşleşmelidir.
            const { customerInfo } = await Purchases.purchaseProduct(id);

            // Satın alma başarılı olduysa, entitlement kontrolü yapıyoruz
            if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
                const yeniDurum = {
                    aktif: true,
                    paketId: id as any,
                    satinAlmaTarihi: new Date().toISOString()
                };

                await premiumDurumKaydet(yeniDurum as any);
                setPremium(yeniDurum as any);

                Alert.alert(
                    t('premium.congratulations'),
                    t('premium.purchaseSuccess'),
                    [{ text: t('common.great'), onPress: onClose }]
                );
            }
        } catch (error: any) {
            // Kullanıcı satın alma sayfasını kapatırsa (Cancel) hata vermiyoruz
            if (!error.userCancelled) {
                console.error("Purchase Error:", error);
                Alert.alert(
                    t('common.error'),
                    t('common.errorOccurred', 'Bir hata oluştu. Lütfen tekrar deneyin.')
                );
            }
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
                        <Text style={styles.headerSubtitle}>{t('premium.subtitle')}</Text>
                    </Animated.View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={responsiveStyles.container()}>
                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        {FEATURE_KEYS.map((feature, index) => (
                            <Animated.View
                                key={feature.id}
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
                                        <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                                    </View>
                                </LinearGradient>
                                <View style={styles.featureTextContainer}>
                                    <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                                    <Text style={styles.featureDetail}>{t(feature.descKey)}</Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Pricing Cards */}
                    <Text style={styles.sectionTitle}>{t('premium.selectPlan')}</Text>
                    <View style={styles.pricingContainer}>
                        {PLAN_KEYS.map((plan) => (
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
                                        <Text style={styles.populerBadgeText}>{t('premium.bestPrice')}</Text>
                                    </LinearGradient>
                                )}
                                <Text style={[styles.planTitle, (plan.populer || seciliPlan === plan.id) && { color: '#FFD700' }]}>{t(plan.titleKey)}</Text>
                                <Text style={styles.planPrice}>{t(`premium.prices.${plan.id}`)}</Text>
                                <Text style={styles.planSubtext}>{t(plan.subKey)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {t('premium.footer')}
                        </Text>
                    </View>
                </ScrollView>

                {/* Aksiyon Butonu */}
                <View style={[styles.buttonContainer, responsiveStyles.container()]}>
                    <TouchableOpacity style={styles.mainButton} onPress={() => handleSatinAl()}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA000']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>
                                {seciliPlan === 'aylik' ? t('premium.buttons.startTrial') : t('premium.buttons.subscribe')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.trialText}>
                        {seciliPlan === 'aylik' ? t('premium.trialText.monthly') :
                            seciliPlan === 'yillik' ? t('premium.trialText.yearly') :
                                t('premium.trialText.lifetime')}
                    </Text>
                    <View style={styles.legalLinksContainer}>
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                            <Text style={styles.legalLink}>{t('premium.legal.termsOfUse')}</Text>
                        </TouchableOpacity>
                        <Text style={styles.legalSeparator}>•</Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://serhatcirit1.github.io/Smart-Water-AI-Insights-Privacy-Policy/')}>
                            <Text style={styles.legalLink}>{t('premium.legal.privacyPolicy')}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.restoreButton}
                        onPress={handleRestore}
                        disabled={restoring}
                    >
                        <Text style={styles.restoreButtonText}>
                            {restoring ? t('premium.restore.restoring') : t('premium.restore.button')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView >
        </View >
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
    legalLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    legalLink: {
        color: '#64748B',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    legalSeparator: {
        color: '#64748B',
        fontSize: 12,
    },
    restoreButton: {
        marginTop: 15,
        alignSelf: 'center',
        paddingVertical: 5,
    },
    restoreButtonText: {
        color: '#64748B',
        fontSize: 12,
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
});
