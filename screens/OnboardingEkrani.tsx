// ============================================
// ONBOARDING EKRANI
// ============================================
// Modern premium onboarding slides

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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTema } from '../TemaContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- SLIDE VERISI ---
interface Slide {
    id: number;
    emoji: string;
    title: string;
    description: string;
}

const SLIDES: Slide[] = [
    {
        id: 1,
        emoji: '💧',
        title: 'Hoş Geldiniz!',
        description: 'Su tüketiminizi takip edin, hedeflerinize ulaşın ve sağlıklı bir yaşam sürün.',
    },
    {
        id: 2,
        emoji: '🎯',
        title: 'Hedeflerinizi Belirleyin',
        description: 'Kişiselleştirilmiş su içme hedefleri oluşturun ve günlük ilerlemenizi izleyin.',
    },
    {
        id: 3,
        emoji: '🔔',
        title: 'Akıllı Hatırlatmalar',
        description: 'AI destekli akıllı hatırlatmalarla hava durumuna ve bioritmize göre su içmeyi asla unutmayın.',
    },
    {
        id: 4,
        emoji: '🤖',
        title: 'Yapay Zeka Desteği',
        description: 'AI destekli kişiselleştirilmiş içgörüler, tahminler ve önerilerle su içme alışkanlıklarınızı optimize edin.',
    },
];

// --- COMPONENT ---
interface OnboardingEkraniProps {
    onComplete: () => void;
}

export default function OnboardingEkrani({ onComplete }: OnboardingEkraniProps) {
    const { renkler } = useTema();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Onboarding tamamlandı
    const handleComplete = async () => {
        await AsyncStorage.setItem('@onboarding_tamamlandi', 'true');
        onComplete();
    };

    // Atlama
    const handleSkip = async () => {
        await AsyncStorage.setItem('@onboarding_tamamlandi', 'true');
        onComplete();
    };

    // Scroll değiştiğinde
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

    return (
        <LinearGradient
            colors={[renkler.arkaplan, renkler.kartArkaplan]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Skip Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: renkler.metinSoluk }]}>Geç</Text>
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
                            onPress={handleComplete}
                            style={[styles.startButton, { backgroundColor: renkler.vurguAcik }]}
                        >
                            <Text style={[styles.startButtonText, { color: renkler.arkaplan }]}>
                                Başla 🚀
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
                                İleri →
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
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
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
});
