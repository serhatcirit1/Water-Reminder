// ============================================
// ACHIEVEMENT MODAL - Başarı Bildirimi
// ============================================
// Rozet, hedef tamamlama ve görev bildirimleri için premium tasarım

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../locales/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AchievementType = 'goal' | 'badge' | 'task' | 'record' | 'streak';

interface AchievementModalProps {
    visible: boolean;
    onClose: () => void;
    type: AchievementType;
    title: string;
    subtitle?: string;
    emoji?: string;
    value?: string | number;
}

const THEME_COLORS: Record<AchievementType, { gradient: readonly [string, string]; accent: string }> = {
    goal: { gradient: ['#00C853', '#69F0AE'] as const, accent: '#00E676' },
    badge: { gradient: ['#FFD700', '#FFA000'] as const, accent: '#FFAB00' },
    task: { gradient: ['#7C4DFF', '#B388FF'] as const, accent: '#7C4DFF' },
    record: { gradient: ['#FF6D00', '#FFAB40'] as const, accent: '#FF9100' },
    streak: { gradient: ['#FF5252', '#FF8A80'] as const, accent: '#FF5252' },
};

const TYPE_EMOJIS: Record<AchievementType, string> = {
    goal: '🏆',
    badge: '🏅',
    task: '✅',
    record: '🌟',
    streak: '🔥',
};

export function AchievementModal({
    visible,
    onClose,
    type,
    title,
    subtitle,
    emoji,
    value,
}: AchievementModalProps) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const colors = THEME_COLORS[type];
    const defaultEmoji = emoji || TYPE_EMOJIS[type];

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);
            glowAnim.setValue(0);

            // Start animations
            Animated.parallel([
                // Pop-in effect
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                // Subtle rotation
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();

            // Glow pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [visible]);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-5deg', '0deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.blurContainer}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [
                                    { scale: scaleAnim },
                                    { rotate: rotateInterpolate },
                                ],
                            },
                        ]}
                    >
                        <TouchableOpacity activeOpacity={1}>
                            {/* Glow Effect */}
                            <Animated.View
                                style={[
                                    styles.glowEffect,
                                    {
                                        backgroundColor: colors.accent,
                                        opacity: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 0.6],
                                        }),
                                    },
                                ]}
                            />

                            <LinearGradient
                                colors={['#1a1a2e', '#16213e']}
                                style={styles.cardBackground}
                            >
                                {/* Top accent bar */}
                                <LinearGradient
                                    colors={colors.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.accentBar}
                                />

                                {/* Emoji Container */}
                                <View style={styles.emojiContainer}>
                                    <LinearGradient
                                        colors={colors.gradient}
                                        style={styles.emojiBackground}
                                    >
                                        <Text style={styles.emoji}>{defaultEmoji}</Text>
                                    </LinearGradient>
                                </View>

                                {/* Content */}
                                <View style={styles.content}>
                                    <Text style={[styles.title, { color: colors.accent }]}>
                                        {title}
                                    </Text>

                                    {value && (
                                        <Text style={styles.value}>{value}</Text>
                                    )}

                                    {subtitle && (
                                        <Text style={styles.subtitle}>{subtitle}</Text>
                                    )}
                                </View>

                                {/* Continue Button */}
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={onClose}
                                >
                                    <LinearGradient
                                        colors={colors.gradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        <Text style={styles.buttonText}>{i18n.t('common.continue')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    blurContainer: {
        flex: 1,
    },
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 340,
    },
    glowEffect: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        borderRadius: 40,
    },
    cardBackground: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    accentBar: {
        height: 4,
        width: '100%',
    },
    emojiContainer: {
        alignItems: 'center',
        marginTop: -30,
        marginBottom: 10,
    },
    emojiBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    emoji: {
        fontSize: 40,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    value: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 20,
    },
    continueButton: {
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
