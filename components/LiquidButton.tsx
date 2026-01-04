// ============================================
// LIQUID BUTTON - Animasyonlu Su Efekti
// ============================================
// Dalgalanan su efekti (jiroskop olmadan)

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LiquidButtonProps {
    onPress: () => void;
    bardakBoyutu: number;
    hedefeUlasti: boolean;
    fillPercent: number; // 0-100 arası doluluk
}

export function LiquidButton({ onPress, bardakBoyutu, hedefeUlasti, fillPercent }: LiquidButtonProps) {
    // Animasyon değerleri
    const waveAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [wavePhase, setWavePhase] = useState(0);

    // Sürekli dalga animasyonu
    useEffect(() => {
        const waveLoop = Animated.loop(
            Animated.timing(waveAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        );
        waveLoop.start();

        // Dalga fazını güncelle
        const interval = setInterval(() => {
            setWavePhase(prev => (prev + 0.1) % (Math.PI * 2));
        }, 50);

        return () => {
            waveLoop.stop();
            clearInterval(interval);
        };
    }, []);

    // Basma animasyonu
    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        // Dalga patlaması animasyonu
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.08,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();

        onPress();
    };

    // Su seviyesi hesaplama (minimum %25, maksimum %85)
    const waterLevel = Math.min(85, Math.max(25, 25 + (fillPercent * 0.6)));

    // Dalga yolu oluştur - animasyonlu
    const createWavePath = () => {
        const width = 130;
        const height = 130;
        const baseY = height * (1 - waterLevel / 100);

        // Animasyonlu dalga
        const waveHeight = 6;
        const wave1 = Math.sin(wavePhase) * waveHeight;
        const wave2 = Math.sin(wavePhase + Math.PI / 2) * waveHeight;
        const wave3 = Math.sin(wavePhase + Math.PI) * waveHeight;

        return `
            M 0 ${baseY + wave1}
            C ${width * 0.2} ${baseY + wave1 - waveHeight}
              ${width * 0.3} ${baseY + wave2 + waveHeight}
              ${width * 0.5} ${baseY + wave2}
            C ${width * 0.7} ${baseY + wave2 - waveHeight}
              ${width * 0.8} ${baseY + wave3 + waveHeight}
              ${width} ${baseY + wave3}
            L ${width} ${height}
            L 0 ${height}
            Z
        `;
    };

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
        ]}>
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={[
                    styles.button,
                    hedefeUlasti && styles.buttonComplete
                ]}
            >
                {/* Su Efekti */}
                <View style={styles.liquidContainer}>
                    <Svg width={130} height={130} viewBox="0 0 130 130">
                        <Defs>
                            <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={hedefeUlasti ? "#66BB6A" : "#4FC3F7"} stopOpacity="0.85" />
                                <Stop offset="0.5" stopColor={hedefeUlasti ? "#43A047" : "#29B6F6"} stopOpacity="0.9" />
                                <Stop offset="1" stopColor={hedefeUlasti ? "#2E7D32" : "#0288D1"} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>

                        {/* Ana dalga */}
                        <Path
                            d={createWavePath()}
                            fill="url(#waterGrad)"
                        />

                        {/* Üst şeffaf dalga katmanı */}
                        <Path
                            d={`
                                M 0 ${130 * (1 - waterLevel / 100) + Math.sin(wavePhase + 1) * 4 + 3}
                                Q 32 ${130 * (1 - waterLevel / 100) + Math.sin(wavePhase) * 5 - 3}
                                  65 ${130 * (1 - waterLevel / 100) + Math.sin(wavePhase + 0.5) * 4 + 2}
                                Q 98 ${130 * (1 - waterLevel / 100) + Math.sin(wavePhase + 1.5) * 5 + 4}
                                  130 ${130 * (1 - waterLevel / 100) + Math.sin(wavePhase + 2) * 4}
                                L 130 130
                                L 0 130
                                Z
                            `}
                            fill={hedefeUlasti ? "rgba(129, 199, 132, 0.35)" : "rgba(129, 212, 250, 0.35)"}
                        />
                    </Svg>
                </View>

                {/* Buton İçeriği */}
                <View style={styles.content}>
                    <Text style={styles.emoji}>💧</Text>
                    <Text style={styles.text}>Su İç</Text>
                    <Text style={styles.subtext}>+{bardakBoyutu} ml</Text>
                </View>

                {/* Parlaklık efekti */}
                <View style={styles.shine} />
                <View style={styles.shine2} />

                {/* Su baloncukları */}
                {fillPercent > 30 && (
                    <>
                        <View style={[styles.bubble, { left: 25, bottom: 30 }]} />
                        <View style={[styles.bubble, styles.bubbleSmall, { left: 45, bottom: 45 }]} />
                        <View style={[styles.bubble, { right: 30, bottom: 35 }]} />
                    </>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    button: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#0D47A1',
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#4FC3F7',
        shadowColor: '#4FC3F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 15,
    },
    buttonComplete: {
        borderColor: '#66BB6A',
        shadowColor: '#66BB6A',
        backgroundColor: '#1B5E20',
    },
    liquidContainer: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        right: 6,
        top: 6,
        borderRadius: 70,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    emoji: {
        fontSize: 36,
        marginBottom: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtext: {
        fontSize: 13,
        color: '#B3E5FC',
        marginTop: 2,
        fontWeight: '600',
    },
    shine: {
        position: 'absolute',
        top: 12,
        left: 25,
        width: 40,
        height: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 10,
        transform: [{ rotate: '-35deg' }],
    },
    shine2: {
        position: 'absolute',
        top: 25,
        left: 20,
        width: 20,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 5,
        transform: [{ rotate: '-35deg' }],
    },
    bubble: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    bubbleSmall: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
});
