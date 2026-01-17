// ============================================
// VIRTUAL PLANT - Sanal Bitki Büyütme
// ============================================
// İçilen su ile büyüyen ve çiçek açan sanal bitki

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

interface VirtualPlantProps {
    toplamMl: number; // Bugün içilen toplam ml
    gunlukHedef: number;
}

// Büyüme aşamaları
type PlantStage = 'seed' | 'sprout' | 'small' | 'medium' | 'large' | 'flowering';

const getPlantStage = (percent: number): PlantStage => {
    if (percent < 10) return 'seed';
    if (percent < 30) return 'sprout';
    if (percent < 50) return 'small';
    if (percent < 75) return 'medium';
    if (percent < 100) return 'large';
    return 'flowering';
};

const getPlantInfo = (stage: PlantStage) => {
    switch (stage) {
        case 'seed':
            return { emoji: '🌱', name: 'plant.seed', color: '#8D6E63' };
        case 'sprout':
            return { emoji: '🌿', name: 'plant.sprout', color: '#AED581' };
        case 'small':
            return { emoji: '🪴', name: 'plant.small', color: '#81C784' };
        case 'medium':
            return { emoji: '🌳', name: 'plant.medium', color: '#66BB6A' };
        case 'large':
            return { emoji: '🌲', name: 'plant.large', color: '#4CAF50' };
        case 'flowering':
            return { emoji: '🌸', name: 'plant.flowering', color: '#F48FB1' };
    }
};

