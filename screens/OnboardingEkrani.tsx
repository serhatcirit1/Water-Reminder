// ============================================
// ONBOARDING EKRANI
// ============================================
// Modern premium onboarding slides with profile setup

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    SafeAreaView,
    TextInput,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTema } from '../TemaContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { bildirimIzniIste } from '../bildirimler';
import { responsiveStyles } from '../responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- SLIDE VERISI ---
interface Slide {
    id: number;
    emoji: string;
    title: string;
    description: string;
}

// --- COMPONENT ---
interface OnboardingEkraniProps {
    onComplete: () => void;
}

export default function OnboardingEkrani({ onComplete }: OnboardingEkraniProps) {
    const { renkler } = useTema();
    const { t } = useTranslation();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Profile state
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [boy, setBoy] = useState('170');
    const [kilo, setKilo] = useState('70');
    const [cinsiyet, setCinsiyet] = useState<'erkek' | 'kadin'>('erkek');
    const [hedef, setHedef] = useState('2000');

    // Localized slides
    const SLIDES: Slide[] = [
        {
            id: 1,
            emoji: '💧',
            title: t('onboarding.welcome'),
            description: t('onboarding.welcomeDesc'),
        },
        {
            id: 2,
            emoji: '🎯',
            title: t('onboarding.goals'),
            description: t('onboarding.goalsDesc'),
        },
        {
            id: 3,
            emoji: '🔔',
            title: t('onboarding.reminders'),
            description: t('onboarding.remindersDesc'),
        },
        {
            id: 4,
            emoji: '🤖',
            title: t('onboarding.ai'),
            description: t('onboarding.aiDesc'),
        },
    ];

    // Calculate recommended water intake
    const hesaplaOnerilenHedef = (kg: number, erkekMi: boolean): number => {
        // Base formula: 30-35ml per kg body weight
        const baseMultiplier = erkekMi ? 35 : 30;
        const calculated = Math.round(kg * baseMultiplier / 100) * 100;
        return Math.max(1500, Math.min(4000, calculated));
    };

    // Update recommended goal when weight or gender changes
    const updateRecommendedGoal = (newKilo: string, newCinsiyet: 'erkek' | 'kadin') => {
        const kg = parseInt(newKilo) || 70;
        const recommended = hesaplaOnerilenHedef(kg, newCinsiyet === 'erkek');
        setHedef(recommended.toString());
    };

    // Save profile and complete onboarding
    const handleSaveProfile = async () => {
        try {
            await AsyncStorage.setItem('@kullanici_boy', boy);
            await AsyncStorage.setItem('@kullanici_kilo', kilo);
            await AsyncStorage.setItem('@kullanici_cinsiyet', cinsiyet);
            await AsyncStorage.setItem('@gunluk_hedef', hedef);
            await AsyncStorage.setItem('@onboarding_tamamlandi', 'true');
            await bildirimIzniIste();
            onComplete();
        } catch (error) {
            console.error('Profile save error:', error);
            onComplete();
        }
    };

    // Skip profile setup
    const handleSkipProfile = async () => {
        await AsyncStorage.setItem('@onboarding_tamamlandi', 'true');
        await bildirimIzniIste();
        onComplete();
    };

    // Complete slides and show profile setup
    const handleShowProfileSetup = () => {
        setShowProfileSetup(true);
    };

    // Go back to slides
    const handleBackToSlides = () => {
        setShowProfileSetup(false);
    };

    // Skip onboarding entirely
    const handleSkip = async () => {
        await AsyncStorage.setItem('@onboarding_tamamlandi', 'true');
        await bildirimIzniIste();
        onComplete();
    };

    // Scroll event
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / SCREEN_WIDTH);
                setCurrentIndex(index);
            },
        }
    );

    // Render slide
    const renderSlide = (slide: Slide, index: number) => {
        const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
        ];

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
        });

        return (
            <View key={slide.id} style={styles.slide}>
                <View style={[styles.slideContent, responsiveStyles.container()]}>
                    <Animated.View style={[styles.emojiContainer, { transform: [{ scale }], opacity }]}>
                        <Text style={styles.emoji}>{slide.emoji}</Text>
                    </Animated.View>

                    <Animated.View style={{ opacity }}>
                        <Text style={[styles.title, { color: renkler.metin }]}>{slide.title}</Text>
                        <Text style={[styles.description, { color: renkler.metinSoluk }]}>
                            {slide.description}
                        </Text>
                    </Animated.View>
                </View>
            </View>
        );
    };

    // Render dot indicator
    const renderDots = () => (
        <View style={styles.dotContainer}>
            {SLIDES.map((_, index) => {
                const inputRange = [
                    (index - 1) * SCREEN_WIDTH,
                    index * SCREEN_WIDTH,
                    (index + 1) * SCREEN_WIDTH,
                ];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: renkler.vurguAcik,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    // Profile Setup Screen
    const renderProfileSetup = () => (
        <View style={styles.profileContainer}>
            {/* Header */}
            <View style={styles.profileHeader}>
                <TouchableOpacity onPress={handleBackToSlides} style={styles.backButton}>
                    <Text style={[styles.backText, { color: renkler.metinSoluk }]}>← {t('common.back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkipProfile} style={styles.skipButton}>
                    <Text style={[styles.skipText, { color: renkler.metinSoluk }]}>{t('onboarding.skip')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={[styles.profileScroll, responsiveStyles.container()]} showsVerticalScrollIndicator={false}>
                {/* Title */}
                <View style={styles.profileTitleContainer}>
                    <Text style={styles.profileEmoji}>👤</Text>
                    <Text style={[styles.profileTitle, { color: renkler.metin }]}>
                        {t('onboarding.profileSetup')}
                    </Text>
                    <Text style={[styles.profileSubtitle, { color: renkler.metinSoluk }]}>
                        {t('onboarding.profileSetupDesc')}
                    </Text>
                </View>

                {/* Gender Selection */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: renkler.metin }]}>
                        {t('onboarding.gender')}
                    </Text>
                    <View style={styles.genderContainer}>
                        <TouchableOpacity
                            style={[
                                styles.genderButton,
                                cinsiyet === 'erkek' && { backgroundColor: renkler.vurguAcik },
                                { borderColor: renkler.vurguAcik }
                            ]}
                            onPress={() => {
                                setCinsiyet('erkek');
                                updateRecommendedGoal(kilo, 'erkek');
                            }}
                        >
                            <Text style={styles.genderEmoji}>👨</Text>
                            <Text style={[
                                styles.genderText,
                                { color: cinsiyet === 'erkek' ? '#fff' : renkler.metin }
                            ]}>
                                {t('onboarding.male')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.genderButton,
                                cinsiyet === 'kadin' && { backgroundColor: renkler.vurguAcik },
                                { borderColor: renkler.vurguAcik }
                            ]}
                            onPress={() => {
                                setCinsiyet('kadin');
                                updateRecommendedGoal(kilo, 'kadin');
                            }}
                        >
                            <Text style={styles.genderEmoji}>👩</Text>
                            <Text style={[
                                styles.genderText,
                                { color: cinsiyet === 'kadin' ? '#fff' : renkler.metin }
                            ]}>
                                {t('onboarding.female')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Height Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: renkler.metin }]}>
                        {t('onboarding.height')} (cm)
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: renkler.kartArkaplan, borderColor: renkler.sinir }]}>
                        <TextInput
                            style={[styles.textInput, { color: renkler.metin }]}
                            value={boy}
                            onChangeText={setBoy}
                            keyboardType="numeric"
                            placeholder="170"
                            placeholderTextColor={renkler.metinSoluk}
                            maxLength={3}
                        />
                        <Text style={[styles.inputUnit, { color: renkler.metinSoluk }]}>cm</Text>
                    </View>
                </View>

                {/* Weight Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: renkler.metin }]}>
                        {t('onboarding.weight')} (kg)
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: renkler.kartArkaplan, borderColor: renkler.sinir }]}>
                        <TextInput
                            style={[styles.textInput, { color: renkler.metin }]}
                            value={kilo}
                            onChangeText={(val) => {
                                setKilo(val);
                                updateRecommendedGoal(val, cinsiyet);
                            }}
                            keyboardType="numeric"
                            placeholder="70"
                            placeholderTextColor={renkler.metinSoluk}
                            maxLength={3}
                        />
                        <Text style={[styles.inputUnit, { color: renkler.metinSoluk }]}>kg</Text>
                    </View>
                </View>

                {/* Daily Goal */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: renkler.metin }]}>
                        {t('onboarding.dailyGoal')} (ml)
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: renkler.kartArkaplan, borderColor: renkler.sinir }]}>
                        <TextInput
                            style={[styles.textInput, { color: renkler.metin }]}
                            value={hedef}
                            onChangeText={setHedef}
                            keyboardType="numeric"
                            placeholder="2000"
                            placeholderTextColor={renkler.metinSoluk}
                            maxLength={4}
                        />
                        <Text style={[styles.inputUnit, { color: renkler.metinSoluk }]}>ml</Text>
                    </View>
                    <Text style={[styles.recommendedText, { color: renkler.vurguAcik }]}>
                        💡 {t('onboarding.recommended')}: {hesaplaOnerilenHedef(parseInt(kilo) || 70, cinsiyet === 'erkek')} ml
                    </Text>
                </View>

                {/* Goal Presets */}
                <View style={styles.presetContainer}>
                    {[1500, 2000, 2500, 3000].map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            style={[
                                styles.presetButton,
                                hedef === preset.toString() && { backgroundColor: renkler.vurguAcik },
                                { borderColor: renkler.vurguAcik }
                            ]}
                            onPress={() => setHedef(preset.toString())}
                        >
                            <Text style={[
                                styles.presetText,
                                { color: hedef === preset.toString() ? '#fff' : renkler.metin }
                            ]}>
                                {preset / 1000}L
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.profileFooter}>
                <TouchableOpacity
                    onPress={handleSaveProfile}
                    style={[styles.saveButton, { backgroundColor: renkler.vurguAcik }]}
                >
                    <Text style={[styles.saveButtonText, { color: renkler.arkaplan }]}>
                        {t('onboarding.startJourney')} 🚀
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Main render
    if (showProfileSetup) {
        return (
            <LinearGradient
                colors={[renkler.arkaplan, renkler.kartArkaplan]}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    {renderProfileSetup()}
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={[renkler.arkaplan, renkler.kartArkaplan]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Skip Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: renkler.metinSoluk }]}>{t('onboarding.skip')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Slides */}
                <Animated.ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    bounces={false}
                >
                    {SLIDES.map((slide, index) => renderSlide(slide, index))}
                </Animated.ScrollView>

                {/* Dots Indicator */}
                {renderDots()}

                {/* Bottom Button */}
                <View style={styles.footer}>
                    {currentIndex === SLIDES.length - 1 ? (
                        <TouchableOpacity
                            onPress={handleShowProfileSetup}
                            style={[styles.startButton, { backgroundColor: renkler.vurguAcik }]}
                        >
                            <Text style={[styles.startButtonText, { color: renkler.arkaplan }]}>
                                {t('common.next')} →
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                scrollViewRef.current?.scrollTo({
                                    x: (currentIndex + 1) * SCREEN_WIDTH,
                                    animated: true,
                                });
                            }}
                            style={[styles.nextButton, { borderColor: renkler.vurguAcik }]}
                        >
                            <Text style={[styles.nextButtonText, { color: renkler.vurguAcik }]}>
                                {t('common.next')} →
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        padding: 10,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    slideContent: {
        width: '100%',
        alignItems: 'center',
    },
    emojiContainer: {
        marginBottom: 40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(129, 212, 250, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        width: '100%',
    },
    description: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: 20,
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        height: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    footer: {
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    startButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    nextButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Profile Setup Styles
    profileContainer: {
        flex: 1,
    },
    profileHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    profileScroll: {
        flex: 1,
        paddingHorizontal: 30,
    },
    profileTitleContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    profileEmoji: {
        fontSize: 60,
        marginBottom: 16,
    },
    profileTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    profileSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    },
    inputUnit: {
        fontSize: 16,
        fontWeight: '500',
    },
    recommendedText: {
        fontSize: 14,
        marginTop: 8,
        fontWeight: '500',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    genderEmoji: {
        fontSize: 24,
    },
    genderText: {
        fontSize: 16,
        fontWeight: '600',
    },
    presetContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    presetButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    presetText: {
        fontSize: 14,
        fontWeight: '600',
    },
    profileFooter: {
        paddingHorizontal: 30,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    },
    saveButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