export function VirtualPlant({ toplamMl, gunlukHedef }: VirtualPlantProps) {
    const { t } = useTranslation();
    const percent = Math.min(100, (toplamMl / gunlukHedef) * 100);
    const stage = getPlantStage(percent);
    const info = getPlantInfo(stage);

    // Animasyonlar
    const swayAnim = useRef(new Animated.Value(0)).current;
    const growAnim = useRef(new Animated.Value(0)).current;
    const flowerAnim = useRef(new Animated.Value(0)).current;

    // Sallanma animasyonu
    useEffect(() => {
        const swayAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(swayAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(swayAnim, {
                    toValue: -1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        swayAnimation.start();
        return () => swayAnimation.stop();
    }, []);

    // Büyüme animasyonu
    useEffect(() => {
        Animated.spring(growAnim, {
            toValue: percent / 100,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    }, [percent]);

    // Çiçek animasyonu
    useEffect(() => {
        if (stage === 'flowering') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flowerAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flowerAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [stage]);

    const swayRotate = swayAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-3deg', '3deg'],
    });

    const plantScale = growAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    return (
        <View style={styles.container}>
            {/* Saksı */}
            <View style={styles.potContainer}>
                <Svg width={80} height={50} viewBox="0 0 80 50">
                    {/* Saksı gövdesi */}
                    <Path
                        d="M10 10 L70 10 L65 45 C65 48 60 50 40 50 C20 50 15 48 15 45 Z"
                        fill="#8D6E63"
                    />
                    {/* Saksı üst kenarı */}
                    <Ellipse cx={40} cy={10} rx={32} ry={8} fill="#A1887F" />
                    {/* Toprak */}
                    <Ellipse cx={40} cy={12} rx={28} ry={6} fill="#5D4037" />
                </Svg>
            </View>

            {/* Bitki */}
            <Animated.View style={[
                styles.plantWrapper,
                {
                    transform: [
                        { rotate: swayRotate },
                        { scale: plantScale },
                    ],
                }
            ]}>
                {stage === 'seed' && (
                    <View style={styles.seed}>
                        <Text style={styles.seedEmoji}>🌑</Text>
                    </View>
                )}

                {stage === 'sprout' && (
                    <Svg width={40} height={60} viewBox="0 0 40 60">
                        {/* Gövde */}
                        <Path d="M20 60 L20 30" stroke="#7CB342" strokeWidth={3} />
                        {/* Yapraklar */}
                        <Path d="M20 40 Q10 30 15 20 Q22 28 20 40" fill="#8BC34A" />
                        <Path d="M20 40 Q30 30 25 20 Q18 28 20 40" fill="#9CCC65" />
                    </Svg>
                )}

                {stage === 'small' && (
                    <Svg width={60} height={80} viewBox="0 0 60 80">
                        {/* Gövde */}
                        <Path d="M30 80 L30 25" stroke="#558B2F" strokeWidth={4} />
                        {/* Yapraklar */}
                        <Path d="M30 50 Q10 35 18 15 Q32 32 30 50" fill="#689F38" />
                        <Path d="M30 50 Q50 35 42 15 Q28 32 30 50" fill="#7CB342" />
                        <Path d="M30 35 Q15 25 22 12 Q32 22 30 35" fill="#8BC34A" />
                        <Path d="M30 35 Q45 25 38 12 Q28 22 30 35" fill="#9CCC65" />
                    </Svg>
                )}

                {stage === 'medium' && (
                    <Svg width={80} height={100} viewBox="0 0 80 100">
                        {/* Gövde */}
                        <Path d="M40 100 L40 20" stroke="#33691E" strokeWidth={5} />
                        {/* Dallar ve yapraklar */}
                        <G>
                            <Path d="M40 70 Q15 55 25 30 Q42 50 40 70" fill="#558B2F" />
                            <Path d="M40 70 Q65 55 55 30 Q38 50 40 70" fill="#689F38" />
                            <Path d="M40 50 Q20 38 28 18 Q42 35 40 50" fill="#7CB342" />
                            <Path d="M40 50 Q60 38 52 18 Q38 35 40 50" fill="#8BC34A" />
                            <Path d="M40 35 Q25 25 32 10 Q42 22 40 35" fill="#9CCC65" />
                            <Path d="M40 35 Q55 25 48 10 Q38 22 40 35" fill="#AED581" />
                        </G>
                    </Svg>
                )}

                {stage === 'large' && (
                    <Svg width={100} height={120} viewBox="0 0 100 120">
                        {/* Gövde */}
                        <Path d="M50 120 L50 15" stroke="#1B5E20" strokeWidth={6} />
                        {/* Yoğun yapraklar */}
                        <G>
                            <Path d="M50 90 Q10 70 25 35 Q52 65 50 90" fill="#2E7D32" />
                            <Path d="M50 90 Q90 70 75 35 Q48 65 50 90" fill="#388E3C" />
                            <Path d="M50 65 Q15 48 30 20 Q52 45 50 65" fill="#43A047" />
                            <Path d="M50 65 Q85 48 70 20 Q48 45 50 65" fill="#4CAF50" />
                            <Path d="M50 45 Q25 32 38 10 Q52 28 50 45" fill="#66BB6A" />
                            <Path d="M50 45 Q75 32 62 10 Q48 28 50 45" fill="#81C784" />
                            <Circle cx={50} cy={12} r={10} fill="#AED581" />
                        </G>
                    </Svg>
                )}

                {stage === 'flowering' && (
                    <Animated.View style={{
                        opacity: flowerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                        }),
                    }}>
                        <Svg width={120} height={130} viewBox="0 0 120 130">
                            {/* Gövde */}
                            <Path d="M60 130 L60 25" stroke="#1B5E20" strokeWidth={6} />
                            {/* Yapraklar */}
                            <G>
                                <Path d="M60 100 Q15 80 30 45 Q62 75 60 100" fill="#2E7D32" />
                                <Path d="M60 100 Q105 80 90 45 Q58 75 60 100" fill="#388E3C" />
                                <Path d="M60 70 Q25 55 40 28 Q62 52 60 70" fill="#43A047" />
                                <Path d="M60 70 Q95 55 80 28 Q58 52 60 70" fill="#4CAF50" />
                            </G>
                            {/* Çiçekler */}
                            <G>
                                {/* Merkez çiçek */}
                                <Circle cx={60} cy={20} r={6} fill="#FFEB3B" />
                                <Circle cx={60} cy={8} r={8} fill="#F48FB1" />
                                <Circle cx={48} cy={15} r={8} fill="#F48FB1" />
                                <Circle cx={72} cy={15} r={8} fill="#F48FB1" />
                                <Circle cx={52} cy={28} r={8} fill="#F48FB1" />
                                <Circle cx={68} cy={28} r={8} fill="#F48FB1" />
                                {/* Sol çiçek */}
                                <Circle cx={25} cy={45} r={4} fill="#FFC107" />
                                <Circle cx={25} cy={38} r={6} fill="#CE93D8" />
                                <Circle cx={18} cy={43} r={6} fill="#CE93D8" />
                                <Circle cx={32} cy={43} r={6} fill="#CE93D8" />
                                {/* Sağ çiçek */}
                                <Circle cx={95} cy={45} r={4} fill="#FFC107" />
                                <Circle cx={95} cy={38} r={6} fill="#81D4FA" />
                                <Circle cx={88} cy={43} r={6} fill="#81D4FA" />
                                <Circle cx={102} cy={43} r={6} fill="#81D4FA" />
                            </G>
                        </Svg>
                    </Animated.View>
                )}
            </Animated.View>

            {/* Bilgi */}
            <View style={styles.infoContainer}>
                <Text style={styles.stageName}>{t(info.name)}</Text>
                <Text style={styles.progress}>{t('plant.growth', { percent: Math.round(percent) })}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 260,
        marginVertical: 10,
    },
    potContainer: {
        position: 'absolute',
        bottom: 50,
    },
    plantWrapper: {
        position: 'absolute',
        bottom: 90,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    seed: {
        alignItems: 'center',
    },
    seedEmoji: {
        fontSize: 20,
    },
    infoContainer: {
        position: 'absolute',
        bottom: 5,
        alignItems: 'center',
    },
    stageName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    progress: {
        fontSize: 11,
        color: '#81C784',
    },
    waterDrops: {
        position: 'absolute',
        top: 10,
        right: 20,
    },
    dropEmoji: {
        fontSize: 16,
        opacity: 0.7,
    },
});
